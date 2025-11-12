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
  avail: card?.avail || false,
      name: card?.name || '',
      cardType: card?.cardType || '',
      parentId: card?.parentId || '',
      hp: card?.hp || '',
      attack: card?.attack || '',
      effect: card?.effect || '',
      weapon: card?.weapon || '',
      season: card?.season || 'th',
      team: card?.team || ''
    }
    : {
      id: '',
  avail: false,
      name: '',
      cardType: '',
      parentId: '',
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
  // variantType: 'normal' | 'variant' - controls whether card is a variant of a parent
  const [variantType, setVariantType] = useState(isEdit && card?.parentId ? 'variant' : 'normal');
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentResultsOpen, setParentResultsOpen] = useState(false);
  const [parentPreview, setParentPreview] = useState(null);
  const [parentResults, setParentResults] = useState([]);
  const [parentDisplay, setParentDisplay] = useState('');

  useEffect(() => {
    setFormData(initialData);
    setSelectedSeason(initialData.season);
    setImagePreview(null);
    setSelectedImage(null);
    setVariantType(isEdit && card?.parentId ? 'variant' : 'normal');
    setParentSearchTerm('');
    setParentPreview(null);
    setParentResults([]);
    setParentDisplay('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, mode]);

  // Simple parent search: filter provided cards prop by id or name
  useEffect(() => {
    if (!parentSearchTerm || !cards) {
      setParentResults([]);
      return;
    }

    const term = parentSearchTerm.toLowerCase();
    const results = cards.filter(c => (c.id || '').toLowerCase().includes(term) || (c.name || '').toLowerCase().includes(term)).slice(0, 20);
    setParentResults(results);
    setParentResultsOpen(results.length > 0);
  }, [parentSearchTerm, cards]);

  // when parentId changes, try to find the parent card in the provided cards list
  useEffect(() => {
    if (formData.parentId && cards) {
      const found = cards.find(c => c.id === formData.parentId);
      setParentPreview(found || null);
    } else {
      setParentPreview(null);
    }
  }, [formData.parentId, cards]);

  // keep a display string for the parent input to avoid re-triggering search when a parent is selected
  useEffect(() => {
    if (parentPreview) {
      setParentDisplay(parentPreview.id);
    }
  }, [parentPreview]);

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
        // If variant, only send parentId and keep inherited fields as-is.
        if (variantType === 'variant') {
          // ensure only parentId and any allowed editable fields are sent
          const pared = { parentId: submitData.parentId, avail: !!submitData.avail };
          // sanitize: remove empty-string values
          Object.keys(pared).forEach(k => { if (pared[k] === '') delete pared[k]; });
          await onSave(card.id, pared);
        } else {
          delete submitData.image;
          // sanitize submitData to avoid sending empty strings
          Object.keys(submitData).forEach(k => { if (submitData[k] === '') delete submitData[k]; });
          await onSave(card.id, submitData);
        }

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

        // Build create payload based on variantType
        let createPayload = { ...formData };
        if (variantType === 'variant') {
          // for variants we only include id and parentId; server should link via parentId
          createPayload = { id: formData.id, parentId: formData.parentId, avail: !!formData.avail };
        }
        // sanitize payload: remove keys with empty-string values
        Object.keys(createPayload).forEach(k => { if (createPayload[k] === '') delete createPayload[k]; });

        // Call onCreate and wait for created card
        const created = await onCreate(createPayload);

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
            {/* Variant Toggle - full width top of grid */}
            <div className="col-span-1 lg:col-span-3 mb-2">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Mode:</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setVariantType('normal')} className={`px-3 py-1 rounded ${variantType === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Normal</button>
                  <button type="button" onClick={() => setVariantType('variant')} className={`px-3 py-1 rounded ${variantType === 'variant' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Variant</button>
                </div>
                {variantType === 'variant' && <div className="text-xs text-gray-600 ml-4">Variant cards inherit missing fields from a parent card</div>}
              </div>
            </div>
            {/* Left Column */}
            <div className="space-y-4">
              {isEdit && (
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

              {!isEdit && (
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

              {/* Parent selector for Variant mode */}
              {variantType === 'variant' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Parent Card (search by id or name):</label>
                  <input
                    type="text"
                    value={parentDisplay || parentSearchTerm}
                    onChange={(e) => {
                      const v = e.target.value;
                      setParentSearchTerm(v);
                      setParentDisplay('');
                    }}
                    onFocus={() => setParentResultsOpen(parentResults.length > 0)}
                    placeholder="Enter parent id or name..."
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {parentResultsOpen && parentResults.length > 0 && (
                    <div className="border mt-1 max-h-40 overflow-y-auto bg-white rounded shadow-sm">
                      {parentResults.map(p => (
                        <div key={p.id} className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between" onClick={() => {
                          setFormData(prev => ({ ...prev, parentId: p.id }));
                          setParentDisplay(p.id);
                          setParentSearchTerm('');
                          setParentResults([]);
                          setParentResultsOpen(false);
                          setParentPreview(p);
                        }}>
                          <div>
                            <div className="font-medium">{p.id}</div>
                            <div className="text-xs text-gray-500">{p.name}</div>
                          </div>
                          <div className="text-xs text-gray-400">{p.cardType}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Name:</label>
                <input
                  type="text"
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.name || formData.name) : formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={variantType === 'variant'}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>

              {/* Availability Toggle (admin-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">Available:</label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 cursor-pointer ${formData.avail ? '' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.avail}
                      onChange={(e) => setFormData({ ...formData, avail: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">This card is available to players</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Card Type:</label>
                <select
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.cardType || formData.cardType) : formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                  disabled={variantType === 'variant'}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.hp ?? formData.hp) : formData.hp}
                  onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                  disabled={variantType === 'variant'}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Attack:</label>
                <input
                  type="text"
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.attack ?? formData.attack) : formData.attack}
                  onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                  disabled={variantType === 'variant'}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 120, 80, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Weapon:</label>
                <select
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.weapon || formData.weapon) : formData.weapon}
                  onChange={(e) => setFormData({ ...formData, weapon: e.target.value })}
                  disabled={variantType === 'variant'}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.effect ?? formData.effect) : formData.effect}
                  onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Card effect description..."
                  disabled={variantType === 'variant'}
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
                      disabled={variantType === 'variant'}
                    >
                      {season.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team:</label>
                <select
                  value={variantType === 'variant' && formData.parentId ? (parentPreview?.team ?? formData.team) : formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${variantType === 'variant' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={variantType === 'variant'}
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
                              src={variantType === 'variant' && formData.parentId && parentPreview
                                ? `${import.meta.env.VITE_API_BASE_URL}/cards/image/${parentPreview.id}${parentPreview.imageTimestamp ? `?t=${parentPreview.imageTimestamp}` : ''}`
                                : `${import.meta.env.VITE_API_BASE_URL}/cards/image/${card.id}${card.imageTimestamp ? `?t=${card.imageTimestamp}` : ''}`}
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
