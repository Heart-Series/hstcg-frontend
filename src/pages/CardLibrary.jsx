// src/pages/CardLibrary.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllCards } from '../api';
import Card from '../components/Card'; // Import our reusable component

// Simple styling for the grid
const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
};

const CardLibrary = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This function is called when the component first mounts
        const getCards = async () => {
            setLoading(true);
            const allCards = await fetchAllCards();
            setCards(allCards);
            setLoading(false);
        };

        getCards();
    }, []); // The empty array [] means this effect runs only once

    if (loading) {
        return <div>Loading all cards...</div>;
    }

    return (
        <div>
            <h1>Card Library</h1>
            <p>Showing {cards.length} unique cards.</p>
            <div style={gridStyle}>
                {cards.map(card => (
                    <Card key={card.id} cardData={card} />
                ))}
            </div>
        </div>
    );
};

export default CardLibrary;