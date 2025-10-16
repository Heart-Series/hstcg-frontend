// src/pages/LobbyListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import LobbyCard from '../components/LobbyCard';

const LobbyListPage = () => {
    const [publicLobbies, setPublicLobbies] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const socket = useSocket();
    const navigate = useNavigate();
    const { token } = useAuth();

    useEffect(() => {
        if (!socket) return;

        // This listener is ONLY for the creator.
        // It's a one-time event to know where to navigate.
        const handleLobbyCreated = (lobbyData) => {
            navigate(`/lobby/${lobbyData.id}`);
        };

        // Real-time public lobby update handlers
        const handlePublicLobbyCreated = (lobbyData) => {
            setPublicLobbies(prev => {
                // Check if lobby already exists to prevent duplicates
                const exists = prev.some(lobby => lobby.id === lobbyData.id);
                if (exists) return prev;
                return [...prev, lobbyData];
            });
        };

        const handlePublicLobbyUpdated = (lobbyData) => {
            setPublicLobbies(prev => 
                prev.map(lobby => 
                    lobby.id === lobbyData.id ? { ...lobby, ...lobbyData } : lobby
                )
            );
        };

        const handlePublicLobbyRemoved = ({ id }) => {
            setPublicLobbies(prev => prev.filter(lobby => lobby.id !== id));
        };

        // Register socket listeners
        socket.on('lobby:created', handleLobbyCreated);
        socket.on('publicLobby:created', handlePublicLobbyCreated);
        socket.on('publicLobby:updated', handlePublicLobbyUpdated);
        socket.on('publicLobby:removed', handlePublicLobbyRemoved);

        // Initial fetch of public lobbies
        const fetchLobbies = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lobbies`);
                if (res.ok) {
                    const data = await res.json();
                    setPublicLobbies(data);
                }
            } catch (err) {
                console.error("Failed to fetch public lobbies:", err);
            }
        };

        fetchLobbies();

        // Cleanup listeners when component unmounts
        return () => {
            socket.off('lobby:created', handleLobbyCreated);
            socket.off('publicLobby:created', handlePublicLobbyCreated);
            socket.off('publicLobby:updated', handlePublicLobbyUpdated);
            socket.off('publicLobby:removed', handlePublicLobbyRemoved);
        };
    }, [socket, navigate]);

    const handleCreateLobby = () => {
        if (socket) {
            socket.emit('lobby:create');
        }
    };

    const handleCreateDebugLobby = async () => {
        // --- CONFIGURE YOUR TEST HERE ---
        // const config = {
        //   myDeckId: "6878cc6059a42dd98c826468", // <-- ⚠️ CHANGE TO YOUR DECK ID
        //   opponentDeckId: "687b510ea0c87ba79a2555db", // <-- ⚠️ CHANGE TO OPPONENT DECK ID
        //   startFirst: true,
        //   // List the card IDs you want on top of your deck.
        //   // The first card in this list will be the first card you draw.
        //   stackMyDeck: ["th-home"],
        // };

        const config = {}

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lobbies/debug/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Auth is required for the route
                },
                body: JSON.stringify(config)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to create debug lobby');
            }

            const lobby = await res.json();
            // The backend creates the lobby; now we navigate to it.
            navigate(`/lobby/${lobby.id}`);

        } catch (error) {
            console.error("Debug Lobby Creation Failed:", error);
            // You could show an error message to the user here
        }
    };

    const handleJoinWithCode = (e) => {
        e.preventDefault();
        if (joinCode.trim()) {
            navigate(`/lobby/${joinCode.trim().toUpperCase()}`);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">Game Lobbies</h1>

            <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow">
                <button
                    onClick={handleCreateLobby}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                    Create Lobby
                </button>
                 {import.meta.env.MODE === 'development' && (
                    <button
                        onClick={handleCreateDebugLobby}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Create Debug Game
                    </button>
                )}
                <form onSubmit={handleJoinWithCode} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Enter Lobby Code"
                        className="p-2 border rounded-md"
                        maxLength="4"
                    />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                        Join
                    </button>
                </form>
            </div>

            <h2 className="text-2xl font-bold mb-4">Public Lobbies</h2>
            <div className="space-y-3">
                {publicLobbies.length > 0 ? (
                    publicLobbies.map(lobby => (
                        <LobbyCard key={lobby.id} lobby={lobby} />
                    ))
                ) : (
                    <p className="text-gray-500">No public lobbies available right now.</p>
                )}
            </div>
        </div>
    );
};

export default LobbyListPage;