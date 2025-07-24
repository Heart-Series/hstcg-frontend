import React from 'react';
import { getCardImageUrl } from '../api';

const Card = ({
    cardData,
    quantity,
    showTitle = false,
    showType = false,
    showBanner = false,
}) => {
    if (!cardData) return null;

    const isPlayerCard = cardData.cardType === 'Player';
    const rank = cardData.rank || 1;
    const displayQuantity = quantity || cardData.quantity;

    // A single, smarter banner component for precise placement
    const OverlapBanner = () => {
        if (!showBanner || !displayQuantity) {
            return null;
        }

        // Common classes for the banner container
        const bannerBaseClasses = "absolute bg-black text-white font-bold rounded-e-md shadow-lg flex select-none z-10";

        if (isPlayerCard) {
            // Render the taller banner for Player cards
            return (
                <div
                    className={`${bannerBaseClasses} flex-col justify-around items-center`}
                    style={{
                        // Position relative to the parent card container
                        top: '0px',      // 8px from the top
                        right: '-26px',  // 16px outside the right edge
                        width: '33px',   // Fixed width
                        height: '60px',  // Taller height for two lines
                    }}
                >
                    <span className="text-base">R{rank}</span>
                    <span className="text-base">x{displayQuantity}</span>
                </div>
            );
        } else {
            // Render the shorter, centered banner for Support cards
            return (
                <div
                    className={`${bannerBaseClasses} justify-center items-center`}
                    style={{
                        top: '0px',
                        right: '-26px',
                        width: '33px',
                        height: '45px', // Shorter height for one line
                    }}
                >
                    <span className="text-lg">x{displayQuantity}</span>
                </div>
            );
        }
    };

    return (
        // The main container MUST be relative for the absolute banner to position correctly.
        <div className="relative w-full">
            {/* The actual card content */}
            <div className="w-full h-full flex flex-col items-center">
                {showTitle && (
                    <h4 className="text-base font-semibold text-gray-800 mb-2 truncate w-full">{cardData.name}</h4>
                )}
                
                {/* bg-gray-200 */}
                <div className="w-full aspect-[3/4]  rounded-lg overflow-hidden">
                    <img
                        src={getCardImageUrl(cardData.id)}
                        alt={cardData.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {showType && (
                    <p className="text-sm text-gray-600 mt-1">Type: {cardData.cardType}</p>
                )}
            </div>

            {/* Render the overlapping banner */}
            <OverlapBanner />
        </div>
    );
};

export default Card;