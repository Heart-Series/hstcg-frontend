// src/pages/AdminCardManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllPacks } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminCardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced filtering states
  const [filters, setFilters] = useState({
    ranks: [],
    cardTypes: [],
    packs: [],
    hasImage: '' // radio: all, with, without
  });

  // Packs for filtering
  const [allPacks, setAllPacks] = useState([]);
  useEffect(() => { fetchAllPacks().then(setAllPacks); }, []);
  const availablePackOptions = useMemo(() => {
    const options = allPacks.map(pack => ({
      value: pack.packId || pack.name.toLowerCase(),
      label: pack.name
    }));
    options.push({ value: '__no_pack__', label: 'No Pack' });
    return options;
  }, [allPacks]);
  const packCardMapping = useMemo(() => {
    const mapping = {};
    allPacks.forEach(pack => {
      const packKey = pack.packId || pack.name.toLowerCase();
      mapping[packKey] = new Set(pack.cardIds || []);
    });
    return mapping;
  }, [allPacks]);

  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      setCards(data);
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

    fetchCards();
  }, [user, authLoading, navigate, fetchCards]);

  const handleUpdateCard = async (cardId, updateData) => {
    try {
      console.log('handleUpdateCard received:', updateData);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      const { card } = await response.json();

      // Create the updated card with displayName
      const updatedCard = {
        ...card,
        displayName: card.attack ? `${card.attack} ${card.name}` : card.name
      };

      setCards(cards.map(c => c.id === cardId ? updatedCard : c));
      setEditingCard(null);
    } catch (err) {
      alert(`Error updating card: ${err.message}`);
    }
  };

  const handleCreateCard = async (cardData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create card');
      }

      const { card } = await response.json();
      setCards([...cards, card]);
      setShowCreateForm(false);
    } catch (err) {
      alert(`Error creating card: ${err.message}`);
    }
  };

  // --- HAS IMAGE MAP LOGIC ---
  // Map of cardId -> hasImage (true/false), updated by CardItem as images load
  const [hasImageMap, setHasImageMap] = useState({});
  // Callback for CardItem to report image status
  const handleImageStatus = useCallback((cardId, hasImage) => {
    setHasImageMap(prev => {
      if (prev[cardId] === hasImage) return prev;
      return { ...prev, [cardId]: hasImage };
    });
  }, []);

  // Advanced filtering logic (use hasImageMap for filtering if set)
  const filteredCards = cards.filter(card => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      (card.displayName || card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Rank filter (multiple selections)
    const matchesRank = filters.ranks.length === 0 || filters.ranks.some(r => {
      return card.rank?.toString() === r || card.rank === r;
    });

    // Card type filter (multiple selections)
    const matchesCardType = filters.cardTypes.length === 0 || filters.cardTypes.includes(card.cardType);

    // Pack filter (multiple selections, with 'No Pack' support)
    const cardPackKeys = Object.entries(packCardMapping)
      .reduce((arr, [packKey, set]) => {
        if (set.has(card.id)) arr.push(packKey);
        return arr;
      }, []);
    const inNoPack = cardPackKeys.length === 0;
    const matchesPack = filters.packs.length === 0 || filters.packs.some(packKey => {
      if (packKey === '__no_pack__') return inNoPack;
      return cardPackKeys.includes(packKey);
    });

    // Image status filter (use hasImageMap if available)
    let matchesImageStatus = true;
    if (filters.hasImage === 'true') {
      if (Object.prototype.hasOwnProperty.call(hasImageMap, card.id)) {
        matchesImageStatus = hasImageMap[card.id];
      } else {
        matchesImageStatus = card.hasImage;
      }
    } else if (filters.hasImage === 'false') {
      if (Object.prototype.hasOwnProperty.call(hasImageMap, card.id)) {
        matchesImageStatus = !hasImageMap[card.id];
      } else {
        matchesImageStatus = !card.hasImage;
      }
    }

    return matchesSearch && matchesRank && matchesCardType && matchesPack && matchesImageStatus;
  });

  // Get unique values for dynamic filter options
  const getUniqueValues = (field) => {
    const values = cards
      .map(card => card[field])
      .filter(value => value && value !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };

  const uniqueRanks = useMemo(() => {
    // Get all unique ranks as strings for consistent comparison
    return Array.from(new Set(cards.map(card => card.rank).filter(r => r !== undefined && r !== null))).map(r => r.toString()).sort();
  }, [cards]);
  const uniqueCardTypes = getUniqueValues('cardType');


  // Handle card updates without reloading the page
  const handleCardUpdate = (cardId, updatedCardData) => {
    setCards(cards.map(card =>
      card.id === cardId ? { ...card, ...updatedCardData } : card
    ));
  };

  if (authLoading || loading) {
    return <div className="p-8">Loading cards...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!user?.isAdmin) {
    return <div className="p-8">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Card Manager</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Card
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">

          {/* Pack Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Pack</label>
            <div className="space-y-2">
              {availablePackOptions.map(pack => (
                <label key={pack.value} className="flex items-center gap-2 cursor-pointer select-none hover:bg-blue-50 rounded px-2 py-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.packs.includes(pack.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ ...filters, packs: [...filters.packs, pack.value] });
                      } else {
                        setFilters({ ...filters, packs: filters.packs.filter(p => p !== pack.value) });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm cursor-pointer">{pack.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Card Type</label>
            <div className="space-y-2">
              {uniqueCardTypes.map(cardType => (
                <label key={cardType} className="flex items-center gap-2 cursor-pointer select-none hover:bg-green-50 rounded px-2 py-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.cardTypes.includes(cardType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ ...filters, cardTypes: [...filters.cardTypes, cardType] });
                      } else {
                        setFilters({ ...filters, cardTypes: filters.cardTypes.filter(ct => ct !== cardType) });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm cursor-pointer">{cardType} ({cards.filter(c => c.cardType === cardType).length})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rank Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Rank</label>
            <div className="space-y-2">
              {uniqueRanks.map(rank => (
                <label key={rank} className="flex items-center gap-2 cursor-pointer select-none hover:bg-purple-50 rounded px-2 py-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.ranks.includes(rank)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ ...filters, ranks: [...filters.ranks, rank] });
                      } else {
                        setFilters({ ...filters, ranks: filters.ranks.filter(r => r !== rank) });
                      }
                    }}
                    className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm cursor-pointer">Rank {rank} ({cards.filter(c => c.rank?.toString() === rank || c.rank === rank).length})</span>
                </label>
              ))}
            </div>
          </div>



          {/* Image Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Image Status</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none hover:bg-red-50 rounded px-2 py-1 transition-colors">
                <input
                  type="radio"
                  name="imageStatus"
                  checked={filters.hasImage === ''}
                  onChange={() => setFilters({ ...filters, hasImage: '' })}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                />
                <span className="text-sm cursor-pointer">All Cards</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none hover:bg-red-50 rounded px-2 py-1 transition-colors">
                <input
                  type="radio"
                  name="imageStatus"
                  checked={filters.hasImage === 'true'}
                  onChange={() => setFilters({ ...filters, hasImage: 'true' })}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                />
                <span className="text-sm cursor-pointer">
                  Has Image ({
                    cards.filter(c =>
                      Object.prototype.hasOwnProperty.call(hasImageMap, c.id)
                        ? hasImageMap[c.id]
                        : c.hasImage
                    ).length
                  })
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none hover:bg-red-50 rounded px-2 py-1 transition-colors">
                <input
                  type="radio"
                  name="imageStatus"
                  checked={filters.hasImage === 'false'}
                  onChange={() => setFilters({ ...filters, hasImage: 'false' })}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                />
                <span className="text-sm cursor-pointer">
                  No Image ({
                    cards.filter(c =>
                      Object.prototype.hasOwnProperty.call(hasImageMap, c.id)
                        ? !hasImageMap[c.id]
                        : !c.hasImage
                    ).length
                  })
                </span>
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                ranks: [],
                cardTypes: [],
                packs: [],
                hasImage: ''
              })}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Total Cards: {filteredCards.length}</span>
        {(searchTerm ||
          filters.ranks.length > 0 ||
          filters.cardTypes.length > 0 ||
          filters.packs.length > 0 ||
          filters.hasImage !== '') &&
          <span className="text-gray-600"> (filtered from {cards.length})</span>
        }
        {(filters.ranks.length > 0 ||
          filters.cardTypes.length > 0 ||
          filters.packs.length > 0 ||
          filters.hasImage !== '') && (
            <span className="text-blue-600 ml-2">
              • {(filters.ranks.length + filters.cardTypes.length + filters.packs.length + (filters.hasImage !== '' ? 1 : 0))} filter(s) active
            </span>
          )}
        {/* Active Filter Tags */}
        {(filters.ranks.length > 0 ||
          filters.cardTypes.length > 0 ||
          filters.packs.length > 0 ||
          filters.hasImage !== '') && (
            <div className="mt-2 flex flex-wrap gap-1">
              {/* Card type tags */}
              {filters.cardTypes.map(cardType => (
                <span key={`cardType-${cardType}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Type: {cardType}
                  <button
                    onClick={() => setFilters({ ...filters, cardTypes: filters.cardTypes.filter(ct => ct !== cardType) })}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {/* Rank tags */}
              {filters.ranks.map(rank => (
                <span key={`rank-${rank}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Rank: {rank}
                  <button
                    onClick={() => setFilters({ ...filters, ranks: filters.ranks.filter(r => r !== rank) })}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {/* Pack tags */}
              {filters.packs.map(pack => {
                const label = availablePackOptions.find(p => p.value === pack)?.label || pack;
                return (
                  <span key={`pack-${pack}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Pack: {label}
                    <button
                      onClick={() => setFilters({ ...filters, packs: filters.packs.filter(p => p !== pack) })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              {/* Image status tag */}
              {filters.hasImage !== '' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                  {filters.hasImage === 'true' ? 'Has Image' : 'No Image'}
                  <button
                    onClick={() => setFilters({ ...filters, hasImage: '' })}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {filteredCards.map(card => (
          <CardItem
            key={card.id}
            card={card}
            onEdit={() => setEditingCard(card)}
            onCardUpdate={handleCardUpdate}
            onImageStatus={handleImageStatus}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={handleUpdateCard}
          onCancel={() => setEditingCard(null)}
          cards={cards}
          setCards={setCards}
        />
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <CardCreateModal
          onCreate={handleCreateCard}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

// Individual Card Component with Image
const CardItem = ({ card, onEdit, onCardUpdate, onImageStatus }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageChecked, setImageChecked] = useState(false);

  // Use displayName from backend, fallback to name if displayName doesn't exist
  const displayName = card.displayName || card.name;

  // Helper to get image src
  const getImageSrc = () => `${import.meta.env.VITE_API_BASE_URL}/cards/image/${card.id}${card.imageTimestamp ? `?t=${card.imageTimestamp}` : ''}`;

  // Reset image checking when card's imageTimestamp or id changes
  useEffect(() => {
    setImageLoaded(false);
    setImageChecked(false);
  }, [card.imageTimestamp, card.id]);

  // When imageChecked changes, report to parent
  useEffect(() => {
    if (imageChecked) {
      onImageStatus && onImageStatus(card.id, imageLoaded);
    }
  }, [imageChecked, imageLoaded, card.id, onImageStatus]);

  // Handle rank update
  const handleRankChange = async (newRank) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rank: newRank.toString() })
      });

      if (!response.ok) {
        throw new Error('Failed to update rank');
      }

      // Update the card in the parent component's state
      if (onCardUpdate) {
        onCardUpdate(card.id, { ...card, rank: newRank.toString() });
      }
    } catch (err) {
      console.error('Error updating rank:', err);
      alert(`Error updating rank: ${err.message}`);
    }
  };

  // Debug the rank value
  console.log(`Card ${card.id} rank:`, card.rank, typeof card.rank);

  return (
    <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Card Image - Much Bigger */}
      <div className="h-80 w-full mb-4 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
        {!imageChecked ? (
          // Show loading state while checking if image exists
          <div className="flex flex-col items-center text-gray-400 text-center">
            <div className="text-lg">Loading image...</div>
          </div>
        ) : imageLoaded ? (
          <img
            src={getImageSrc()}
            alt={card.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400 text-center">
            <div className="text-4xl mb-3">🖼️</div>
            <div className="text-base">No image available</div>
          </div>
        )}

        {/* Hidden image to check if it exists, only runs once per card/imageTimestamp */}
        {!imageChecked && (
          <img
            src={getImageSrc()}
            className="hidden"
            onLoad={() => {
              setImageLoaded(true);
              setImageChecked(true);
            }}
            onError={() => {
              setImageLoaded(false);
              setImageChecked(true);
            }}
            alt="check"
          />
        )}
      </div>

      {/* Card Info - Center Aligned with Tighter Spacing */}
      <div className="text-center space-y-1 flex-1 flex flex-col justify-center">
        {/* Attack + Name */}
        <h3 className="font-bold text-xl text-gray-800 leading-tight min-h-[3rem] flex items-center justify-center">
          {displayName}
        </h3>

        {/* Card ID */}
        <div className="text-base text-gray-600 font-medium">
          {card.id}
        </div>

        {/* Card Type */}
        <div className="text-base text-gray-700 font-semibold">
          {card.cardType || 'Unknown Type'}
        </div>
      </div>

      {/* Rank Buttons */}
      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3].map((rank) => {
          const isActive = parseInt(card.rank) === rank;
          const getColors = (rankLevel) => {
            switch (rankLevel) {
              case 1: return {
                active: 'bg-amber-600 border-amber-700 shadow-amber-200',
                hover: 'hover:bg-amber-500 hover:border-amber-600',
                inactive: 'bg-gray-200 border-gray-300 hover:bg-gray-400 hover:border-gray-500'
              };
              case 2: return {
                active: 'bg-slate-400 border-slate-500 shadow-slate-200',
                hover: 'hover:bg-slate-300 hover:border-slate-400',
                inactive: 'bg-gray-200 border-gray-300 hover:bg-gray-400 hover:border-gray-500'
              };
              case 3: return {
                active: 'bg-yellow-400 border-yellow-500 shadow-yellow-200',
                hover: 'hover:bg-yellow-300 hover:border-yellow-400',
                inactive: 'bg-gray-200 border-gray-300 hover:bg-gray-400 hover:border-gray-500'
              };
              default: return {
                active: '',
                hover: '',
                inactive: 'bg-gray-200 border-gray-300'
              };
            }
          };

          const colors = getColors(rank);

          return (
            <button
              key={rank}
              onClick={(e) => {
                e.stopPropagation();
                handleRankChange(rank);
              }}
              className={`
                                w-10 h-10 border-2 rounded transition-all duration-200 shadow-sm cursor-pointer
                                ${isActive
                  ? `${colors.active} ${colors.hover}`
                  : `${colors.inactive}`
                }
                            `}
              title={`Rank ${rank} (${rank === 1 ? 'Bronze' : rank === 2 ? 'Silver' : 'Gold'})`}
            >
              <span className="text-sm font-bold text-black">
                {rank}
              </span>
            </button>
          );
        })}
      </div>

      {/* Edit Button - Centered and Prominent */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-base font-medium transition-colors shadow-sm hover:shadow-md cursor-pointer"
        >
          Edit Card
        </button>
      </div>
    </div>
  );
};

// Modal for editing cards
const CardEditModal = ({ card, onSave, onCancel, cards, setCards }) => {
  const [formData, setFormData] = useState({
    name: card.name || '', // Use original name, not display name
    cardType: card.cardType || '',
    hp: card.hp || '',
    attack: card.attack || '',
    effect: card.effect || '',
    weapon: card.weapon || '',
    season: card.season || 'th',
    team: card.team || ''
    // Explicitly exclude image and other unwanted fields
  });

  const [selectedSeason, setSelectedSeason] = useState(card.season || 'th');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const seasonTeams = {
    'th': [
      "Cherry Outpost",
      "Border Gang",
      "Easter Islanders",
      "The Parrot Hut",
    ],
    'hbr': [
      "Archaeologists",
      "Better Parrot Hut",
      "Villagers",
      "Vikings",
      "Walmart",
    ],
    'hl': [
      "Elementalists",
      "Fungi",
      "Mountain Mates",
      "Panda Lookout",
      "The Boys"
    ],
    'hbt': [] // Add teams for hbt if needed
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setFormData(prev => ({
      ...prev,
      season: season,
      team: '' // Reset team when season changes
    }));
  };

  const getTeamsForSeason = (season) => {
    return seasonTeams[season] || Object.values(seasonTeams).flat();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // First, update the card data (without image)
      const submitData = { ...formData };
      delete submitData.image; // Remove any image field to avoid casting errors
      console.log('Submitting card data:', submitData);
      await onSave(card.id, submitData);

      // Then, if there's a selected image, upload it separately
      if (selectedImage) {
        console.log('Uploading image:', selectedImage.name);
        const imageFormData = new FormData();
        imageFormData.append('image', selectedImage);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards/${card.id}/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: imageFormData
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        console.log('Image uploaded successfully');

        // Force refresh the card list to show the new image
        // Add a timestamp to break cache for the image
        const timestamp = Date.now();
        setCards(cards.map(c =>
          c.id === card.id
            ? { ...c, imageTimestamp: timestamp }
            : c
        ));
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Card: {card.name || 'Unnamed Card'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Card ID (Read-only):</label>
                <input
                  type="text"
                  value={card.id}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Card Type:</label>
                <select
                  value={formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="Player">Player</option>
                  <option value="Item">Item</option>
                  <option value="Team">Team</option>
                  <option value="Base">Base</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">HP:</label>
                <input
                  type="number"
                  value={formData.hp}
                  onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Attack:</label>
                <input
                  type="text"
                  value={formData.attack}
                  onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120, 80, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Weapon:</label>
                <select
                  value={formData.weapon}
                  onChange={(e) => setFormData({ ...formData, weapon: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Weapon</option>
                  <option value="Bow">Bow</option>
                  <option value="Axe">Axe</option>
                  <option value="Sword">Sword</option>
                </select>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Effect:</label>
                <textarea
                  value={formData.effect}
                  onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y"
                  placeholder="Card effect description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Season:</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {Object.keys(seasonTeams).map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => handleSeasonChange(season)}
                      className={`px-3 py-2 border rounded text-sm font-medium transition-colors cursor-pointer ${selectedSeason === season
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      {season.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team:</label>
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {getTeamsForSeason(selectedSeason).map(team => (
                    <option key={team} value={team.toLowerCase().replaceAll(" ", "-")}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Image Preview */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Card Image:</label>
                <div className="border-2 border-gray-300 rounded-lg p-4 text-center">
                  <div className="h-80 flex items-center justify-center bg-gray-50 rounded mb-4">
                    <div className="text-center w-full">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Selected preview"
                          className="mx-auto max-h-72 w-full object-contain rounded"
                        />
                      ) : (
                        <>
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}/cards/image/${card.id}${card.imageTimestamp ? `?t=${card.imageTimestamp}` : ''}`}
                            alt="Current card"
                            className="mx-auto max-h-72 w-full object-contain rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ display: 'none' }} className="text-gray-400">
                            <div className="text-6xl mb-4">🖼️</div>
                            <div className="text-lg">No current image</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-blue-50 file:text-blue-700
                                                hover:file:bg-blue-100"
                    />
                  </div>

                  {selectedImage && (
                    <p className="text-xs text-green-600 mt-2">
                      Ready to upload: {selectedImage.name}
                    </p>
                  )}
                  {!selectedImage && (
                    <p className="text-xs text-gray-500 mt-2">
                      Choose an image to replace the current one
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for creating new cards
const CardCreateModal = ({ onCreate, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cardType: '',
    hp: '',
    attack: '',
    description: '',
    rank: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id.trim()) {
      alert('Card ID is required');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Create New Card</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Card ID*:</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Card Type:</label>
            <input
              type="text"
              value={formData.cardType}
              onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">HP:</label>
            <input
              type="number"
              value={formData.hp}
              onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Attack:</label>
            <input
              type="number"
              value={formData.attack}
              onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Rank:</label>
            <input
              type="text"
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium transition-colors"
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCardManager;
