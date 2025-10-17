// src/pages/DeckLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserDecks, createNewDeck, deleteDeckById, fetchRentalDecks } from '../api';
import DeckCard from '../components/DeckCard';


const DeckLibrary = () => {
  const [decks, setDecks] = useState([]);
  const [rentalDecks, setRentalDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-decks');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userDecksData, rentalDecksData] = await Promise.all([
          fetchUserDecks(),
          fetchRentalDecks()
        ]);
        
        console.log('User decks:', userDecksData);
        console.log('Rental decks:', rentalDecksData);
        
        setDecks(userDecksData);
        setRentalDecks(rentalDecksData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching decks:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);  const handleCreateDeck = async () => {
    const newDeck = await createNewDeck();
    if (newDeck?._id) {
      // Immediately navigate to the deck builder for the new deck
      navigate(`/decks/${newDeck._id}`);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      await deleteDeckById(deckId);
      // Refresh the list by filtering out the deleted deck
      setDecks(currentDecks => currentDecks.filter(d => d._id !== deckId));
    }
  };

  if (loading) return <div>Loading decks...</div>;

  return (
    <div style={{
      padding: '1.5rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e0e0e0',
        position: 'relative'
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: 0
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('my-decks')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'my-decks' ? '#4CAF50' : 'transparent',
                color: activeTab === 'my-decks' ? 'white' : '#666',
                border: activeTab === 'my-decks' ? 'none' : '2px solid #ddd',
                borderBottom: activeTab === 'my-decks' ? 'none' : '2px solid #ddd',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: activeTab === 'my-decks' ? '0' : '-2px',
                position: 'relative',
                zIndex: activeTab === 'my-decks' ? 2 : 1
              }}
            >
              My Decks
            </button>
            <button
              onClick={() => setActiveTab('rental-decks')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'rental-decks' ? '#2196F3' : 'transparent',
                color: activeTab === 'rental-decks' ? 'white' : '#666',
                border: activeTab === 'rental-decks' ? 'none' : '2px solid #ddd',
                borderBottom: activeTab === 'rental-decks' ? 'none' : '2px solid #ddd',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: activeTab === 'rental-decks' ? '0' : '-2px',
                position: 'relative',
                zIndex: activeTab === 'rental-decks' ? 2 : 1
              }}
            >
              Rental Decks
            </button>
          </div>

          {/* Create New Deck button - only show on My Decks tab */}
          {activeTab === 'my-decks' && (
            <button
              onClick={handleCreateDeck}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'background-color 0.3s ease',
                marginBottom: '0',
                position: 'relative',
                zIndex: 2
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              + Create New Deck
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-decks' ? (
        /* My Decks Tab Content */
        decks.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {decks.map(deck => (
              <DeckCard 
                key={deck._id}
                deck={deck} 
                isRental={false} 
                onSelect={null}
                onDelete={handleDeleteDeck}
                showPreview={false}
                showDelete={true}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            color: '#666'
          }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>You have no decks yet.</p>
            <p style={{ margin: '0.5rem 0 0 0' }}>Create one to get started!</p>
          </div>
        )
      ) : (
        /* Rental Decks Tab Content */
        rentalDecks.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {rentalDecks.map(deck => (
              <DeckCard 
                key={deck._id}
                deck={deck} 
                isRental={true} 
                onSelect={null}
                onDelete={null}
                showPreview={false}
                showDelete={false}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            color: '#666'
          }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No rental decks available.</p>
            <p style={{ margin: '0.5rem 0 0 0' }}>Check back later for rental decks!</p>
          </div>
        )
      )}
    </div>
  );
};

export default DeckLibrary;