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
    position: 'relative',
};

const quantityBadgeStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '0.9em',
    fontWeight: 'bold',
};

const imgStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
};

const Card = ({ cardData, quantity }) => {
    // cardData is an object like { id: 'home', name: 'Home9634', ... }
    if (!cardData) return null;

    return (
        <div style={cardStyle}>
            {quantity && (
                <div style={quantityBadgeStyle}>
                    x{quantity}
                </div>
            )}
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