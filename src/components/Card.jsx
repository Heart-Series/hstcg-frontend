// src/components/Card.jsx
import React from 'react';
import { getCardImageUrl } from '../api';

// Simple styling, you can move this to a CSS file later
const cardStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    margin: '10px',
    width: '200px',
    textAlign: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
};

const imgStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
};

const Card = ({ cardData }) => {
    // cardData is an object like { id: 'fireball', name: 'Fireball', ... }
    if (!cardData) return null;

    return (
        <div style={cardStyle}>
            <h4>{cardData.name}</h4>
            <img 
                src={getCardImageUrl(cardData.id)} 
                alt={cardData.name}
                style={imgStyle}
                // Good practice to add lazy loading for performance
                loading="lazy"
            />
            <p>Type: {cardData.cardType}</p>
        </div>
    );
};

export default Card;