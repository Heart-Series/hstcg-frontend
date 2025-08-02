// src/components/game/CardOnField.jsx
import React from 'react';
import Card from '../Card';
import { useDroppable } from '@dnd-kit/core';

const CardOnField = ({
    cardData,
    droppableId,
    activeDragData,
    gameState,
    isSelected,      // NEW: Is this card's menu open?
    isTargetable,    // NEW: Is this card a valid target right now?
    onCardClick = () => { },     // Default to no-op
    onActionClick = () => { }    // Default to no-op
}) => {

    return (
        <div
            // The onClick handler is added to the same div
            onClick={() => onCardClick(cardData, droppableId)}
            className={`w-full h-full rounded-lg transition-all duration-150 relative cursor-pointer
                  
                ${isTargetable ? 'ring-4 ring-yellow-400 animate-pulse' : ''} 
                ${isSelected ? 'ring-4 ring-blue-500' : ''}
            `}
        >
            <Card cardData={cardData} />

            {/* --- The Contextual Action Menu --- */}
            {isSelected && cardData.availableActions?.length > 0 && (
                <div
                    className="absolute left-full top-0 ml-2 w-48 bg-white rounded-lg shadow-2xl z-20 p-2"
                    // Stop click from bubbling up to the parent div
                    onClick={(e) => e.stopPropagation()}
                >
                    <ul className="space-y-1">
                        {cardData.availableActions.map(action => (
                            <li key={action.type}>
                                <button
                                    onClick={() => onActionClick(action, droppableId)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors"
                                >
                                    {action.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CardOnField;