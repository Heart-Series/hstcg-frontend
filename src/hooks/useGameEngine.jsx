// src/hooks/useGameEngine.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useParams } from 'react-router-dom';

export const useGameEngine = (initialGameState, callbacks = {}) => {
    const [gameState, setGameState] = useState(initialGameState);
    const [error, setError] = useState(null); // To display game errors
    const [promptChoice, setPromptChoice] = useState(null);
    const socket = useSocket();
    const { user } = useAuth();
    const { gameId } = useParams();
     const { showToast = () => {} } = callbacks;


    // Listener for all server updates
    useEffect(() => {
        console.log("Setting up game engine listeners");
        if (!socket) return;

        const handleGameUpdate = (newGameState) => {
            console.log("Received game:updated", newGameState);
            setGameState(newGameState);
            setPromptChoice(null); // Clear any prompt on game update
        };
        const handleGameError = (errorMessage) => {
            console.error("Game Error:", errorMessage);
            setError(errorMessage);
            // Clear the error message after a few seconds
            setTimeout(() => setError(null), 3000);
        };
        const handlePromptChoice = (payload) => {
            console.log("Received game:promptChoice", payload);

           setPromptChoice(payload);
        };

        const handleEffectActivated = (payload) => {
            console.log("Received game:effectActivated", payload);
            if (payload.message) {
                showToast(payload.message);
            }
        };

        socket.on('game:updated', handleGameUpdate);
        socket.on('game:error', handleGameError);
        socket.on('game:promptChoice', handlePromptChoice);
        socket.on('game:effectActivated', handleEffectActivated);

        return () => {
            socket.off('game:updated', handleGameUpdate);
            socket.off('game:error', handleGameError);
            socket.off('game:promptChoice', handlePromptChoice);
            socket.off('game:effectActivated', handleEffectActivated);
        };
    }, [socket, gameState, showToast]);

    // --- Unified Player Action ---
    const performAction = useCallback((type, payload = {}) => {
        if (socket) {
            socket.emit('game:action', { type, payload });
        }
    }, [socket]);

    // --- Player Actions ---
    // These now call performAction with the correct type and payload
    const playCard = useCallback((cardId, target) => {
        performAction('playCardFromHand', { cardId, target });
    }, [performAction]);

    const endTurn = useCallback(() => {
        performAction('endTurn');
    }, [performAction]);

    const setInitialActive = useCallback((instanceId) => {
        performAction('setInitialActive', { instanceId });
    }, [performAction]);

    const playCardToBench = useCallback((instanceId, benchIndex) => {
        performAction('playCardToBench', { instanceId, benchIndex });
    }, [performAction]);

    const playSupportCard = useCallback((instanceId) => {
        performAction('playSupportCard', { instanceId });
    }, [performAction]);

    const playItemCard = useCallback((instanceId, target, phase = 1, choosingState = null) => {
        performAction('playItemCard', { instanceId, target, phase, choosingState });
    }, [performAction]);

    const resolveAbilityStep = useCallback((sourceInstanceId, target, phase = 1, choosingState = null) => {
        performAction('resolveAbilityStep', { sourceInstanceId, target, phase, choosingState });
    }, [performAction]);

    const performAttack = useCallback((attackType, target,) => {
        performAction('performAttack', { attackType, target});
    }, [performAction]);

    const retreatActiveCard = useCallback((benchIndex) => {
        performAction('retreatActiveCard', { benchIndex });
    }, [performAction]);

    const activateBenchCard = useCallback((benchIndex) => {
        performAction('activateBenchCard', { benchIndex });
    }, [performAction]);

    // --- Derived State ---
    // Helper values to make the UI components' lives easier.
    const myPlayerState = gameState?.players[socket?.id];
    const opponentState = Object.entries(gameState?.players || {})
        .find(([id]) => id !== socket?.id)?.[1];
    const isMyTurn = gameState?.phase === 'main_phase' && gameState?.activePlayerId === socket?.id;

    // A new variable to determine if the player can interact with their hand.
    const canPerformAction =
        (gameState?.phase === 'setup' && !myPlayerState?.hasChosenActive) || isMyTurn;

    return {
        gameState,
        error,
        myPlayerState,
        opponentState,
        isMyTurn,
        canPerformAction,
        promptChoice,
        actions: {
            playCard,
            endTurn,
            setInitialActive,
            playCardToBench,
            playSupportCard,
            playItemCard,
            performAttack,
            resolveAbilityStep,
            retreatActiveCard,
            activateBenchCard,
        },
    };
};