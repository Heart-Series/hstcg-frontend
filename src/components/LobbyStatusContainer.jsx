// src/components/LobbyStatusContainer.jsx
import React from 'react';
import { useLobbyContext } from '../context/LobbyContext';
import LobbyStatus from './LobbyStatus';

const LobbyStatusContainer = () => {
    const { currentLobby, currentPath } = useLobbyContext();
    
    return (
        <LobbyStatus 
            lobbyData={currentLobby} 
            currentPath={currentPath} 
        />
    );
};

export default LobbyStatusContainer;
