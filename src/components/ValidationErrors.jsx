// src/components/ValidationErrors.jsx
import React, { useState } from 'react';

const ValidationErrors = ({ validation }) => {
    const [isOpen, setIsOpen] = useState(true); // Default to open

    // Don't render anything if the deck is playable or there are no errors
    if (!validation || validation.state === 'play' || !validation.errors?.length) {
        return null;
    }

    return (
        <div className="flex-shrink-0 bg-red-50 border-y-2 border-red-200 p-3 z-10">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-bold text-red-800">Deck Invalid ({validation.errors.length} issues)</h3>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    ▼
                </span>
            </div>
            {isOpen && (
                <ul className="mt-2 pl-5 space-y-1 text-sm text-red-700 list-disc">
                    {validation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ValidationErrors;