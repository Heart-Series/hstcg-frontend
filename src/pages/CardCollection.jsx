// src/pages/CardCollection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchMyCollection } from '../api';
import Card from '../components/Card'; // Our enhanced Card component

const CardCollection = () => {
    const [collection, setCollection] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/');
            return;
        }
        const getCollection = async () => {
            setLoading(true);
            const user_collection = await fetchMyCollection();
            setCollection(user_collection);
            setLoading(false);
        };
        getCollection();
    }, [user, authLoading, navigate]);

    if (authLoading || loading) {
        return <div>Loading your collection...</div>;
    }

    return (
        <div>
            <h1>My Collection</h1>
            {collection.length > 0 ? (
                <>
                    <p>You own {collection.length} unique cards.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-10 p-4">
                        {collection.map(card => (
                            <div
                                key={card.id}
                                className="w-full max-w-[220px] mx-auto"
                            >
                                <Card cardData={card} showBanner />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p>Your collection is empty! Go claim some cards.</p>
            )}
        </div>
    );
};

export default CardCollection;