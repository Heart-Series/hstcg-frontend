// src/context/GameUIContext.jsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const GameUIContext = createContext();

export const useGameUI = () => useContext(GameUIContext);

export const GameUIProvider = ({ children, value: externalValue }) => {
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [targeting, setTargeting] = useState({
        isTargeting: false,
        action: null,
        sourceCardId: null,
    });
    const [isHandOpen, setIsHandOpen] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);
    const [activeDragData, setActiveDragData] = useState(null);
    const [inspectorCardData, setInspectorCardData] = useState(null);
    const [viewingCardPile, setViewingCardPile] = useState(null); // Will be null or an object { title, cards }
    const [resolutionState, setResolutionState] = useState({
        isActive: false,
        actions: []
    });
    const [animation, setAnimation] = useState(null);

    const showAnimation = useCallback((animationData) => {
        setAnimation(animationData);
    }, []);

    const hideAnimation = useCallback(() => {
        setAnimation(null);
    }, []);

    const openInspector = (cardData) => {
        setInspectorCardData(cardData);
    };

    const closeInspector = () => {
        setInspectorCardData(null);
    };

    const openCardPileViewer = (title, cards) => {
        setViewingCardPile({ title, cards });
    };

    const closeCardPileViewer = () => {
        setViewingCardPile(null);
    };

    const handleDragStart = (event) => {
        const { active } = event;
        // active.data.current holds the extra info we'll attach to the card
        setActiveDragId(active.id);
        setActiveDragData(active.data.current);
        // Collapse the hand when a drag starts
        setIsHandOpen(false);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        setActiveDragId(null);
        setActiveDragData(null);

        if (!over) return;

        // --- THE ONLY IDENTIFIER WE NEED FROM THE DRAGGED CARD ---
        const draggedCard = active.data.current?.cardData;
        const instanceId = active.data.current?.cardData?.instanceId;
        if (!instanceId) return; // If for some reason there's no ID, do nothing.
        console.log(instanceId)

        const dropZoneId = over.id;

        if (draggedCard?.initiatesUI === 'inspector') {
            const parts = dropZoneId.split('-');
            const owner = parts[0];
            const zone = parts[1];
            const index = parts[2] !== undefined ? parseInt(parts[2]) : null;

            // Find the card that was dropped on from the gameState
            const player = owner === 'my' ? myPlayerState : opponentState;
            const targetCard = zone === 'active' ? player.activeCard : player.bench[index];

            if (targetCard) {
                openInspector(targetCard);
            }
            // We do NOT send an action to the backend yet. The UI takes over.
            return;
        }

        // --- Handle dropping based on the game phase and drop zone ID ---
        if (active.data.current?.cardData?.cardType === 'Item') {
            const parts = dropZoneId.split('-');
            const owner = parts[0];
            const zone = parts[1];
            const idx = parts[2];

            const target = {
                playerId: owner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone: zone,
                index: idx !== undefined ? parseInt(idx) : null,
            };

            // Call the correct action for items.
            actions.playItemCard(instanceId, target);
            return; // Action sent, stop processing.
        }

        // --- CHECK 2: Was something dropped on the active slot during setup? ---
        if (gameState.phase === 'setup' && dropZoneId === 'my-active') {
            actions.setInitialActive(instanceId);
            return;
        }

        // --- CHECK 3 : Was a Player Card dropped on an EMPTY active slot during the main phase? ---
        if (gameState.phase === 'main_phase' && dropZoneId === 'my-active' && !myPlayerState.activeCard) {
            actions.playCardToActive(instanceId);
            return;
        }

        // --- CHECK 4: Was a PLAYER card dropped on a bench slot? ---
        if (gameState.phase === 'main_phase' && dropZoneId.startsWith('my-bench-')) {
            const benchIndex = parseInt(dropZoneId.split('-')[2]);
            actions.playCardToBench(instanceId, benchIndex);
            return;
        }

        // --- CHECK 5: Was a SUPPORT card dropped on the support slot? ---
        if (gameState.phase === 'main_phase' && dropZoneId === 'my-support') {
            actions.playSupportCard(instanceId);
            return;
        }
    };

    const showToast = useCallback((message, options = {}) => {

        const renderToast = (t) => (
            <span onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
                {message}
            </span>
        );

        switch (options.style) {
            case 'success':
                toast.success(renderToast);
                break;
            case 'error':
                toast.error(renderToast);
                break;
            default: // 'info' or anything else
                toast(renderToast, { icon: 'ℹ️' });
                break;
        }
    }, []);


    const cancelAllActions = () => {
        setSelectedCardId(null);
        setTargeting({ isTargeting: false, action: null, });
    };

    const baseValue = {
        selectedCardId, setSelectedCardId,
        targeting, setTargeting,
        isHandOpen, setIsHandOpen,
        activeDragId, setActiveDragId,
        activeDragData, setActiveDragData,
        cancelAllActions,
        inspectorCardData,
        openInspector, closeInspector,
        viewingCardPile,
        openCardPileViewer, closeCardPileViewer,
        showToast,
        resolutionState, setResolutionState,
        animation,      // The current animation data (or null)
        showAnimation,  // The function to START an animation
        hideAnimation,  // The function to STOP an animation
        handleDragStart,
        handleDragEnd,
    }

    const finalValue = externalValue || baseValue;

    return (
        <GameUIContext.Provider value={{
            ...finalValue
        }}>
            {children}
        </GameUIContext.Provider>
    );
};
