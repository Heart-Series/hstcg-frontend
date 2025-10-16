// src/components/LobbyCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaEye } from 'react-icons/fa';

const LobbyCard = ({ lobby }) => {
    const navigate = useNavigate();

    const isInGame = lobby.status === 'in_game';
    const isFull = lobby.playerCount >= 2;
    
    const handleJoin = () => {
        navigate(`/lobby/${lobby.id}`);
    };

    const getStatusText = () => {
        if (isInGame) return 'In Game';
        if (isFull) return 'Full';
        return 'Waiting';
    };

    const getStatusColor = () => {
        if (isInGame) return '#FF9800'; // Orange for in-game
        if (isFull) return '#f44336'; // Red for full
        return '#4CAF50'; // Green for waiting
    };

    const getActionButtonText = () => {
        if (isInGame) return 'Spectate';
        return 'Join';
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.3s ease, transform 0.2s ease',
            minHeight: '80px',
            width: '400px',
            maxWidth: '33vw'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}>
            
            {/* Left Section - Lobby ID and Host */}
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '0.25rem'
                }}>
                    Lobby {lobby.id}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {isInGame && lobby.players ? (
                        <span>
                            {lobby.players.map(player => player.username).join(' vs ')}
                        </span>
                    ) : (
                        <span>Host: {lobby.host}</span>
                    )}
                </div>
            </div>

            {/* Center Section - Status and Player Count */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                <div style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: `${getStatusColor()}15`,
                    color: getStatusColor(),
                    border: `1px solid ${getStatusColor()}40`,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    {getStatusText()}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.875rem',
                    color: '#666'
                }}>
                    <FaUsers size={12} />
                    <span>{lobby.playerCount}/2</span>
                    {isInGame && <FaEye size={12} style={{ marginLeft: '0.25rem' }} />}
                </div>
            </div>

            {/* Right Section - Join/Spectate Button */}
            <button
                onClick={handleJoin}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isInGame ? '#FF9800' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s ease, transform 0.2s ease',
                    minWidth: '100px'
                }}
                onMouseOver={(e) => {
                    e.target.style.backgroundColor = isInGame ? '#F57C00' : '#45a049';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                    e.target.style.backgroundColor = isInGame ? '#FF9800' : '#4CAF50';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                {getActionButtonText()}
            </button>
        </div>
    );
};

export default LobbyCard;
