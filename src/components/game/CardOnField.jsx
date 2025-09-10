// src/components/game/CardOnField.jsx
import React from 'react';
import Card from '../Card';
import { useDroppable } from '@dnd-kit/core';
import { useGameUI } from '../../context/GameUIContext';

const CardOnField = ({ cardData, isSelected, isTargetable, onCardClick, onActionClick, }) => {
    const { resolutionState } = useGameUI();
    const myResolutionActions = resolutionState.isActive
        ? resolutionState.actions.filter(action => action.sourceCardId === cardData.instanceId)
        : [];
    return (
        <div
            // The onClick handler is added to the same div
            onClick={(e) => {
                e.stopPropagation()
                onCardClick(cardData, isTargetable)
            }}
            className={`w-full h-full rounded-lg transition-all duration-150 relative cursor-pointer
                  
                ${isTargetable ? 'ring-4 ring-yellow-400 animate-pulse' : ''} 
                ${isSelected ? 'ring-4 ring-blue-500' : ''}
            `}

        // ${cardData.isCancelled ? 'grayscale opacity-70' : ''}

        >
            <Card cardData={cardData} />

            {/* --- The Contextual Action Menu --- */}
            {isSelected && (
                <div
                    className="absolute left-full top-0 ml-2 w-48 bg-white rounded-lg shadow-2xl z-20 p-2"
                    // Stop click from bubbling up to the parent div
                    onClick={(e) => e.stopPropagation()}
                >
                    <ul className="space-y-1">
                        <li>
                            <button
                                // We pass a custom action object to onActionClick
                                onClick={() => onActionClick({ type: 'view' }, cardData)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors"
                            >
                                View Details
                            </button>
                        </li>
                        {resolutionState.isActive ? (
                            // We are in the resolution phase, show ONLY those actions
                            myResolutionActions.map((action, index) => (
                                <li key={`res-${index}`}>
                                    <button
                                        onClick={() => onActionClick(action, cardData)}
                                        // You can check action.disabled here if needed in the future
                                        className={` w-full text-left px-3 py-2 text-sm rounded-md
                                            ${action.hasBeenUsed
                                                ? 'bg-gray-400 text-gray-600' // Style for used actions
                                                : 'bg-yellow-100 hover:bg-yellow-500 text-yellow-800 hover:text-white'
                                            }`}
                                    >
                                        {action.label}
                                    </button>
                                </li>
                            ))
                        ) : (
                            // We are in the main phase, show normal available actions
                            cardData.availableActions.map(action => (
                                <li key={action.type}>
                                    <button
                                        onClick={() => onActionClick(action, cardData)}
                                        disabled={action.disabled}
                                        title={action.disabled ? action.disabledMessage : ''}
                                        className={`
                                            w-full text-left px-3 py-2 text-sm text-gray-800 rounded-md transition-colors
                                            ${action.disabled
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Style for disabled
                                                : 'bg-gray-100 hover:bg-blue-500 hover:text-white' // Style for enabled
                                            }
                                        `}
                                    >
                                        {action.label}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};





export default CardOnField;