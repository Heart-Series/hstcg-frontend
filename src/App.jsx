// src/App.jsx

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import your page components
import CardLibrary from './pages/CardLibrary';
import CardCollection from './pages/CardCollection'
import DeckLibrary from './pages/DeckLibrary';
import DeckBuilder from './pages/DeckBuilder';
import LobbyListPage from './pages/LobbyListPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminCardManager from './pages/AdminCardManager';
import AdminUserManager from './pages/AdminUserManager';

import ErrorBoundary from './components/ErrorBoundary';
import { LobbyProvider } from './context/LobbyContext';
import LobbyStatusContainer from './components/LobbyStatusContainer';

import { Toaster } from 'react-hot-toast';

// A simple component for the home page
const HomePage = () => (
    <div>
        <h1>Welcome to the HSTCG Website!</h1>
        <p>This is the home page.</p>
    </div>
);

// Basic styling for the navigation bar
const navStyle = {
    background: '#333',
    padding: '1rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
};

const linkStyle = {
    color: 'white',
    textDecoration: 'none',
};

// Component to handle conditional overflow styling
const AppContent = () => {
    const location = useLocation();
    const isDeckBuilder = location.pathname.includes('/decks/') && !location.pathname.endsWith('/decks');
    const isAdminPage = location.pathname.startsWith('/admin');
    const isCollectionPage = location.pathname === '/collection';
    const isLobbyListPage = location.pathname === '/lobbies';

    const overFlowHidden = isDeckBuilder || isAdminPage || isCollectionPage || isLobbyListPage;

    return (
        <main className={`flex-1 p-4 ${overFlowHidden ? '' : 'overflow-hidden'}`}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                {/* <Route path="/library" element={<CardLibrary />} /> */}
                <Route path="/collection" element={<CardCollection />} />
                <Route path="/decks" element={<DeckLibrary />} />
                <Route path="/decks/:deckId" element={<DeckBuilder />} />
                <Route path="/lobbies" element={<LobbyListPage />} />
                <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
                <Route path="/game/:gameId" element={<ErrorBoundary><GamePage /></ErrorBoundary>} />
                {/* Admin routes */}
                <Route path="/admin/cards" element={<AdminCardManager />} />
                <Route path="/admin/users" element={<AdminUserManager />} />
                {/* Can add more routes here for other pages */}
                {/* e.g., <Route path="/collection" element={<MyCollection />} /> */}
            </Routes>
        </main>
    );
};


function App() {
    const { user, loading } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            localStorage.setItem('token', token);
            params.delete('token');
            const newUrl =
                window.location.pathname +
                (params.toString() ? '?' + params.toString() : '') +
                window.location.hash;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    // Add logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };


    return (
        // Using HashRouter is the easiest way to ensure compatibility with GitHub Pages
        <HashRouter>
            <LobbyProvider>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        // Define default options
                        className: '',
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                    toastLimit={4}
                />
                <div className="h-screen flex flex-col">
                    <nav style={navStyle}>
                        <Link to="/" style={linkStyle}>Home</Link>
                        {/* <Link to="/library" style={linkStyle}>Card Library</Link> */}
                        {user && <Link to="/collection" style={linkStyle}>Collection</Link>}
                        {user && <Link to="/decks" style={linkStyle}>Decks</Link>}
                        {user && <Link to="/lobbies" style={linkStyle}>Lobbies</Link>} {/* <-- NEW LINK */}

                        {/* Admin Links */}
                        {user?.isAdmin && (
                            <>
                                <span style={{ color: '#ffc107', margin: '0 0.5rem' }}>|</span>
                                <Link to="/admin/cards" style={{ ...linkStyle, color: '#ffc107' }}>Cards</Link>
                                <Link to="/admin/users" style={{ ...linkStyle, color: '#ffc107' }}>Users</Link>
                            </>
                        )}

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {loading ? <span style={linkStyle}>Loading...</span> :
                                user ? (
                                    <>
                                        <span style={linkStyle}>Welcome, {user.name}!</span>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                transition: 'background-color 0.3s ease'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <a
                                        href={`${import.meta.env.VITE_API_BASE_URL}/auth/discord`}
                                        style={{
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            textDecoration: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            transition: 'background-color 0.3s ease',
                                            display: 'inline-block'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                                    >
                                        Login with Discord
                                    </a>
                                )}
                        </div>
                    </nav>

                    <AppContent />

                    {/* Lobby Status Widget */}
                    <LobbyStatusContainer />
                </div>
            </LobbyProvider>
        </HashRouter>
    );
}

export default App;