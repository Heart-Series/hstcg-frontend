// src/context/GameUIContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const GameUIContext = createContext();

export const useGameUI = () => useContext(GameUIContext);

export const GameUIProvider = ({ children, myPlayerState, opponentState, actions, promptChoice }) => {
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

    const showToast = useCallback((message, options = {}) => {
        toast(message, options);
    }, []);


    const cancelAllActions = () => {
        setSelectedCardId(null);
        setTargeting({ isTargeting: false, action: null });
    };


    // Context-aware card click handler
    const onCardClick = (clickedCard, isTargetable) => {
        const clickedInstanceId = clickedCard.instanceId;

        // Case 0: Toggling selection off
        if (clickedInstanceId === selectedCardId) {
            cancelAllActions();
            return;
        }

        console.log(targeting.validTargets, clickedInstanceId);

        // Case 1: Resolving a prompt (from an item or attack)
        if (targeting.isTargeting && (targeting.validTargets?.includes(clickedInstanceId) || targeting.action.validTargets?.includes(clickedInstanceId))) {
            // We are targeting, and this card is a valid choice.

            // Is this target for a multi-step item effect? (like Piston phase 3)
            if (promptChoice) {
                actions.playItemCard(
                    null, // No new card instanceId from hand
                    clickedInstanceId, // The instanceId of the card we just clicked
                    promptChoice.phase,
                    promptChoice.choosingState
                );
            }
            // Is this target for a standard attack or retreat?
            else if (targeting.action) {
                const actionType = targeting.action.type;
                if (actionType === 'retreat') {
                    const benchIndex = myPlayerState.bench.findIndex(c => c && c.instanceId === clickedInstanceId);
                    if (benchIndex > -1) actions.retreatActiveCard(benchIndex);
                } else if (actionType === 'basic_attack' || actionType === 'special_attack') {
                    actions.performAttack(actionType, clickedInstanceId);
                }
            }

            // Action sent, so we clear all selections and targeting states.
            cancelAllActions();
            return;
        }

        // Case 2: Selecting a new card
        if (clickedInstanceId === selectedCardId) {
            cancelAllActions();
        } else {
            // Select a new card
            setSelectedCardId(clickedInstanceId);
        }
    };

    // onActionClick now just sets targeting state.
    const onActionClick = (action, sourceCardData) => {
        if (action.type === 'view') {
            openInspector(sourceCardData);
            setSelectedCardId(null);
            return;
        }
        if (action.requiresTarget) {
            setTargeting({ isTargeting: true, action: action });
            // selectedCardId remains set, so we know who is attacking.
        } else {

            if (action.type == 'activate') {
                actions.activateBenchCard(action.payload?.benchIndex)
            }

            // The action has been sent, so we clear all UI states.
            cancelAllActions();
        }
    };

    return (
        <GameUIContext.Provider value={{
            selectedCardId, setSelectedCardId,
            targeting, setTargeting,
            isHandOpen, setIsHandOpen,
            activeDragId, setActiveDragId,
            activeDragData, setActiveDragData,
            onCardClick,
            onActionClick,
            cancelAllActions,
            inspectorCardData,
            openInspector,
            closeInspector,
            viewingCardPile,
            openCardPileViewer,
            closeCardPileViewer,
            showToast
        }}>
            {children}
        </GameUIContext.Provider>
    );
};
