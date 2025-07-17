// src/pages/CardCollection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchMyCollection } from '../api';
import Card from '../components/Card'; // Our enhanced Card component

const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
};

const MyCollection = () => {
    const [collection, setCollection] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth(); // Get user state from our hook
    const navigate = useNavigate();

    useEffect(() => {
        // If the auth hook is still loading, wait.
        if (authLoading) {
            return;
        }

        // If there's no user after checking, redirect them to the home page.
        if (!user) {
            navigate('/');
            return;
        }

        // If we have a user, fetch their collection.
        const getCollection = async () => {
            setLoading(true);
            const user_collection = await fetchMyCollection();
            setCollection(user_collection);
            setLoading(false);
        };

        getCollection();
    }, [user, authLoading, navigate]); // Rerun this effect if user or authLoading state changes

    // Show a loading message while we're fetching auth status or card data
    if (authLoading || loading) {
        return <div>Loading your collection...</div>;
    }

    return (
        <div>
            <h1>My Collection</h1>
            {collection.length > 0 ? (
                <>
                    <p>You own {collection.length} unique cards.</p>
                    <div style={gridStyle}>
                        {collection.map(card => (
                            // Pass the card data AND the quantity to our Card component
                            <Card key={card.id} cardData={card} quantity={card.quantity} />
                        ))}
                    </div>
                </>
            ) : (
                <p>Your collection is empty! Go claim some cards.</p>
            )}
        </div>
    );
};

export default MyCollection;