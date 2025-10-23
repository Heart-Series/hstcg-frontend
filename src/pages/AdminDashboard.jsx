// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user?.isAdmin) {
            navigate('/');
            return;
        }

        fetchStats();
    }, [user, authLoading, token, navigate, fetchStats]);

    if (authLoading || loading) {
        return <div style={{ padding: '2rem' }}>Loading admin dashboard...</div>;
    }

    if (error) {
        return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
    }

    if (!user?.isAdmin) {
        return <div style={{ padding: '2rem' }}>Access denied. Admin privileges required.</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Admin Dashboard</h1>
            
            {stats && (
                <>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem', 
                        marginBottom: '2rem' 
                    }}>
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3>Total Cards</h3>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#007bff' }}>
                                {stats.stats.totalCards}
                            </p>
                        </div>
                        
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3>Total Users</h3>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#28a745' }}>
                                {stats.stats.totalUsers}
                            </p>
                        </div>
                        
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3>Total Decks</h3>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#ffc107' }}>
                                {stats.stats.totalDecks}
                            </p>
                        </div>
                        
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3>Total Packs</h3>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#dc3545' }}>
                                {stats.stats.totalPacks}
                            </p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2>Quick Actions</h2>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => navigate('/admin/cards')}
                                style={{
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Manage Cards
                            </button>
                            
                            <button
                                onClick={() => navigate('/admin/users')}
                                style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Manage Users
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2>Recent Users</h2>
                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                            {stats.recentUsers.map(user => (
                                <div key={user.userId} style={{ 
                                    padding: '0.5rem 0', 
                                    borderBottom: '1px solid #dee2e6',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>
                                        <strong>{user.name}</strong> ({user.userId})
                                    </span>
                                    <span style={{ 
                                        color: user.claimedStarterPack ? '#28a745' : '#dc3545',
                                        fontSize: '0.9rem'
                                    }}>
                                        {user.claimedStarterPack ? 'Starter Claimed' : 'New User'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
