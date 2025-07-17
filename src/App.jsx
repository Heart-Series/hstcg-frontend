// src/App.jsx

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import your page components
import CardLibrary from './pages/CardLibrary';
import CardCollection from './pages/CardCollection'

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
};

const linkStyle = {
    color: 'white',
    textDecoration: 'none',
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
            <nav style={navStyle}>
                <Link to="/" style={linkStyle}>Home</Link>
                <Link to="/library" style={linkStyle}>Card Library</Link>
                {user && <Link to="/collection" style={linkStyle}>My Collection</Link>}

                <div style={{ marginLeft: 'auto' }}>
                    {loading ? <span style={linkStyle}>Loading...</span> :
                        user ? (
                            <>
                                <span style={linkStyle}>Welcome, {user.name}!</span>
                                <button onClick={handleLogout} style={linkStyle}>Logout</button>
                            </>
                        ) : (
                            <a href={`${import.meta.env.VITE_API_BASE_URL}/auth/discord`} style={linkStyle}>Login with Discord</a>
                        )}
                </div>
            </nav>

            <main style={{ padding: '1rem' }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/library" element={<CardLibrary />} />
                    <Route path="/collection" element={<CardCollection />} />
                    {/* You will add more routes here for other pages */}
                    {/* e.g., <Route path="/collection" element={<MyCollection />} /> */}
                </Routes>
            </main>
        </HashRouter>
    );
}

export default App;