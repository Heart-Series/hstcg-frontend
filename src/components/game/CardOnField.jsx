// src/components/game/CardOnField.jsx
import React from 'react';


const CardOnField = ({ cardData }) => {
    // For now, it just uses your main Card component.
    return (
        <div className="w-full h-full">
            <Card cardData={cardData} />
        </div>
    );
};

export default CardOnField