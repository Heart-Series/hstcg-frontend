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

export const fetchRentalDecks = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/decks/rental`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch rental decks:", error);
        return [];
    }
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

export const fetchAllPacks = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/packs`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch packs:", error);
        return [];
    }
};

export const getPackImageUrl = (packId) => {
    return `${API_BASE_URL}/packs/image/${packId}`;
};

// Admin API functions
export const fetchAdminStats = async () => {
    return authFetch(`${API_BASE_URL}/admin/stats`)
        .then(res => res.json());
};

export const fetchAllCardsAdmin = async () => {
    return authFetch(`${API_BASE_URL}/admin/cards`)
        .then(res => res.json());
};

export const createCard = async (cardData) => {
    return authFetch(`${API_BASE_URL}/admin/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
    }).then(res => res.json());
};

export const updateCard = async (cardId, cardData) => {
    return authFetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
    }).then(res => res.json());
};

export const deleteCard = async (cardId) => {
    return authFetch(`${API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'DELETE'
    }).then(res => res.json());
};

export const fetchAllUsersAdmin = async () => {
    return authFetch(`${API_BASE_URL}/admin/users`)
        .then(res => res.json());
};

export const updateUserAdminStatus = async (userId, isAdmin) => {
    return authFetch(`${API_BASE_URL}/admin/users/${userId}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin })
    }).then(res => res.json());
};

export const giveCardsToUser = async (userId, cardId, amount) => {
    return authFetch(`${API_BASE_URL}/admin/users/${userId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, amount })
    }).then(res => res.json());
};