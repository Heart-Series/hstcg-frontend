// src/components/game/DeckPile.jsx
import React from 'react';
import Card from '../Card';

const CARD_BACK_URL = '/images/card_back.png';

const DeckPile = ({ type, count, cardData = null }) => {
    return (
        <div className="relative w-24 aspect-[3/4] flex flex-col items-center justify-center">
            <div className="relative w-full h-full">
                {count > 0 ? (
                    <>
                        <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gray-900 transform translate-x-1 translate-y-1"></div>
                        <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gray-700"></div>
                        <div className="absolute top-0 left-0 w-full h-full rounded-lg">
                            {type === 'Deck' ? (
                                <img src={CARD_BACK_URL} alt="Deck" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Card cardData={cardData} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg"></div>
                )}
            </div>

            {/* Count Badge */}
            <div className="absolute -bottom-3 bg-black text-white rounded-full px-3 py-1 text-sm font-bold">
                {count}
            </div>
        </div>
    );
};

export default DeckPile;