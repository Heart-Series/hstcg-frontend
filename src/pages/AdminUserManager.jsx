// src/pages/AdminUserManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const data = await response.json();
            setUsers(data);
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

        fetchUsers();
    }, [user, authLoading, navigate, fetchUsers]);

    const handleToggleAdmin = async (userId, currentAdminStatus) => {
        if (!confirm(`${currentAdminStatus ? 'Remove' : 'Grant'} admin privileges for this user?`)) {
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}/admin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isAdmin: !currentAdminStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update user admin status');
            }

            setUsers(users.map(u => 
                u.userId === userId ? { ...u, isAdmin: !currentAdminStatus } : u
            ));
        } catch (err) {
            alert(`Error updating admin status: ${err.message}`);
        }
    };


    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.userId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loading) {
        return <div style={{ padding: '2rem' }}>Loading users...</div>;
    }

    if (error) {
        return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
    }

    if (!user?.isAdmin) {
        return <div style={{ padding: '2rem' }}>Access denied. Admin privileges required.</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>User Manager</h1>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '1rem'
                    }}
                    autoComplete="off"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <strong>Total Users: {filteredUsers.length}</strong>
            </div>

            <div style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#e9ecef',
                    fontWeight: 'bold'
                }}>
                    <div>User ID</div>
                    <div>Name</div>
                    <div>Admin</div>
                    <div>Unique Cards</div>
                    <div>Actions</div>
                </div>

                {filteredUsers.map(userData => (
                    <div key={userData.userId} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr',
                        gap: '1rem',
                        padding: '1rem',
                        borderBottom: '1px solid #dee2e6',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{userData.userId}</div>
                        <div style={{ fontWeight: '500' }}>{userData.name || 'Unknown'}</div>
                        <div style={{ 
                            color: userData.isAdmin ? '#28a745' : '#6c757d',
                            fontWeight: userData.isAdmin ? 'bold' : 'normal'
                        }}>
                            {userData.isAdmin ? 'YES' : 'No'}
                        </div>
                        <div>{userData.cardCount}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => handleToggleAdmin(userData.userId, userData.isAdmin)}
                                style={{
                                    background: userData.isAdmin ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                {userData.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

// Modal for giving cards to users
const GiveCardsModal = ({ user, onGiveCards, onCancel }) => {
    const [cardId, setCardId] = useState('');
    const [amount, setAmount] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cardId.trim()) {
            alert('Card ID is required');
            return;
        }
        if (amount < 1) {
            alert('Amount must be at least 1');
            return;
        }
        onGiveCards(user.userId, cardId, amount);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                width: '400px'
            }}>
                <h2>Give Cards to {user.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Card ID:</label>
                        <input
                            type="text"
                            value={cardId}
                            onChange={(e) => setCardId(e.target.value)}
                            placeholder="e.g., th-home, item-diamond-sword"
                            style={{ 
                                width: '100%', 
                                padding: '0.5rem', 
                                borderRadius: '4px', 
                                border: '1px solid #ccc' 
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount:</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            style={{ 
                                width: '100%', 
                                padding: '0.5rem', 
                                borderRadius: '4px', 
                                border: '1px solid #ccc' 
                            }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Give Cards
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUserManager;
