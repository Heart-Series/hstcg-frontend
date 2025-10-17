// src/context/LobbyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useLocation } from 'react-router-dom';

const LobbyContext = createContext();

export const LobbyProvider = ({ children }) => {
    const [currentLobby, setCurrentLobby] = useState(null);
    const [currentGameId, setCurrentGameId] = useState(null);
    const socket = useSocket();
    const location = useLocation();

    useEffect(() => {
        if (!socket) return;

        const handleLobbyUpdated = (lobbyData) => {
            setCurrentLobby(lobbyData);
        };

        const handleLobbyDisbanded = ({ reason }) => {
            setCurrentLobby(null);
            setCurrentGameId(null);
            alert(`Lobby disbanded: ${reason}`);
        };

        const handleLobbyError = (message) => {
            // Only clear lobby state for certain errors
            if (message.includes('not found') || message.includes('disbanded')) {
                setCurrentLobby(null);
                setCurrentGameId(null);
            }
        };

        const handleGameStarting = ({ gameId }) => {
            // Track the game ID so we can navigate back to it
            setCurrentGameId(gameId);
        };

        const handleGameEnded = () => {
            // Game ended, clear the game ID
            setCurrentGameId(null);
        };

        socket.on('lobby:updated', handleLobbyUpdated);
        socket.on('lobby:disbanded', handleLobbyDisbanded);
        socket.on('lobby:error', handleLobbyError);
        socket.on('game:starting', handleGameStarting);
        socket.on('game:ended', handleGameEnded);

        return () => {
            socket.off('lobby:updated', handleLobbyUpdated);
            socket.off('lobby:disbanded', handleLobbyDisbanded);
            socket.off('lobby:error', handleLobbyError);
            socket.off('game:starting', handleGameStarting);
            socket.off('game:ended', handleGameEnded);
        };
    }, [socket]);

    const clearLobby = () => {
        setCurrentLobby(null);
        setCurrentGameId(null);
    };

    return (
        <LobbyContext.Provider value={{
            currentLobby,
            currentGameId,
            setCurrentLobby,
            clearLobby,
            currentPath: location.pathname
        }}>
            {children}
        </LobbyContext.Provider>
    );
};

export const useLobbyContext = () => {
    const context = useContext(LobbyContext);
    if (!context) {
        throw new Error('useLobbyContext must be used within a LobbyProvider');
    }
    return context;
};
