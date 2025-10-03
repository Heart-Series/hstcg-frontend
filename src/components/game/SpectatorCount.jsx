// src/components/game/SpectatorCount.jsx
import React from 'react';
import { FaEye } from 'react-icons/fa'; // Import the eye icon from Font Awesome

const SpectatorCount = ({ count }) => {
    if (count < 1) {
        return null; // Don't render if no spectators
    }

    return (
        <div className="flex items-center gap-2 text-gray-300">
            <FaEye className="h-4 w-4" />
            <span className="text-sm font-semibold">{count}</span>
        </div>
    );
};

export default SpectatorCount;