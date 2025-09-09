// src/components/game/PromptDisplay.jsx

import React from 'react';

const PromptDisplay = ({ message }) => {
    // If there's no message, the component renders nothing.
    if (!message) {
        return null;
    }

    return (
        // This container uses absolute positioning to float at the top-center of the screen.
        // `z-30` ensures it's above the game board but potentially below other modals.
        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-30 pointer-events-none">
            {/* The styled message box itself. */}
            {/* If we wanna keep the pulse, just add this back: animate-pulse */ }
            <div className="bg-blue-900 bg-opacity-80 text-white font-bold rounded-lg shadow-lg px-6 py-3 border-2 border-blue-400">
                {message}
            </div>
        </div>
    );
};

export default PromptDisplay;