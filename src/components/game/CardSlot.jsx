// src/components/game/CardSlot.jsx
import React from 'react';

const CardSlot = ({ onClick, className = '' }) => {
    return (
        <div
            onClick={onClick}
            className={`w-full h-full border-2 border-dashed border-gray-500 rounded-lg bg-transparent cursor-pointer hover:bg-gray-500 hover:bg-opacity-20 transition-colors ${className}`}
        >
        </div>
    );
};

export default CardSlot;