// src/context/GameUIContext.jsx
import React, { createContext, useContext, useState } from 'react';

const GameUIContext = createContext();

export const useGameUI = () => useContext(GameUIContext);

export const GameUIProvider = ({ children, myPlayerState, opponentState, actions, promptChoice }) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [targeting, setTargeting] = useState({
        isTargeting: false,
        action: null,
        sourceCardId: null,
    });
    const [isHandOpen, setIsHandOpen] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);
    const [activeDragData, setActiveDragData] = useState(null);

    const cancelAllActions = () => {
        setSelectedCard(null);
        setTargeting({ isTargeting: false, action: null });
    };

    // Context-aware card click handler
    const onCardClick = (card, droppableId, isTargetable) => {
        // If the clicked card is not a valid target for the current action, do nothing.
        // This prevents misclicks from having any effect.
        if (targeting.isTargeting && !isTargetable && !promptChoice) {
            return;
        }

          if (droppableId === selectedCard) {
            cancelAllActions(); // Toggles everything off.
            return;
        }


        // Helper to create the target object
        const createTarget = (id) => {
            const parts = id.split('-');
            const owner = parts[0];
            const zone = parts[1];
            const index = parts[2] !== undefined ? Number(parts[2]) : null;
            return {
                playerId: owner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone,
                index,
            };
        };

        // --- SCENARIO 1: Resolving a multi-step ITEM PROMPT ---
        // We know it's an item prompt because 'promptChoice' is active.
        if (isTargetable && promptChoice) {
            const target = createTarget(droppableId);
            actions.playItemCard(null, target, promptChoice.phase, promptChoice.choosingState);
            // Don't clean up UI state here; wait for the 'game:updated' event from the server.
            return;
        }

        // --- SCENARIO 2: Resolving a standard ACTION (like an attack) ---
        // We know it's a standard action because 'targeting' is active, but 'promptChoice' is not.
        if (targeting.isTargeting) {
            if (!isTargetable) return;

            const target = createTarget(droppableId);
            const actionType = targeting.action?.type;

            // --- THIS IS THE FIX: Check the action type ---
            if (actionType === 'retreat') {
                // The retreat action needs the bench index.
                // We also add a sanity check to make sure we're targeting our own bench.
                const owner = droppableId.split('-')[0];
                if (owner === 'my' && target.zone === 'bench') {
                    actions.retreatActiveCard(target.index);
                }
            }
            else if (actionType === 'basic_attack' || actionType === 'special_attack') {
                // This is the correct path for attacks
                actions.performAttack(actionType, target);
            }
            // Future targeted actions can be added as more `else if` cases here.

            // Clean up the UI state after the action is dispatched.
            cancelAllActions();
            return;
        }

        // --- SCENARIO 3: Simply SELECTING a card ---
        // If neither of the above are true, the user is just selecting a card to see its actions.
        setSelectedCard(current => (current === droppableId ? null : droppableId));
    };

    // This function is now perfect. It sets the state to begin SCENARIO 2.
    const onActionClick = (action, sourceCardId) => {
        if (action.requiresTarget) {
            setTargeting({
                isTargeting: true,
                action: action,
            });
            // We keep the card selected so the user knows which card is attacking
        } else {
            // Logic for no-target actions can go here
            if (action.type === 'activate') {
                const index = sourceCardId.split("-")[2];
                actions.activateBenchCard(index);
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
            cancelAllActions
        }}>
            {children}
        </GameUIContext.Provider>
    );
};
