// src/components/DeckCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const DeckCard = ({ 
  deck, 
  isRental = false, 
  onSelect = null, 
  onDelete = null, 
  showPreview = true,
  showDelete = false 
}) => {
  const navigate = useNavigate();

  const getDeckDisplayInfo = () => ({
    stateColor: isRental ? '#2196F3' : (deck.state === 'play' ? '#4CAF50' : deck.state === 'draft' ? '#FF9800' : '#9C27B0'),
    badge: isRental ? 'RENTAL' : deck.state.toUpperCase(),
    cardCount: deck.cardCount || deck.cards?.length || 0,
    previewUrl: `/decks/${deck._id}${isRental ? '?readonly=true' : ''}`
  });

  const { stateColor, badge, cardCount, previewUrl } = getDeckDisplayInfo();
  const gradientBackground = `linear-gradient(to top, ${stateColor}22 0%, ${stateColor}11 30%, rgba(255,255,255,0.95) 70%, white 100%)`;

  const handleClick = () => {
    if (onSelect) {
      onSelect(deck._id);
    } else {
      navigate(previewUrl);
    }
  };

  return (
    <div
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
        backdropFilter: 'blur(10px)',
        cursor: onSelect ? 'pointer' : 'default'
      }}
      onClick={onSelect ? handleClick : undefined}
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

      {/* State/Type Badge */}
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
        {badge}
      </span>
      
      {/* Deck Info */}
      <div style={{ flex: 1 }}>
        <span 
          style={{
            fontSize: '1.1rem',
            color: '#333',
            textDecoration: 'none',
            zIndex: 1,
            display: 'block',
            cursor: !onSelect ? 'pointer' : 'inherit'
          }}
          onClick={!onSelect ? (e) => {
            e.stopPropagation();
            navigate(previewUrl);
          } : undefined}
        >
          <strong>{deck.name}</strong> <span style={{ color: '#555' }}>({cardCount} cards)</span>
        </span>
        {deck.description && (
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.875rem',
            color: '#666',
          }}>
            {deck.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {showPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(previewUrl);
            }}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: 'rgba(0,0,0,0.05)',
              color: '#666',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.3s ease',
              zIndex: 1
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(0,0,0,0.1)';
              e.target.style.color = '#333';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(0,0,0,0.05)';
              e.target.style.color = '#666';
            }}
            title={onSelect ? "Preview deck" : "Edit deck"}
          >
            {onSelect ? 'Preview' : 'Edit'}
          </button>
        )}

        {showDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deck._id);
            }}
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
        )}
      </div>
    </div>
  );
};

export default DeckCard;
