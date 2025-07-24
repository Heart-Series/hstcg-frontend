// src/components/game/PlayerArea.jsx
import React from 'react';
import CardOnField from './CardOnField';
import CardSlot from './CardSlot';
import DeckPile from './DeckPile';

const PlayerArea = ({ playerState, isOpponent = false, actions }) => {
    const { activeCard, bench, supportCard, attachedItems, deck, discard } = playerState;

    const renderBench = () => {
        const benchSlots = Array(4).fill(null);
        bench.forEach((card, index) => {
            if (card && index < 4) {
                benchSlots[index] = card;
            }
        });

        return benchSlots.map((card, index) => (
            <div key={index} className="w-24 aspect-[3/4] mx-auto">
                {card ? (
                    <CardOnField cardData={card} />
                ) : (
                    <CardSlot />
                )}
            </div>
        ));
    };

    const mainRowOrder = isOpponent ? 'flex-row' : 'flex-row-reverse';

    return (
        <div className={`flex flex-row w-full h-full gap-4 mx-4`}>
            <div className="content-center">
                <DeckPile type="Deck" count={deck.length}></DeckPile>
            </div>
            <div className={`w-full h-full flex gap-2 justify-around mx-4 ${isOpponent ? 'flex-col' : 'flex-col-reverse'}`}>

                {/* --- Bench Row --- */}
                <div className="grid grid-cols-4 gap-1 content-between">
                    {renderBench()}
                </div>

                {/* --- Active/Support Row --- */}
                <div className={`flex flex-row gap-2 justify-around`}>

                    <div className="w-24"></div>


                    {/* Active Card - centered */}
                    <div className="w-24 aspect-[3/4]">
                        {activeCard ? <CardOnField cardData={activeCard} /> : <CardSlot />}
                    </div>


                    {/* Support Card - positioned to the right */}
                    <div className="w-24 aspect-[3/4]">
                        {supportCard ? <CardOnField cardData={supportCard} /> : <CardSlot />}
                    </div>

                </div>
            </div>
            <div className="content-center">
                <DeckPile type="Discard" count={discard.length} cardData={discard[discard.length - 1]} />
            </div>
        </div>
    );

};

export default PlayerArea;