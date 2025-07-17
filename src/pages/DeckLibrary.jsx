// src/pages/DeckLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserDecks, createNewDeck, deleteDeckById } from '../api';


const DeckLibrary = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserDecks()
            .then(data => {
                console.log(data)
                setDecks(data);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching decks:", err));
        }, []);

    const handleCreateDeck = async () => {
        const newDeck = await createNewDeck();
        if (newDeck?._id) {
            // Immediately navigate to the deck builder for the new deck
            navigate(`/decks/${newDeck._id}`);
        }
    };

    const handleDeleteDeck = async (deckId) => {
        if (window.confirm('Are you sure you want to delete this deck?')) {
            await deleteDeckById(deckId);
            // Refresh the list by filtering out the deleted deck
            setDecks(currentDecks => currentDecks.filter(d => d._id !== deckId));
        }
    };

    if (loading) return <div>Loading decks...</div>;

    return (
        <div>
            <h1>My Decks</h1>
            <button onClick={handleCreateDeck}>Create New Deck</button>
            <hr />
            {decks.length > 0 ? (
                <ul>
                    {decks.map(deck => (
                        <li key={deck._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                            <span style={{ color: deck.state === 'play' ? 'green' : 'orange', fontWeight: 'bold' }}>
                                [{deck.state.toUpperCase()}]
                            </span>
                            <span onClick={() => navigate(`/decks/${deck._id}`)} style={{ cursor: 'pointer' }}>
                                {deck.name} ({deck.cardCount} cards)
                            </span>
                            <button onClick={() => handleDeleteDeck(deck._id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no decks. Create one to get started!</p>
            )}
        </div>
    );
};

export default DeckLibrary;