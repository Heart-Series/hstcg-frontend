// src/context/LobbyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useLocation } from 'react-router-dom';

const LobbyContext = createContext();

export const LobbyProvider = ({ children }) => {
    const [currentLobby, setCurrentLobby] = useState(null);
    const socket = useSocket();
    const location = useLocation();

    useEffect(() => {
        if (!socket) return;

        const handleLobbyUpdated = (lobbyData) => {
            setCurrentLobby(lobbyData);
        };

        const handleLobbyDisbanded = ({ reason }) => {
            setCurrentLobby(null);
            alert(`Lobby disbanded: ${reason}`);
        };

        const handleLobbyError = (message) => {
            // Only clear lobby state for certain errors
            if (message.includes('not found') || message.includes('disbanded')) {
                setCurrentLobby(null);
            }
        };

        const handleGameStarting = () => {
            // Keep lobby data when game starts so widget still shows
            // but user can return to lobby if needed
        };

        socket.on('lobby:updated', handleLobbyUpdated);
        socket.on('lobby:disbanded', handleLobbyDisbanded);
        socket.on('lobby:error', handleLobbyError);
        socket.on('game:starting', handleGameStarting);

        return () => {
            socket.off('lobby:updated', handleLobbyUpdated);
            socket.off('lobby:disbanded', handleLobbyDisbanded);
            socket.off('lobby:error', handleLobbyError);
            socket.off('game:starting', handleGameStarting);
        };
    }, [socket]);

    const clearLobby = () => {
        setCurrentLobby(null);
    };

    return (
        <LobbyContext.Provider value={{
            currentLobby,
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
