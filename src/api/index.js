// src/api/index.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper to wrap fetch with Authorization header if token exists
const authFetch = (url, options = {}) => {
    const token = getToken();
    const headers = {
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
};

export const fetchAllCards = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/cards`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch cards:", error);
        return [];
    }
};

export const fetchMyCollection = async () => {
    try {
        const response = await authFetch(`${API_BASE_URL}/users/collection`);
        if (response.status === 401) {
            console.error("Unauthorized: Please log in.");
            return [];
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch user collection:", error);
        return [];
    }
};

export const getCardImageUrl = (cardId, hp) => {
    return `${API_BASE_URL}/cards/image/${cardId}?${hp ? `hp=${hp}` : ''}`;
};

export const fetchUserDecks = async () => {
    return authFetch(`${API_BASE_URL}/decks`)
        .then(res => res.json());
};

export const fetchDeckById = async (deckId) => {
    return authFetch(`${API_BASE_URL}/decks/${deckId}`)
        .then(res => res.json());
};

export const createNewDeck = async (deckName = 'New Deck') => {
    return authFetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deckName })
    }).then(res => res.json());
};

export const updateDeck = async (deckId, deckData) => {
    return authFetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deckData)
    }).then(res => res.json());
};

export const deleteDeckById = async (deckId) => {
    return authFetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'DELETE'
    }).then(res => res.json());
};