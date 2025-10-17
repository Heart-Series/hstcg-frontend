// src/components/LobbyStatusContainer.jsx
import React from 'react';
import { useLobbyContext } from '../context/LobbyContext';
import LobbyStatus from './LobbyStatus';

const LobbyStatusContainer = () => {
    const { currentLobby, currentGameId, currentPath } = useLobbyContext();
    
    return (
        <LobbyStatus 
            lobbyData={currentLobby} 
            currentGameId={currentGameId}
            currentPath={currentPath} 
        />
    );
};

export default LobbyStatusContainer;
