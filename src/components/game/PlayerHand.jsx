// src/components/game/PlayerHand.jsx
import React, { useState } from 'react';
import Card from '../Card'; // Your main card component

const PlayerHand = ({ cards, isMyTurn, onPlayCard, isOpen, setIsOpen }) => {

    // This is the "abstracted trigger" you mentioned.
    // For now, it's a simple button, but it could be triggered by other events.
    const toggleHand = () => setIsOpen(!isOpen);

    return (
        <>
            {/* --- The Trigger Button --- */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30">
                <button
                    onClick={toggleHand}
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-t-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
                    // Add a glowing effect if it's the player's turn
                    style={{
                        boxShadow: isMyTurn ? '0 0 15px rgba(59, 130, 246, 0.8)' : '',
                        animation: isMyTurn ? 'pulse 2s infinite' : 'none'
                    }}
                >
                    {isOpen ? 'Close Hand' : `View Hand (${cards.length})`}
                </button>
            </div>

            {/* --- The Hand Drawer --- */}
            <div
                className={`fixed bottom-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-sm p-4 border-t-2 border-blue-500 shadow-2xl z-20 transition-transform duration-500 ease-in-out ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* Horizontal Scrolling Container */}
                <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4">
                    {cards.length > 0 ? (
                        cards.map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className="flex-shrink-0 w-40 cursor-pointer"
                                // In the future, this is where you'd initiate a drag event.
                                // For now, we can have it call onPlayCard directly for simple actions.
                                onClick={() => {
                                    if (isMyTurn) {
                                        // Example: a simple item card play
                                        onPlayCard(card.id, null); // target is null for now
                                        toggleHand(); // Close hand after playing
                                    }
                                }}
                            >
                                <Card cardData={card} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center w-full text-gray-400 p-8">Your hand is empty.</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PlayerHand;