// src/components/LobbyStatus.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { FaChevronUp, FaChevronDown, FaTimes, FaUsers } from 'react-icons/fa';

const LobbyStatus = ({ lobbyData, currentPath }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const socket = useSocket();

    // Don't show the widget if we're already on the lobby page
    if (!lobbyData || currentPath === `/lobby/${lobbyData.id}`) {
        return null;
    }

    const isHost = lobbyData.hostId === socket?.id;
    const playerCount = lobbyData.players?.length || 0;

    const handleReturnToLobby = () => {
        navigate(`/lobby/${lobbyData.id}`);
    };

    const handleLeaveLobby = () => {
        if (socket) {
            socket.emit('lobby:leave', { lobbyId: lobbyData.id });
        }
    };

    const handleDisbandLobby = () => {
        if (window.confirm('Are you sure you want to disband this lobby? This will remove all players.')) {
            if (socket) {
                socket.emit('lobby:disband', { lobbyId: lobbyData.id });
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            backgroundColor: 'white',
            border: '2px solid #4CAF50',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 1000,
            width: isExpanded ? '280px' : '200px',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div 
                style={{
                    padding: '0.75rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '10px 10px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaUsers size={14} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        Lobby {lobbyData.id}
                    </span>
                </div>
                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ padding: '1rem' }}>
                    <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#666', 
                        marginBottom: '0.75rem' 
                    }}>
                        {playerCount}/2 players
                        {lobbyData.status === 'in_game' && (
                            <span style={{ color: '#FF9800', marginLeft: '0.5rem' }}>
                                (In Game)
                            </span>
                        )}
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem' 
                    }}>
                        <button
                            onClick={handleReturnToLobby}
                            style={{
                                padding: '0.5rem',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Return to Lobby
                        </button>

                        <button
                            onClick={isHost ? handleDisbandLobby : handleLeaveLobby}
                            style={{
                                padding: '0.5rem',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Leave Lobby
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed Content - Quick Actions */}
            {!isExpanded && (
                <div style={{
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {playerCount}/2 players
                    </span>
                    <button
                        onClick={handleLeaveLobby}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                        title="Leave lobby"
                    >
                        <FaTimes size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LobbyStatus;
