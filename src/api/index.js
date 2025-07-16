// src/api/index.js

const API_BASE_URL = 'http://localhost:3000/api'; // Use your actual backend URL for prod

export const fetchAllCards = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/cards`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch cards:", error);
        // Return an empty array or handle the error as needed
        return [];
    }
};

// We create a helper function to get the image URL directly
export const getCardImageUrl = (cardId) => {
    return `${API_BASE_URL}/cards/image/${cardId}`;
};