import React from 'react';
import Card from '../Card';

const CardPileViewer = ({ title, cards, onClose }) => {
    return (
        // The semi-transparent background overlay
        <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
            onClick={onClose} // Click background to close
        >
            {/* The main panel content */}
            <div
                className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-600 w-full max-w-4xl flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-200">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl font-bold"
                    >&times;</button>
                </div>
                
                {/* Scrollable Card Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[60vh] p-2">
                    {cards.map(card => (
                        <div key={card.instanceId} className="w-full">
                            <Card cardData={card} />
                        </div>
                    ))}
                </div>

                {/* Action Buttons - For now, just a close button */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CardPileViewer;