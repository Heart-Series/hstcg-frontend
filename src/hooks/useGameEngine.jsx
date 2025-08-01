// src/hooks/useGameEngine.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useParams } from 'react-router-dom';

export const useGameEngine = (initialGameState) => {
    const [gameState, setGameState] = useState(initialGameState);
    const [error, setError] = useState(null); // To display game errors
    const socket = useSocket();
    const { user } = useAuth();
    const { gameId } = useParams();

    // Listener for all server updates
    useEffect(() => {
        if (!socket) return;

        const handleGameUpdate = (newGameState) => {
            console.log("Received game:updated", newGameState);
            // console.log("socket.id:", socket?.id);
            // console.log("players:", gameState?.players);
            // console.log("myPlayerState:", newGameState?.players[socket?.id]);
            // console.log("opponentState:", Object.values(newGameState?.players || {}).find(p => p.socketId !== socket?.id));
            setGameState(newGameState);
        };
        const handleGameError = (errorMessage) => {
            console.error("Game Error:", errorMessage);
            setError(errorMessage);
            // Clear the error message after a few seconds
            setTimeout(() => setError(null), 3000);
        };


        socket.on('game:updated', handleGameUpdate);
        socket.on('game:error', handleGameError);

        return () => {
            socket.off('game:updated', handleGameUpdate);
            socket.off('game:error', handleGameError);
        };
    }, [socket]);

    // --- Player Actions ---
    // These are the functions the UI will call. They are stable and don't change.
    const playCard = useCallback((cardId, target) => {
        if (socket) {
            socket.emit('game:playCard', { gameId, cardId, target });
        }
    }, [socket, gameId]);

    const endTurn = useCallback(() => {
        console.log("END TURN")
        if (socket) {
            socket.emit('game:endTurn'); // The handler knows the gameId from the socket
        }
    }, [socket]);

    const setInitialActive = useCallback((cardHandIndex) => {
        if (socket) {
            socket.emit('game:setInitialActive', { cardHandIndex });
        }
    }, [socket]);

    const playCardToBench = useCallback((cardHandIndex, benchIndex) => {
        if (socket) {
            socket.emit('game:playToBench', { cardHandIndex, benchIndex });
        }
    }, [socket]);

    const playSupportCard = useCallback((cardHandIndex) => {
        if (socket) {
            socket.emit('game:playSupportCard', { cardHandIndex });
        }
    }, [socket]);

     const playItemCard = useCallback((cardHandIndex, target) => {
        if (socket) {
            socket.emit('game:playItemCard', { cardHandIndex, target });
        }
    }, [socket]);

    const performAttack = useCallback((attackType, target) => {
        if (socket) {
            socket.emit('game:performAttack', { attackType, target });
        }
    }, [socket]);

    const retreatActiveCard = useCallback((benchIndex) => {
        if (socket) {
            socket.emit('game:retreatActiveCard', { benchIndex });
        }
    }, [socket]);

    // ... other actions like attack, useAbility, etc. ...

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
        actions: {
            playCard,
            endTurn,
            setInitialActive,
            playCardToBench,
            playSupportCard,
            playItemCard,
            performAttack,
            retreatActiveCard,
        },
    };
};