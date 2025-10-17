// src/pages/LobbyPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { fetchUserDecks, fetchRentalDecks } from '../api';
import DeckDrawer from '../components/DeckDrawer';

const LobbyPage = () => {
    const [lobbyData, setLobbyData] = useState(null);
    const [userDecks, setUserDecks] = useState([]);
    const [rentalDecks, setRentalDecks] = useState([]);
    const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState(false);
    const socket = useSocket();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { lobbyId } = useParams();

    // Effect 1: Fetch user's decks and rental decks once.
    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                try {
                    const [userDecksData, rentalDecksData] = await Promise.all([
                        fetchUserDecks(token),
                        fetchRentalDecks()
                    ]);
                    setUserDecks(userDecksData);
                    setRentalDecks(rentalDecksData);
                } catch (err) {
                    console.error("Error fetching decks:", err);
                }
            }
        };
        fetchData();
    }, [token]);

    // Effect 2: Set up socket event listeners. This should only run ONCE when the socket connects.
    useEffect(() => {
        if (!socket) return;

        const handleLobbyUpdated = (data) => {
            // Only update state if the data is for the lobby we are currently in.
            if (data && data.id === lobbyId.toUpperCase()) {
                setLobbyData(data);
            }
        };

        const handleLobbyError = (message) => {
            alert(`Lobby Error: ${message}`);
            navigate('/lobbies');
        };
        const handleGameStarting = (gameState) => {
            console.log('Game starting!', gameState);
            if (lobbyId) {
                // This is for players
                navigate(`/game/${lobbyId}`, { state: { initialGameState: gameState, isSpectator: false } });
            }
        };

        const handleSpectateStart = (gameState) => {
            console.log('Spectating game!', gameState);
            if (lobbyId) {
                // This is for spectators
                navigate(`/game/${lobbyId}`, { state: { initialGameState: gameState, isSpectator: true } });
            }
        };

        const handleLobbyDisbanded = ({ reason }) => {
            alert(`Lobby disbanded: ${reason}`);
            navigate('/lobbies');
        };

        socket.on('lobby:updated', handleLobbyUpdated);
        socket.on('lobby:error', handleLobbyError);
        socket.on('game:starting', handleGameStarting);
        socket.on('spectate:start', handleSpectateStart);
        socket.on('lobby:disbanded', handleLobbyDisbanded);
        console.log('Registered game:starting listener');

        // Cleanup function runs only when the component unmounts for good
        return () => {
            console.log(`Unmounting LobbyPage, sending leave for ${lobbyId}`);
            socket.emit('lobby:leave', { lobbyId });

            // Clean up listeners to prevent memory leaks
            socket.off('lobby:updated', handleLobbyUpdated);
            socket.off('lobby:error', handleLobbyError);
            socket.off('game:starting', handleGameStarting);
            socket.off('spectate:start', handleSpectateStart);
            socket.off('lobby:disbanded', handleLobbyDisbanded);
        };
    }, [socket, navigate, lobbyId]); // This is stable.

    // Effect 3: Handle the logic of being "in" the lobby (joining and leaving).
    useEffect(() => {
        if (socket && lobbyId) {
            // Tell the server we want to join when we land on the page.
            socket.emit('lobby:join', lobbyId.toUpperCase());
        }

        // The cleanup function for THIS effect runs when the component unmounts.
        return () => {
            if (socket && lobbyId) {
                setLobbyData(null);
                // socket.emit('lobby:join', lobbyId.toUpperCase());
            }
        };
    }, [socket, lobbyId]); // This effect is also stable.

    // --- DERIVED STATE: Use useMemo for stability ---
    const me = useMemo(() =>
        // Defensive coding: use optional chaining (?.) and ensure both IDs are strings for comparison.
        lobbyData?.players.find(p => p.userId?.toString() === user?.userId?.toString()),
        [lobbyData, user]
    );
    const opponent = useMemo(() =>
        lobbyData?.players.find(p => p.userId?.toString() !== user?.userId?.toString()),
        [lobbyData, user]
    );
    const isHost = lobbyData?.hostId === socket?.id;

    // Get the currently selected deck info for display (check both user and rental decks)
    const selectedDeck = useMemo(() => {
        if (!me?.selectedDeckId) return null;
        return userDecks.find(d => d._id === me.selectedDeckId) || 
               rentalDecks.find(d => d._id === me.selectedDeckId);
    }, [userDecks, rentalDecks, me?.selectedDeckId]);

    // --- RENDER LOGIC ---
    if (!lobbyData) {
        // The condition that shows the loading screen
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700 animate-pulse">Joining lobby...</div>
            </div>
        );
    }

    // --- Event Handlers can now use the stable 'me' variable ---
    const handleSelectDeck = (deckId) => {
        socket.emit('lobby:selectDeck', { lobbyId, deckId });
        setIsDeckDrawerOpen(false);
    };
    const handleReadyClick = () => socket.emit('lobby:setReady', { lobbyId, isReady: !me.isReady });
    const handleStartClick = () => socket.emit('lobby:startGame', { lobbyId });
    const handleToggleVisibility = () => {
        socket.emit('lobby:setVisibility', { lobbyId, isPublic: !lobbyData.isPublic });
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Lobby: {lobbyData.id}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Player 1 (Me) */}
                <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center">
                    <h2 className="text-xl font-semibold text-blue-900 mb-2">
                        {me?.username} <span className={me?.isReady ? "text-green-600" : "text-red-600"}>{me?.isReady ? "(Ready)" : "(Not Ready)"}</span>
                    </h2>
                    
                    {/* Deck Selection Button */}
                    <button
                        onClick={() => setIsDeckDrawerOpen(true)}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-black border-black-900 border font-bold py-3 px-4 rounded-lg transition-colors duration-200 mb-4"
                    >
                        {selectedDeck ? selectedDeck.name : 'Select Deck'}
                    </button>
                </div>
                {/* Player 2 (Opponent) */}
                <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
                    {opponent ? (
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {opponent?.username} <span className={opponent.isReady ? "text-green-600" : "text-red-600"}>{opponent.isReady ? "(Ready)" : "(Not Ready)"}</span>
                        </h2>
                    ) : (
                        <h2 className="text-xl font-semibold text-gray-500 mb-2">Waiting for opponent...</h2>
                    )}
                </div>
            </div>
            {/* Top Row - Ready and Start Game buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
                <button
                    onClick={handleReadyClick}
                    disabled={!me.selectedDeckId}
                    className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200
                        ${me.isReady ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                        ${!me.selectedDeckId ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    {me.isReady ? 'Unready' : 'Ready'}
                </button>
                {isHost && (
                    <button
                        onClick={handleStartClick}
                        disabled={lobbyData.players.length !== 2 || !lobbyData.players.every(p => p.isReady)}
                        className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200
                            bg-blue-600 hover:bg-blue-700 text-white
                            ${lobbyData.players.length !== 2 || !lobbyData.players.every(p => p.isReady) ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                    >
                        Start Game
                    </button>
                )}
            </div>
            
            {/* Bottom Row - Privacy toggle and Leave Lobby */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                {isHost && (
                    <button
                        onClick={handleToggleVisibility}
                        className={`px-6 py-2 rounded-lg font-bold transition-colors duration-200 ${lobbyData.isPublic
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                            }`}
                    >
                        {lobbyData.isPublic ? "Public" : "Private"}
                    </button>
                )}
                <button
                    onClick={() => {
                        if (isHost) {
                            if (window.confirm('Are you sure you want to disband this lobby? This will remove all players and delete the lobby.')) {
                                socket.emit('lobby:disband', { lobbyId });
                            }
                        } else {
                            socket.emit('lobby:leave', { lobbyId });
                        }
                    }}
                    className="px-6 py-2 rounded-lg font-bold transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white"
                >
                    Leave Lobby
                </button>
            </div>

            {/* Deck Selection Drawer */}
            <DeckDrawer 
                isOpen={isDeckDrawerOpen}
                onClose={() => setIsDeckDrawerOpen(false)}
                onSelectDeck={handleSelectDeck}
            />
        </div>
    );
};

export default LobbyPage;