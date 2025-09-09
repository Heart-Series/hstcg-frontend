// src/components/game/InspectorPanel.jsx
import React from 'react';
import { useGameUI } from '../../context/GameUIContext';
import Card from '../Card'; // Your reusable Card component
import { useGameEngine } from '../../hooks/useGameEngine';

const InspectorPanel = () => {
    const { inspectorCardData, closeInspector } = useGameUI();
    const { actions, promptChoice } = useGameEngine(); // Get actions and the current prompt

    if (!inspectorCardData) return null;

    const handleTargetClick = (targetInstanceId) => {
        // This function is only active if we're in the correct phase of a prompt.
        if (promptChoice && promptChoice.phase === 2) {
            actions.playItemCard(
                null,                // No new card from hand
                targetInstanceId,    // The instanceId of the card we clicked
                promptChoice.phase,
                promptChoice.choosingState
            );
            // The action is sent, so we can close the inspector.
            closeInspector();
        }
    };

    const isHostCardSelectable = promptChoice?.phase === 2 && promptChoice.options?.includes(inspectorCardData.instanceId);

    const renderStatusEffects = () => {
        if (!inspectorCardData.statusEffects || inspectorCardData.statusEffects.length === 0) {
            return (
                <div className="text-gray-500 italic">No active effects.</div>
            );
        }

        return (
            <ul className="space-y-2">
                {inspectorCardData.statusEffects.map((status, index) => (
                    <li key={index} className="bg-gray-700 p-2 rounded-md text-sm">
                        <p className="font-bold text-yellow-400">{status.name}</p>
                        <p className="text-gray-300">
                            {/* We can customize the display based on the effect type */}
                            {status.type === 'BORROWED_PASSIVE' && `This card is temporarily using another card's passive ability.`}

                            {status.type === 'DAMAGE_MODIFIER' && `Modifies outgoing damage by ${status.value}.`}
                            {status.type === 'DAMAGE_REDUCTION' && `Reduces incoming damage by ${status.value * 100}%.`}
                            {status.type === 'CANNOT_ATTACK' && `This card/user cannot attack.`}
                            {status.type === 'CANNOT_RETREAT' && `This card cannot retreat.`}
                            {status.type === 'DELAYED_DAMAGE_ACTIVE' && `The active card will take ${status.value} damage at the end of the turn.`}
                            {status.type === 'DELAYED_DAMAGE' && `This card will take ${status.value} damage at the end of the turn.`}
                            {/* Add more descriptions for other status types here */}
                        </p>
                        <p className="text-gray-400 text-xs">Turns remaining: {status.duration}</p>
                    </li>
                ))}
            </ul>
        );
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
                    <div onClick={() => isHostCardSelectable && handleTargetClick(inspectorCardData.instanceId)}
                        className={`${isHostCardSelectable ? 'cursor-pointer ring-4 ring-yellow-400 animate-pulse' : ''} rounded-lg`}>
                        <Card cardData={inspectorCardData} />

                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                        <p>HP: {inspectorCardData.hp}</p>
                        {/* Add any other stats you want to show here */}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-bold text-gray-300 mb-2">Active Effects</h3>
                        {renderStatusEffects()}
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
                                        onClick={() => isSelectable && handleTargetClick(item.instanceId)}
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