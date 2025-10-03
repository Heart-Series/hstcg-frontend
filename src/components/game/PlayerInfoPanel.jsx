// src/components/game/PlayerInfoPanel.jsx

import React from 'react';

const pointColorMap = {
    0: '#15803d', // dark green
    1: '#16a34a', // green
    2: '#ca8a04', // yellow-ish
    3: '#ea580c', // orange
    4: '#dc2626', // red
    5: '#6b7280', // gray
};

const PlayerInfoPanel = ({ playerState, isOpponent, isSpectator }) => {
    const points = playerState?.points ?? 0;
    const handSize = playerState?.hand?.length ?? 0;

    // Determine the background color. Fallback to the '5 points' color if points > 5.
    const backgroundColor = pointColorMap[points] || pointColorMap[5];

    // Determine positioning and text alignment based on whether it's for the opponent or you.
    const positionClasses = isOpponent ? 'top-4 right-4 text-right' : 'bottom-4 right-4 text-right';

    return (
        <div
            className={`absolute ${positionClasses} text-white rounded-lg px-4 py-2 text-sm font-bold shadow-lg z-20 transition-colors duration-300`}
            style={{ 
                backgroundColor: backgroundColor,
                pointerEvents: 'none' // Makes it so you can't click on the panel
            }}
        >
            {isSpectator && (
                <span className="block text-xs font-semibold opacity-90">{playerState?.username}</span>
            )}

            <span className="block text-md">Points: {points}</span>

            {(isOpponent || isSpectator) && (
                <span className="block text-xs font-medium opacity-80">Hand: {handSize}</span>
            )}
        </div>
    );
};

export default PlayerInfoPanel;