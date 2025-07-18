import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { fetchDeckById, fetchMyCollection, updateDeck } from '../api';
import Card from '../components/Card';
import ValidationErrors from '../components/ValidationErrors';
import { PencilIcon } from '@heroicons/react/24/solid';
import CollectionControls from '../components/CollectionControls';


const DeckBuilder = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [userCollection, setUserCollection] = useState({});
    const [deck, setDeck] = useState(null);
    const [validation, setValidation] = useState(null);

    // UI & Filter State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sort, setSort] = useState('name')
    const [filters, setFilters] = useState({
        name: '',
        rank: [],       // e.g., [1, 3]
        cardType: [],   // e.g., ['Player', 'Item']
    });
    // Debouncing and Auth
    const debouncedDeck = useDebounce(deck, 750);
    // ... (fetch and autosave useEffects remain largely the same)

    // --- Data Fetching Effect (remains the same) ---
    useEffect(() => {
        Promise.all([
            fetchDeckById(deckId),
            fetchMyCollection()
        ]).then(([deckData, collectionData]) => {
            if (deckData.deck) {
                setDeck(deckData.deck);
                setValidation(deckData.validation);
            }
            const collectionMap = collectionData.reduce((acc, card) => {
                acc[card.id] = card;
                return acc;
            }, {});
            setUserCollection(collectionMap);
            setLoading(false);
        });
    }, [deckId]);

    // --- Autosave Effect (remains the same) ---
    useEffect(() => {
        if (debouncedDeck && !loading) {
            setSaving(true);
            updateDeck(deckId, { name: debouncedDeck.name, cards: debouncedDeck.cards })
                .then(response => {
                    setValidation(response.validation);
                    setSaving(false);
                });
        }
    }, [debouncedDeck, deckId, loading]);


    // --- Memoized Filtering and Sorting Logic ---
    const filteredAndSortedCollection = useMemo(() => {
        const deckCardCounts = deck?.cards.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {}) || {};

        let available = Object.values(userCollection)
            .map(card => {
                const inDeck = deckCardCounts[card.id] || 0;
                return { ...card, availableQuantity: card.quantity - inDeck };
            })
            .filter(card => card.availableQuantity > 0);

        // Apply filters
        if (filters.rank.length > 0) {
            // Only filter player cards by rank
            available = available.filter(card => card.cardType === 'Player' && card.rank == filters.rank);
        }
        if (filters.rank.length > 0) {
            // Keep the card if its rank is included in the filter array
            console.log(filters.rank)
            available = available.filter(card => filters.rank.includes(card.rank));
        }
        if (filters.cardType.length > 0) {
            // Keep the card if its type is included in the filter array
            available = available.filter(card => filters.cardType.includes(card.cardType));
        }
        if (filters.name) {
            available = available.filter(card => card.name.toLowerCase().includes(filters.name.toLowerCase()));
        }

        // Apply sorting
        available.sort((a, b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            if (sort === 'rank') return (b.rank || 0) - (a.rank || 0);
            if (sort === 'type') return a.cardType.localeCompare(b.cardType);
            return 0;
        });

        return available;
    }, [userCollection, deck, filters, sort]);

    // --- Event Handlers (remain the same) ---
    const handleAddCard = (cardId) => {
        setDeck(d => ({ ...d, cards: [...d.cards, cardId] }));
    };
    const handleRemoveCard = (indexToRemove) => {
        setDeck(d => ({ ...d, cards: d.cards.filter((_, i) => i !== indexToRemove) }));
    };
    const handleNameChange = (e) => {
        setDeck(d => ({ ...d, name: e.target.value }));
    };
    const handleDone = () => {
        if (validation?.state === 'draft') {
            alert("Warning: This deck is not legal for play.\n\nReasons:\n" + validation.errors.join("\n"));
        }
        navigate('/decks');
    };


    // --- Render Logic ---
    if (loading) return <div>Loading...</div>;
    if (!deck) return <div>Deck not found.</div>;

    const deckCardObjects = deck.cards.map(id => userCollection[id]).filter(Boolean);

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            {/* --- Top Bar: Deck Info & Actions --- */}
            <header className="flex-shrink-0 bg-white shadow-md p-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-2 group">
                    <input
                        type="text"
                        value={deck.name}
                        onChange={e => setDeck(d => ({ ...d, name: e.target.value }))}
                        className="text-2xl font-bold border-b-2 border-transparent focus:border-blue-500 outline-none bg-transparent transition-colors duration-200"
                    />
                    {/* <PencilIcon className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" /> */}
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <h4 className="font-semibold text-gray-700">
                            Status:
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${validation?.state === 'play' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {validation?.state?.toUpperCase()}
                            </span>
                        </h4>
                        <div className="text-sm text-gray-500">
                            {deck.cards.length} / 30 Cards {saving && <span className="animate-pulse">(Saving...)</span>}
                        </div>
                    </div>
                    <button onClick={() => navigate('/decks')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg">
                        Done
                    </button>
                </div>
            </header>

            {/* --- Top Panel: The Deck Area (NOW A GRID) --- */}
            <main className="flex-shrink-0 bg-gray-200 p-4 border-b-2 border-gray-300 overflow-y-auto z-10" style={{ minHeight: '250px', maxHeight: '40vh' }}>
                {deckCardObjects.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 gap-4">
                        {deckCardObjects.map((card, index) => {
                            const occurrence = deck.cards.slice(0, index + 1).filter(id => id === card.id).length;
                            return (
                                <div
                                    key={`${card.id}-${occurrence}`}
                                    onClick={() => handleRemoveCard(index)}
                                    className="cursor-pointer transform hover:scale-105 hover:-translate-y-1 transition-transform duration-200"
                                >
                                    <Card cardData={card} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 p-8">
                        <p className="text-xl">Your deck is empty. Add cards from your collection below.</p>
                    </div>
                )}
            </main>

            <section className="my-3 mx-1">
                <ValidationErrors validation={validation} />
            </section>


            {/* --- Bottom Panel: The Collection --- */}
            <section className="flex-grow flex flex-col p-4 overflow-hidden bg-gray-50">
                <CollectionControls filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />
                <div className="flex-grow overflow-y-auto pr-2 pt-5"> {/* Added padding-right for scrollbar */}
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-4">
                        {filteredAndSortedCollection.map(card => (
                            <div
                                key={card.id}
                                onClick={() => handleAddCard(card.id)}
                                className="cursor-pointer transform hover:scale-105 hover:-translate-y-1 transition-transform duration-200 w-full max-w-[220px] mx-auto"
                            >
                                <Card cardData={card} quantity={card.availableQuantity} showBanner={true} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DeckBuilder;