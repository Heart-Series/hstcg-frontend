// src/App.jsx

import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';

// Import your page components
import CardLibrary from './pages/CardLibrary';

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
    return (
        // Using HashRouter is the easiest way to ensure compatibility with GitHub Pages
        <HashRouter>
            <nav style={navStyle}>
                <Link to="/" style={linkStyle}>Home</Link>
                <Link to="/library" style={linkStyle}>Card Library</Link>
            </nav>

            <main style={{ padding: '1rem' }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/library" element={<CardLibrary />} />
                    {/* You will add more routes here for other pages */}
                    {/* e.g., <Route path="/collection" element={<MyCollection />} /> */}
                </Routes>
            </main>
        </HashRouter>
    );
}

export default App;