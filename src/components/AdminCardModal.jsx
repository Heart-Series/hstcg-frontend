import React, { useState, useEffect } from 'react';

// AdminCardModal: used for both editing and creating cards. Mode is 'edit' or 'create'.
export default function AdminCardModal({
  mode = 'edit',
  card = null,
  onSave, // (cardId, data) => Promise
  onCreate, // (data) => Promise that resolves to created card { card }
  onCancel,
  cards,
  setCards
}) {
  const isEdit = mode === 'edit';

  const initialData = isEdit
    ? {
        name: card?.name || '',
        cardType: card?.cardType || '',
        hp: card?.hp || '',
        attack: card?.attack || '',
        effect: card?.effect || '',
        weapon: card?.weapon || '',
        season: card?.season || 'th',
        team: card?.team || ''
      }
    : {
        id: '',
        name: '',
        cardType: '',
        hp: '',
        attack: '',
        effect: '',
        weapon: '',
        season: 'th',
        team: '',
        rank: ''
      };

  const [formData, setFormData] = useState(initialData);
  const [selectedSeason, setSelectedSeason] = useState(initialData.season);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setFormData(initialData);
    setSelectedSeason(initialData.season);
    setImagePreview(null);
    setSelectedImage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, mode]);

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
    'hbt': []
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setFormData(prev => ({ ...prev, season, team: '' }));
  };

  const getTeamsForSeason = (season) => seasonTeams[season] || Object.values(seasonTeams).flat();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        const submitData = { ...formData };
        delete submitData.image;
        await onSave(card.id, submitData);

        if (selectedImage) {
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

          const timestamp = Date.now();
          setCards && setCards(cards.map(c => c.id === card.id ? { ...c, imageTimestamp: timestamp } : c));
        }
      } else {
        // Create flow: ensure id is present
        if (!formData.id || !formData.id.trim()) {
          alert('Card ID is required');
          return;
        }

        // Call onCreate and wait for created card
        const created = await onCreate(formData);

        // If image selected, upload to created card endpoint
        if (selectedImage && created?.card?.id) {
          const imageFormData = new FormData();
          imageFormData.append('image', selectedImage);

          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/cards/${created.card.id}/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: imageFormData
          });

          if (!response.ok) {
            throw new Error('Failed to upload image for created card');
          }

          const timestamp = Date.now();
          setCards && setCards(prev => prev.map(c => c.id === created.card.id ? { ...c, imageTimestamp: timestamp } : c));
        }
      }
    } catch (err) {
      console.error('AdminCardModal submit error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel && onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{isEdit ? `Edit Card: ${card?.name || 'Unnamed Card'}` : 'Create New Card'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              { isEdit && (
                <div>
                  <label className="block text-sm font-medium mb-2">Card ID (Read-only):</label>
                  <input
                    type="text"
                    value={card?.id || ''}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              )}

              { !isEdit && (
                <div>
                  <label className="block text-sm font-medium mb-2">Card ID*:</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

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
                        isEdit ? (
                          <>
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL}/cards/image/${card.id}${card.imageTimestamp ? `?t=${card.imageTimestamp}` : ''}`}
                              alt="Current card"
                              className="mx-auto max-h-72 w-full object-contain rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'block');
                              }}
                            />
                            <div style={{ display: 'none' }} className="text-gray-400">
                              <div className="text-6xl mb-4">🖼️</div>
                              <div className="text-lg">No current image</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">
                            <div className="text-6xl mb-4">🖼️</div>
                            <div className="text-lg">No current image</div>
                          </div>
                        )
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
                    <p className="text-xs text-green-600 mt-2">Ready to upload: {selectedImage.name}</p>
                  )}
                  {!selectedImage && (
                    <p className="text-xs text-gray-500 mt-2">Choose an image to replace the current one</p>
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
              className={` ${isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded font-medium transition-colors cursor-pointer`}
            >
              {isEdit ? 'Save Changes' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
