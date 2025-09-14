// src/hooks/useGameEngine.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useRef } from 'react';

export const useGameEngine = (initialGameState, isSpectator = false, callbacks = {}) => {
    const [gameState, setGameState] = useState(initialGameState);
    const [isSpectatorMode, setIsSpectatorMode] = useState(isSpectator);
    const [promptChoice, setPromptChoice] = useState(null);
    const socket = useSocket();
    const { user } = useAuth();
    const { gameId } = useParams();
    const { showToast = () => { }, setResolutionState = () => { }, openCardPileViewer = () => { }, showAnimation = () => { } } = callbacks;

    const hasAttemptedRejoin = useRef(false);

    useEffect(() => {
        // We only attempt to rejoin if:
        // 1. We have NO initial state from the lobby.
        // 2. The gameState hasn't been populated by an event yet.
        // 3. We haven't already tried.
        if (!initialGameState && !gameState && socket && gameId && !hasAttemptedRejoin.current) {
            console.log("No initial state. Attempting to rejoin or spectate...");
            socket.emit('game:rejoinOrSpectate', { gameId });
            hasAttemptedRejoin.current = true; // Mark that we've tried.
        }
    }, [socket, gameId, initialGameState, gameState]); // Add dependencies to be thorough

    // Listener for all server updates
    useEffect(() => {
        console.log("Setting up game engine listeners");
        if (!socket) return;

        const handleGameUpdate = (newGameState) => {
            console.log("Received game:updated", newGameState);
            setGameState(newGameState);
            setResolutionState({
                isActive: newGameState.phase === 'action_resolution_phase',
                actions: newGameState.resolutionActions || []
            });
            setPromptChoice(null); // Clear any prompt on game update
        };
        const handleGameError = (errorMessage) => {
            console.error("Game Error:", errorMessage);
            if (errorMessage) {
                // Use our toast system to show the error!
                showToast(errorMessage, { style: 'error' });
            }
        };
        const handlePromptChoice = (payload) => {
            console.log("Received game:promptChoice", payload);

            setPromptChoice(payload);
        };

        // const handleEffectActivated = (payload) => {
        //     console.log("Received game:effectActivated", payload);
        //     if (payload.message) {
        //         showToast(payload.message);
        //     }
        // };

        const handleShowToast = (payload) => {
            console.log("Received game:showToast", payload);
            if (payload.message) {
                // Pass the whole payload, which includes the 'style' property
                showToast(payload.message, payload);
            }
        };

        const handleShowReveal = (payload) => {
            console.log("Received game:showReveal", payload);
            if (payload.cards && payload.cards.length > 0) {
                // We can reuse the CardPileViewer for this!
                openCardPileViewer(payload.title, payload.cards);
            }
        };

        const handlePlayAnimation = (payload) => {
            console.log("Received game:playAnimation", payload);
            // The hook's only job is to call the function the component gave it.
            showAnimation(payload);
        };

        const handleSpectateStart = ({ gameState: spectateState }) => {
            console.log("Spectator mode activated.");
            setGameState(spectateState);
            setIsSpectatorMode(true);
        };

        socket.on('game:playAnimation', handlePlayAnimation);
        socket.on('game:showToast', handleShowToast);
        socket.on('game:updated', handleGameUpdate);
        socket.on('game:error', handleGameError);
        socket.on('game:promptChoice', handlePromptChoice);
        socket.on('game:showReveal', handleShowReveal);
        socket.on('spectate:start', handleSpectateStart);
        // socket.on('game:effectActivated', handleEffectActivated);

        return () => {
            socket.off('game:showToast', handleShowToast);
            socket.off('game:updated', handleGameUpdate);
            socket.off('game:error', handleGameError);
            socket.off('game:promptChoice', handlePromptChoice);
            socket.off('game:showReveal', handleShowReveal);
            socket.off('spectate:start', handleSpectateStart);
            // socket.off('game:effectActivated', handleEffectActivated);
        };
    }, [socket, showToast, openCardPileViewer, showAnimation, setResolutionState]);

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

    const performResolutionAction = useCallback((action, target) => {
        // We need to merge the action data from the backend with the target from the frontend
        const payload = { ...action, target };
        performAction('performResolutionAction', payload);
    }, [performAction]);

    const resolvePhase = useCallback(() => {
        performAction('resolvePhase');
    }, [performAction]);

    const endTurn = useCallback(() => {
        performAction('endTurn');
    }, [performAction]);

    const setInitialActive = useCallback((instanceId) => {
        performAction('setInitialActive', { instanceId });
    }, [performAction]);

    const playCardToActive = useCallback((instanceId) => {
        performAction('playCardToActive', { instanceId });
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
        performAction('performAttack', { attackType, target });
    }, [performAction]);

    const retreatActiveCard = useCallback((benchIndex) => {
        performAction('retreatActiveCard', { benchIndex });
    }, [performAction]);

    const activateBenchCard = useCallback((benchIndex) => {
        performAction('activateBenchCard', { benchIndex });
    }, [performAction]);

    // --- Derived State ---
    // Helper values to make the UI components' lives easier.
    const { myPlayerState, opponentState } = useMemo(() => {
        if (!gameState?.players) return { myPlayerState: null, opponentState: null };

        const playerIds = Object.keys(gameState.players);

        if (isSpectatorMode) {
            // For a spectator, "my" player is just the first one, "opponent" is the second.
            const myId = playerIds[0];
            const opponentId = playerIds[1];
            return {
                myPlayerState: gameState.players[myId],
                opponentState: gameState.players[opponentId]
            };
        } else {
            // For a player, find their state using their own socket.id
            const myPlayer = gameState.players[socket?.id];
            const opponent = Object.values(gameState.players).find(p => p.socketId !== socket?.id);
            return {
                myPlayerState: myPlayer,
                opponentState: opponent
            };
        }
    }, [gameState, socket?.id, isSpectatorMode]);
    const isMyTurn = (gameState?.phase === 'main_phase' && gameState?.activePlayerId === socket?.id) ||
        (gameState?.phase === 'action_resolution_phase' && gameState?.playerInResolution === socket?.id);


    // A new variable to determine if the player can interact with their hand.
    const canPerformAction =
        (gameState?.phase === 'setup' && !myPlayerState?.hasChosenActive) || isMyTurn;

    return {
        gameState,
        myPlayerState,
        opponentState,
        isMyTurn,
        canPerformAction,
        promptChoice,
        isSpectator: isSpectatorMode,
        actions: {
            playCard,
            endTurn,
            setInitialActive,
            playCardToActive,
            playCardToBench,
            playSupportCard,
            playItemCard,
            performAttack,
            resolveAbilityStep,
            retreatActiveCard,
            activateBenchCard,
            performResolutionAction,
            resolvePhase,
        },
    };
};