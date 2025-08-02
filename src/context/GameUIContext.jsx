// src/context/GameUIContext.jsx
import React, { createContext, useContext, useState } from 'react';

const GameUIContext = createContext();

export const useGameUI = () => useContext(GameUIContext);

export const GameUIProvider = ({ children, myPlayerState, opponentState, actions }) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [targeting, setTargeting] = useState({
        isTargeting: false,
        action: null,
        sourceCardId: null,
    });
    const [isHandOpen, setIsHandOpen] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);
    const [activeDragData, setActiveDragData] = useState(null);

    // Context-aware card click handler
    const onCardClick = (card, droppableId) => {
        if (targeting.isTargeting && actions && myPlayerState && opponentState) {
            // --- Logic for when a TARGET is clicked ---
            const parts = droppableId.split('-');
            const targetOwner = parts[0];
            const targetZone = parts[1];
            const targetIndex = Number(parts[2])
            const target = {
                playerId: targetOwner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone: targetZone,
                index: targetIndex,
            };
            if (targeting.action.type === 'retreat') {
                // Only allow retreat to own bench
                if (targetOwner === 'my' && targetZone === 'bench' && typeof targetIndex === 'number') {
                    actions.retreatActiveCard(targetIndex);
                }
                setTargeting({ isTargeting: false, action: null, sourceCardId: null });
                setSelectedCard(null);
            } else {
                actions.performAttack(targeting.action.type, target);
                setTargeting({ isTargeting: false, action: null, sourceCardId: null });
                setSelectedCard(null);
            }

            return actions;
        } else {
            setSelectedCard(current => (current === droppableId ? null : droppableId));
        }
    };

    // Context-aware action click handler
    const onActionClick = (action, sourceCardId) => {
        // console.log(action.requiresTarget)
        // console.log(sourceCardId)
        const index = sourceCardId.split("-")[2]
        // console.log(index)
        if (action.requiresTarget) {
            setTargeting({
                isTargeting: true,
                action: action,
                sourceCardId: sourceCardId,
            });
        } else {
            // Immediately perform the action if no target is required
            if (action.type === 'retreat') {
                // For retreat, sourceCardId is the active card, but we need a bench index, so do nothing (should always require target)
                // Optionally, show error or feedback
            } else if (action.type === 'basic_attack' || action.type === 'special_attack') {
                // For attacks, should always require target
            } else if (action.type === 'activate') {
                actions.activateBenchCard(index)
            } else if (action.onClick) {
                // If the action has a custom handler
                action.onClick();
            }
            setSelectedCard(null);
        }
    };

    return (
        <GameUIContext.Provider value={{
            selectedCard, setSelectedCard,
            targeting, setTargeting,
            isHandOpen, setIsHandOpen,
            activeDragId, setActiveDragId,
            activeDragData, setActiveDragData,
            onCardClick,
            onActionClick,
        }}>
            {children}
        </GameUIContext.Provider>
    );
};
