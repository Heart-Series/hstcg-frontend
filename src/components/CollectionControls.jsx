// src/components/CollectionControls.jsx
import React from 'react';
import MultiSelectDropdown from './MultiSelectDropdown'; // Import the new component

const CollectionControls = ({ filters, setFilters, sort, setSort }) => {

    const rankOptions = [
        { value: 1, label: 'Rank 1' },
        { value: 2, label: 'Rank 2' },
        { value: 3, label: 'Rank 3' },
        { value: 4, label: 'Rank 4' },
    ];

    const typeOptions = [
        { value: 'Player', label: 'Player' },
        { value: 'Item', label: 'Item' },
        { value: 'Base', label: 'Base' },
        { value: 'Team', label: 'Team' },
    ];

    const handleFilterChange = (filterName, value) => {
        setFilters(f => ({ ...f, [filterName]: value }));
    };

    return (
        <div className="bg-white rounded-lg shadow-inner p-3 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center border border-gray-200">
            {/* Search Input */}
            <div className="md:col-span-1">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Rank Filter */}
            <div className="md:col-span-1">
                <MultiSelectDropdown
                    options={rankOptions}
                    selected={filters.rank}
                    onChange={(value) => handleFilterChange('rank', value)}
                    placeholder="Filter by Rank"
                />
            </div>
            
            {/* Card Type Filter */}
            <div className="md:col-span-1">
                <MultiSelectDropdown
                    options={typeOptions}
                    selected={filters.cardType}
                    onChange={(value) => handleFilterChange('cardType', value)}
                    placeholder="Filter by Type"
                />
            </div>

            {/* Sorting Dropdown */}
            <div className="md:col-span-1">
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md bg-white w-full"
                >
                    <option value="name">Sort by Name</option>
                    <option value="rank">Sort by Rank</option>
                    <option value="type">Sort by Type</option>
                </select>
            </div>
        </div>
    );
};

export default CollectionControls;