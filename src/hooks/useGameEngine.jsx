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
        if (socket) {
            socket.emit('game:endTurn', { gameId });
        }
    }, [socket, gameId]);

    // ... other actions like attack, useAbility, etc. ...

    // --- Derived State ---
    // Helper values to make the UI components' lives easier.
    const myPlayerState = gameState?.players[socket?.id];
    const opponentState = Object.values(gameState?.players || {}).find(p => p.socketId !== socket?.id);
    const isMyTurn = gameState?.activePlayerId === socket?.id;

    return {
        gameState,
        error,
        myPlayerState,
        opponentState,
        isMyTurn,
        actions: {
            playCard,
            endTurn,
        },
    };
};