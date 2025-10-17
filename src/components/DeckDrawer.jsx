// src/components/DeckDrawer.jsx
import React, { useState, useEffect } from 'react';
import { fetchUserDecks, fetchRentalDecks } from '../api';
import { FaTimes } from 'react-icons/fa';
import DeckCard from './DeckCard';

const DeckDrawer = ({ isOpen, onClose, onSelectDeck }) => {
  const [decks, setDecks] = useState([]);
  const [rentalDecks, setRentalDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-decks');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [userDecksData, rentalDecksData] = await Promise.all([
            fetchUserDecks(),
            fetchRentalDecks()
          ]);
          
          setDecks(userDecksData);
          setRentalDecks(rentalDecksData);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching decks:", err);
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  const handleDeckSelect = (deckId) => {
    onSelectDeck(deckId);
    onClose();
  };

  const renderEmptyState = (message, submessage) => (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1rem',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      color: '#666'
    }}>
      <p style={{ fontSize: '1.1rem', margin: 0 }}>{message}</p>
      <p style={{ margin: '0.5rem 0 0 0' }}>{submessage}</p>
    </div>
  );

  const renderDeckList = (deckList, isRental) => {
    if (deckList.length === 0) {
      return isRental 
        ? renderEmptyState('No rental decks available.', 'Check back later for rental decks!')
        : renderEmptyState('You have no playable decks.', 'Create and complete a deck to use it in games!');
    }
    
    return deckList.map(deck => (
      <DeckCard 
        key={deck._id}
        deck={deck} 
        isRental={isRental} 
        onSelect={handleDeckSelect}
        showPreview={true}
        showDelete={false}
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '500px',
          backgroundColor: 'white',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Select Deck
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaTimes />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          padding: '1rem 1.5rem 0 1.5rem',
          borderBottom: '2px solid #e0e0e0'
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
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          overflow: 'auto'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666'
            }}>
              Loading decks...
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {activeTab === 'my-decks' 
                ? renderDeckList(decks.filter(d => d.state === 'play'), false)
                : renderDeckList(rentalDecks, true)
              }
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeckDrawer;
