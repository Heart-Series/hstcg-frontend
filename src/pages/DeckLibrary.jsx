// src/pages/DeckLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserDecks, createNewDeck, deleteDeckById } from '../api';
import { FaTrash } from 'react-icons/fa';


const DeckLibrary = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-decks');
  const navigate = useNavigate();

  // Mock rental decks data
  const mockRentalDecks = [
    {
      _id: 'rental-1',
      name: 'Cherry Outpost',
      cardCount: 40,
      state: 'play',
      isRental: true
    },
    {
      _id: 'rental-2',
      name: 'Easter Islanders',
      cardCount: 40,
      state: 'play',
      isRental: true
    },
    {
      _id: 'rental-3',
      name: 'Random BS Go',
      cardCount: 40,
      state: 'play',
      isRental: true
    }
  ];

  useEffect(() => {
    fetchUserDecks()
      .then(data => {
        console.log(data)
        setDecks(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching decks:", err));
  }, []);

  const handleCreateDeck = async () => {
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
                backgroundColor: activeTab === 'rental-decks' ? '#4CAF50' : 'transparent',
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
            {decks.map(deck => {
              const stateColor = deck.state === 'play' ? '#4CAF50' :
                deck.state === 'draft' ? '#FF9800' : '#9C27B0';
              const gradientBackground = `linear-gradient(to top, ${stateColor}22 0%, ${stateColor}11 30%, rgba(255,255,255,0.95) 70%, white 100%)`;

              return (
                <div
                  key={deck._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    background: gradientBackground,
                    border: `2px solid ${stateColor}33`,
                    borderRadius: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease, transform 0.2s ease, border-color 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 25px ${stateColor}25`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = `${stateColor}66`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = `${stateColor}33`;
                  }}
                >
                  {/* Subtle accent line at bottom */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(to right, ${stateColor}, ${stateColor}88)`
                  }} />

                  <span style={{
                    color: stateColor,
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    padding: '0.4rem 0.8rem',
                    backgroundColor: `${stateColor}15`,
                    border: `1px solid ${stateColor}40`,
                    borderRadius: '6px',
                    minWidth: '65px',
                    textAlign: 'center',
                    textShadow: `0 1px 2px ${stateColor}20`
                  }}>
                    {deck.state.toUpperCase()}
                  </span>
                  <span
                    onClick={() => navigate(`/decks/${deck._id}`)}
                    style={{
                      cursor: 'pointer',
                      flex: 1,
                      fontSize: '1.1rem',
                      color: '#333',
                      textDecoration: 'none',
                      zIndex: 1
                    }}
                  >
                    <strong>{deck.name}</strong> <span style={{ color: '#555' }}>({deck.cardCount} cards)</span>
                  </span>
                  <button
                    onClick={() => handleDeleteDeck(deck._id)}
                    style={{
                      padding: '0.4rem',
                      backgroundColor: 'transparent',
                      color: '#666',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#f44336';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#666';
                      e.target.style.transform = 'scale(1)';
                    }}
                    title="Delete deck"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {mockRentalDecks.map(deck => {
            const stateColor = '#4CAF50'; // All rental decks are play state
            const gradientBackground = `linear-gradient(to top, ${stateColor}22 0%, ${stateColor}11 30%, rgba(255,255,255,0.95) 70%, white 100%)`;

            return (
              <div
                key={deck._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: gradientBackground,
                  border: `2px solid ${stateColor}33`,
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease, transform 0.2s ease, border-color 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 25px ${stateColor}25`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = `${stateColor}66`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${stateColor}33`;
                }}
              >
                {/* Subtle accent line at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(to right, ${stateColor}, ${stateColor}88)`
                }} />

                <span style={{
                  color: stateColor,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: `${stateColor}15`,
                  border: `1px solid ${stateColor}40`,
                  borderRadius: '6px',
                  minWidth: '65px',
                  textAlign: 'center',
                  textShadow: `0 1px 2px ${stateColor}20`
                }}>
                  RENTAL
                </span>
                <span
                  onClick={() => navigate(`/decks/${deck._id}?readonly=true`)}
                  style={{
                    cursor: 'pointer',
                    flex: 1,
                    fontSize: '1.1rem',
                    color: '#333',
                    textDecoration: 'none',
                    zIndex: 1
                  }}
                >
                  <strong>{deck.name}</strong> <span style={{ color: '#555' }}>({deck.cardCount} cards)</span>
                </span>
                {/* No delete button for rental decks */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeckLibrary;