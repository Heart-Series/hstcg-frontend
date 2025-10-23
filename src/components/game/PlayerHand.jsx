// src/components/game/PlayerHand.jsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import Card from '../Card'; 
import { useGame } from '../../context/GameContext';

const DraggableCard = ({ card, cardHandIndex, canPerformAction }) => {
    // console.log(`Can Perform Action: ${canPerformAction}`)
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `hand-card-${cardHandIndex}`, // Unique ID for this draggable item
        disabled: !canPerformAction,
        data: { // We can attach any data we want to the drag event
            cardData: card,
            cardHandIndex: cardHandIndex,
            source: 'hand',
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100, // Ensure the dragged card is on top
    } : undefined;

    return (
         <div 
            ref={setNodeRef} 
            style={style} 
            {...listeners} 
            {...attributes} 
            className={`flex-shrink-0 ${transform ? 'w-32' : 'w-40'}`}
        >
            <Card cardData={card} />
        </div>
    );
};

const PlayerHand = ({ cards, isMyTurn, canPerformAction, isSpectator  }) => {
    const game = useGame();
    if (!game) return null; // Guard: context might not be available during mount/re-render
    const { isHandOpen, setIsHandOpen, targeting, setTargeting } = game;

    // PlayerHand uses the shared `actions.playItemCard` from context via drag handling
    // in `GameContext.handleDragEnd`. No local duplicate handler is required here.

    // --- Cancel button logic ---
    const handleCancel = () => {
        setTargeting({ isTargeting: false });
    };

    if (isSpectator) {
        return null;
    }

    // --- UI rendering ---
    return (
        <>
            {/* Trigger Button */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30">
                <button
                    onClick={() => setIsHandOpen(!isHandOpen)}
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-t-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
                    style={{
                        boxShadow: isMyTurn ? '0 0 15px rgba(59, 130, 246, 0.8)' : '',
                        animation: isMyTurn ? 'pulse 2s infinite' : 'none'
                    }}
                >
                    {isHandOpen ? 'Close Hand' : `View Hand (${cards.length})`}
                </button>
            </div>

            {/* Hand Drawer */}
            <div
                className={`fixed bottom-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-sm p-4 border-t-2 border-blue-500 shadow-2xl z-20 transition-transform duration-500 ease-in-out ${isHandOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4">
                    {cards.length > 0 ? (
                        cards.map((card, index) => (
                            <DraggableCard
                                    key={`${card.id}-${index}`}
                                    card={card}
                                    cardHandIndex={index}
                                    canPerformAction={canPerformAction}
                                />
                        ))
                    ) : (
                        <div className="text-center w-full text-gray-400 p-8">Your hand is empty.</div>
                    )}
                </div>
            </div>

            {/* Cancel button for choosing phase */}
            {targeting.isTargeting && targeting.cancelable && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <button
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-600"
                        onClick={handleCancel}
                    >Cancel</button>
                </div>
            )}
        </>
    );
};

export default PlayerHand;