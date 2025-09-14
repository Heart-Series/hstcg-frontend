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
    const [resolutionState, setResolutionState] = useState({
        isActive: false,
        actions: []
    });

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

    // Context-aware card click handler
    const onCardClick = (clickedCard, isTargetable) => {
        const clickedInstanceId = clickedCard.instanceId;

        // Case 0: Toggling selection off
        if (clickedInstanceId === selectedCardId) {
            cancelAllActions();
            return;
        }

        // Case 1: We are in targeting mode to resolve an action.
        if (targeting.isTargeting && isTargetable) {

            if (targeting.isTargeting && isTargetable) {

                // SUB-CASE A: Are we resolving a special end-of-turn attack?
                // This check is the most specific, so it comes first.
                if (targeting.action.sourceCardId) {
                    actions.performResolutionAction(targeting.action, clickedInstanceId);
                }
                // SUB-CASE B: ELSE, are we resolving a multi-step prompt from an ability or item?
                else if (promptChoice) {
                    if (promptChoice.choosingState?.sourceInstanceId) {
                        actions.resolveAbilityStep(
                            promptChoice.choosingState.sourceInstanceId,
                            clickedInstanceId,
                            promptChoice.phase,
                            promptChoice.choosingState
                        );
                    }
                    else {
                        actions.playItemCard(
                            null,
                            clickedInstanceId,
                            promptChoice.phase,
                            promptChoice.choosingState
                        );
                    }
                }
                // SUB-CASE C: ELSE, it must be a standard, single-step action.
                else if (targeting.action) {
                    const actionType = targeting.action.type;
                    if (actionType === 'retreat') {
                        const benchIndex = myPlayerState.bench.findIndex(c => c && c.instanceId === clickedInstanceId);
                        if (benchIndex > -1) actions.retreatActiveCard(benchIndex);
                    } else if (actionType === 'basic_attack' || actionType === 'special_attack') {
                        actions.performAttack(targeting.action.type, clickedInstanceId);
                    }
                }

                // After any of the above actions are sent, clean up the UI.
                cancelAllActions();
                return;
            }

        }

        // Case 2: We are not in targeting mode, so just select the card.
        setSelectedCardId(clickedInstanceId);
    };

    // onActionClick now just sets targeting state.
    const onActionClick = (action, sourceCardData) => {
        if (action.type === 'view') {
            openInspector(sourceCardData);
            setSelectedCardId(null);
            return;
        }

        if (resolutionState.isActive && action.sourceCardId) {
            setTargeting({
                isTargeting: true,
                action: action, // This is a resolution action
                validTargets: action.validTargets || [],
            });
            // Keep the card selected
            return;
        }

        if (action.isMultiPhase) {
            console.log(`Starting multi-phase action: ${action.type}`);
            // This is a complex ability like Revenge. Its first step needs an initial target.
            // Even though Revenge ignores this target, the system needs one to start.
            const initialTarget = opponentState?.activeCard;
            if (initialTarget) {
                // Call our new action to START the ability chain.
                // We pass the source (Satonix) and an initial target.
                actions.resolveAbilityStep(sourceCardData.instanceId, initialTarget.instanceId, 1, null);
                cancelAllActions(); // Clean up the UI
            } else {
                // Handle case where there's no opponent active card
                alert("Cannot use this ability without an active opponent.");
            }
            return; // IMPORTANT: Stop processing here.
        }


        if (action.requiresTarget) {
            setTargeting({ isTargeting: true, action: action, });
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
            openInspector, closeInspector,
            viewingCardPile,
            openCardPileViewer, closeCardPileViewer,
            showToast,
            resolutionState, setResolutionState
        }}>
            {children}
        </GameUIContext.Provider>
    );
};
