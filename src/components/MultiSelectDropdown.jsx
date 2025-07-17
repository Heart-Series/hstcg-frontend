// src/components/MultiSelectDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleSelect = (optionValue) => {
        const isSelected = selected.includes(optionValue);
        if (isSelected) {
            // If already selected, remove it
            onChange(selected.filter(item => item !== optionValue));
        } else {
            // If not selected, add it
            onChange([...selected, optionValue]);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center"
            >
                <span>
                    {selected.length > 0 ? `${selected.length} selected` : placeholder}
                </span>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-30 max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option.value} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selected.includes(option.value)}
                                onChange={() => handleSelect(option.value)}
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;