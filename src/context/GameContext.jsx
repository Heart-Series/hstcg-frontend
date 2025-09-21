import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useGameEngine } from '../hooks/useGameEngine';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children, initialGameState, isSpectator }) => {
    // === PART 1: All UI State Hooks ===
    const [targeting, setTargeting] = useState({ isTargeting: false, action: null });
    const [isHandOpen, setIsHandOpen] = useState(false);
    const [inspectorCardData, setInspectorCardData] = useState(null);
    const [viewingCardPile, setViewingCardPile] = useState(null);
    const [resolutionState, setResolutionState] = useState({ isActive: false, actions: [] });
    const [animation, setAnimation] = useState(null);
    const [activeDragId, setActiveDragId] = useState(null);
    const [activeDragData, setActiveDragData] = useState(null);
    const [selectedCardId, setSelectedCardId] = useState(null);

    // === PART 2: All UI Callback Functions ===
    const showToast = useCallback((message, options = {}) => {
        const renderToast = (t) => (
            <span onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
                {message}
            </span>
        );
        switch (options.style) {
            case 'success': toast.success(renderToast); break;
            case 'error': toast.error(renderToast); break;
            default: toast(renderToast, { icon: 'ℹ️' }); break;
        }
    }, []);

    const showAnimation = useCallback((animationData) => setAnimation(animationData), []);
    const hideAnimation = useCallback(() => setAnimation(null), []);
    const openCardPileViewer = useCallback((title, cards) => setViewingCardPile({ title, cards }), []);
    const closeCardPileViewer = useCallback(() => setViewingCardPile(null), []);
    const openInspector = useCallback((cardData) => setInspectorCardData(cardData), []);
    const cancelAllActions = useCallback(() => {
        setSelectedCardId(null);
        setTargeting({ isTargeting: false, action: null });
    }, []);
    const closeInspector = useCallback(() => setInspectorCardData(null), []);

    // === PART 3: The Game Engine Hook ===
    const gameEngineData = useGameEngine(initialGameState, isSpectator, {
        showToast, setResolutionState, openCardPileViewer, showAnimation,
    });
    const { actions, myPlayerState, opponentState, promptChoice, gameState } = gameEngineData;

    // === PART 4: The Complex Event Handlers (The "Bridge") ===
    const handleDragStart = useCallback((event) => {
        setActiveDragId(event.active.id);
        setActiveDragData(event.active.data.current);
        setIsHandOpen(false);
    }, []);

    const handleDragEnd = useCallback((event) => {
        setActiveDragId(null);
        setActiveDragData(null);
        const { active, over } = event;
        if (!over) return;

        const draggedCard = active.data.current?.cardData;
        const instanceId = draggedCard?.instanceId;
        if (!instanceId) return;

        const dropZoneId = over.id;

        if (draggedCard?.initiatesUI === 'inspector') {
            const parts = dropZoneId.split('-');
            const player = parts[0] === 'my' ? myPlayerState : opponentState;
            const targetCard = parts[1] === 'active' ? player.activeCard : player.bench[parseInt(parts[2])];
            if (targetCard) openInspector(targetCard);
            return;
        }
        if (draggedCard?.cardType === 'Item') {
            const parts = dropZoneId.split('-');
            const target = {
                playerId: parts[0] === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone: parts[1],
                index: parts[2] !== undefined ? parseInt(parts[2]) : null,
            };
            actions.playItemCard(instanceId, target);
            return;
        }
        if (gameState.phase === 'setup' && dropZoneId === 'my-active') {
            actions.setInitialActive(instanceId);
            return;
        }
        if (gameState.phase === 'main_phase') {
            if (dropZoneId === 'my-active' && !myPlayerState.activeCard) actions.playCardToActive(instanceId);
            else if (dropZoneId.startsWith('my-bench-')) actions.playCardToBench(instanceId, parseInt(dropZoneId.split('-')[2]));
            else if (dropZoneId === 'my-support') actions.playSupportCard(instanceId);
        }
    }, [actions, gameState, myPlayerState, opponentState, openInspector]);

    const onCardClick = useCallback((clickedCard, isTargetable) => {
        if (!actions) return;
        const clickedInstanceId = clickedCard.instanceId;
        if (clickedInstanceId === selectedCardId) {
            cancelAllActions();
            return;
        }
        if (targeting.isTargeting && isTargetable) {
            if (targeting.action.sourceCardId) {
                actions.performResolutionAction(targeting.action, clickedInstanceId);
            } else if (promptChoice) {
                if (promptChoice.choosingState?.sourceInstanceId) {
                    actions.resolveAbilityStep(promptChoice.choosingState.sourceInstanceId, clickedInstanceId, promptChoice.phase, promptChoice.choosingState);
                } else {
                    actions.playItemCard(null, clickedInstanceId, promptChoice.phase, promptChoice.choosingState);
                }
            } else if (targeting.action) {
                const actionType = targeting.action.type;
                if (actionType === 'retreat') {
                    const benchIndex = myPlayerState.bench.findIndex(c => c && c.instanceId === clickedInstanceId);
                    if (benchIndex > -1) actions.retreatActiveCard(benchIndex);
                } else if (actionType === 'basic_attack' || actionType === 'special_attack') {
                    actions.performAttack(targeting.action.type, clickedInstanceId);
                }
            }
            cancelAllActions();
            return;
        }
        setSelectedCardId(clickedInstanceId);
    }, [actions, selectedCardId, targeting, promptChoice, myPlayerState, cancelAllActions]);

    const onActionClick = useCallback((action, sourceCardData) => {
        if (!actions) return;
        if (action.type === 'view') {
            openInspector(sourceCardData);
            setSelectedCardId(null);
            return;
        }
        if (resolutionState.isActive && action.sourceCardId) {
            setTargeting({ isTargeting: true, action: action, validTargets: action.validTargets || [] });
            return;
        }
        if (action.isMultiPhase) {
            const initialTarget = opponentState?.activeCard;
            if (initialTarget) {
                actions.resolveAbilityStep(sourceCardData.instanceId, initialTarget.instanceId, 1, null);
                cancelAllActions();
            } else {
                alert("Cannot use this ability without an active opponent.");
            }
            return;
        }
        if (action.requiresTarget) {
            setTargeting({ isTargeting: true, action: action });
        } else {
            if (action.type === 'activate') {
                actions.activateBenchCard(action.payload?.benchIndex);
            }
            cancelAllActions();
        }
    }, [actions, resolutionState, opponentState, cancelAllActions, openInspector]);

    const promptMessage = useMemo(() => {
        if (resolutionState.isActive) return "End-of-Turn Actions";
        if (targeting.isTargeting && targeting.action?.title) return targeting.action.title;
        if (promptChoice?.title) return promptChoice.title;
        return null;
    }, [resolutionState.isActive, targeting, promptChoice]);


    // === PART 5: The Final Value Object ===
    const value = {
        ...gameEngineData,
        targeting, setTargeting,
        isHandOpen, setIsHandOpen,
        inspectorCardData, openInspector, closeInspector,
        viewingCardPile, openCardPileViewer, closeCardPileViewer,
        resolutionState,
        animation, showAnimation, hideAnimation,
        activeDragId,
        activeDragData,
        selectedCardId,
        // expose setters and utilities that existed on GameUIContext
        setSelectedCardId,
        setActiveDragId,
        setActiveDragData,
        showToast,
        setResolutionState,
        onCardClick,
        onActionClick,
        cancelAllActions,
        handleDragStart,
        handleDragEnd,
        promptMessage
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};