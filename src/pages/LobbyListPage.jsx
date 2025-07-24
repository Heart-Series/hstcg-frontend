// src/pages/LobbyListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket'; // Use your new socket hook

const LobbyListPage = () => {
    const [publicLobbies, setPublicLobbies] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const socket = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        // This listener is ONLY for the creator.
        // It's a one-time event to know where to navigate.
        const handleLobbyCreated = (lobbyData) => {
            navigate(`/lobby/${lobbyData.id}`);
        };

        socket.on('lobby:created', handleLobbyCreated);

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

        // Optionally, poll every 5 seconds for updates
        const interval = setInterval(fetchLobbies, 5000);

        // Crucially, we clean up this specific listener when the component unmounts.
        return () => {
            socket.off('lobby:created', handleLobbyCreated);
            clearInterval(interval);

        };
    }, [socket, navigate]);

    const handleCreateLobby = () => {
        if (socket) {
            socket.emit('lobby:create');
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
            {/* This is where you would map over the publicLobbies state */}
            <div>
                {publicLobbies.length > 0 ? (
                    publicLobbies.map(lobby => <div key={lobby.id}>{lobby.id}</div>)
                ) : (
                    <p className="text-gray-500">No public lobbies available right now.</p>
                )}
            </div>
        </div>
    );
};

export default LobbyListPage;