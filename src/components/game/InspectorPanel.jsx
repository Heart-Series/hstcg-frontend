// src/components/game/InspectorPanel.jsx
import React from 'react';
import { useGameUI } from '../../context/GameUIContext';
import Card from '../Card'; // Your reusable Card component
import { useGameEngine } from '../../hooks/useGameEngine';

const InspectorPanel = () => {
    const { inspectorCardData, closeInspector } = useGameUI();
    const { actions, promptChoice } = useGameEngine(); // Get actions and the current prompt

    if (!inspectorCardData) return null;

    const handleItemClick = (itemInstanceId) => {
        // This function is only active if we're in the correct phase of a prompt.
        if (promptChoice && promptChoice.phase === 2) {
            
            // This is the special "target" object for phase 2.
            const itemTarget = { itemInstanceId: itemInstanceId };

            // Call the same playItemCard action, but for the next phase.
            actions.playItemCard(
                null, // No new card is being played from hand
                itemTarget,
                promptChoice.phase,
                promptChoice.choosingState
            );

            // The backend will respond with a new prompt for phase 3,
            // which will close the inspector and start board targeting.
            closeInspector();
        }
    };

    return (
        // The semi-transparent background overlay
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center"
            onClick={closeInspector} // Click background to close
        >
            {/* The main panel content. Stop propagation to prevent closing when clicking inside. */}
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-6 border-2 border-gray-600 w-full max-w-4xl flex gap-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={closeInspector}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold"
                >&times;</button>
                
                {/* Left Side: Large Host Card */}
                <div className="w-1/3">
                    <h2 className="text-lg font-bold text-gray-300 mb-2">Selected Card</h2>
                    <Card cardData={inspectorCardData} />
                    <div className="mt-4 text-sm text-gray-400">
                        <p>HP: {inspectorCardData.hp}</p>
                        {/* Add any other stats you want to show here */}
                    </div>
                </div>
                
                {/* Right Side: Attached Items */}
                <div className="w-2/3">
                    <h2 className="text-lg font-bold text-gray-300 mb-2">Attached Items</h2>
                    {inspectorCardData.attachedItems && inspectorCardData.attachedItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
                            {inspectorCardData.attachedItems.map(item => {
                                // Check if this item is a valid choice for the current prompt
                                const isSelectable = promptChoice?.phase === 2 && promptChoice.options?.includes(item.instanceId);
                                
                                return (
                                    <div 
                                        key={item.instanceId}
                                        // Add onClick handler here
                                        onClick={() => isSelectable && handleItemClick(item.instanceId)}
                                        className={`${isSelectable ? 'cursor-pointer ring-4 ring-yellow-400 animate-pulse' : ''}`}
                                    >
                                        <Card cardData={item} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No items attached.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InspectorPanel;