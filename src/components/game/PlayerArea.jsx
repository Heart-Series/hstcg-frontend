// src/components/game/PlayerArea.jsx
import React from 'react';
import CardOnField from './CardOnField';
import CardSlot from './CardSlot';
import DeckPile from './DeckPile';
import { useDroppable } from '@dnd-kit/core';
import { useGameUI } from '../../context/GameUIContext';

const BenchSlot = ({ card, index, isOpponent, gameState, activeDragData, isCardSelected, isCardTargetable }) => {
    const { onCardClick, onActionClick } = useGameUI();

    const droppableId = isOpponent ? `opponent-bench-slot-${index}` : `my-bench-slot-${index}`;
    const { isOver, setNodeRef } = useDroppable({
        id: droppableId,
        disabled: isOpponent,
    });

    const isValidDrop = () => {
        if (!activeDragData || !gameState || card) return false; // Cannot drop on an occupied slot
        const draggedCard = activeDragData.cardData;

        return gameState.phase === 'main_phase' && draggedCard?.cardType === 'Player';
    };

    const canDrop = isOver && isValidDrop();
    const isInvalidDrop = isOver && !isValidDrop();

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-150 w-32 aspect-[3/4] mx-auto 
                ${canDrop ? 'bg-green-500/40 scale-105' : ''}
                ${isInvalidDrop ? 'bg-red-500/40' : ''}
            `}
        >
            {card ? (
                <CardOnField
                    cardData={card}
                    droppableId={droppableId}
                    activeDragData={activeDragData}
                    gameState={gameState}
                    isSelected={isCardSelected(droppableId)}
                    isTargetable={isCardTargetable(droppableId)}
                    onCardClick={onCardClick}
                    onActionClick={onActionClick}
                />
            ) : (
                <CardSlot label={`Bench ${index + 1}`} />
            )}
        </div>
    );
};


const PlayerArea = ({
    playerState,
    isOpponent = false,
    actions,
    gameState,
    activeDragData
    // Remove selectedCard, onCardClick, onActionClick, targeting from props
}) => {
    // Use useGameUI for UI state
    const { selectedCard, onCardClick, onActionClick, targeting } = useGameUI();
    const { activeCard, bench, supportCard, attachedItems, deck, discard } = playerState;
    const playerPrefix = isOpponent ? 'opponent' : 'my';

    const renderBench = () => {
        const benchSlots = Array(4).fill(null);
        bench.forEach((card, index) => {
            if (card && index < 4) {
                benchSlots[index] = card;
            }
        });

        return benchSlots.map((card, index) => (
            <BenchSlot
                key={index}
                card={card}
                index={index}
                isOpponent={isOpponent}
                gameState={gameState}
                activeDragData={activeDragData}
                isCardSelected={isCardSelected}
                isCardTargetable={isCardTargetable}
            />
        ));
    };

    // --- Droppable Hook Call #1: For the ACTIVE SLOT ---
    const { isOver: isActiveSlotOver, setNodeRef: setActiveSlotRef } = useDroppable({
        id: isOpponent ? 'opponent-active-slot' : 'my-active-slot',
        disabled: isOpponent,
    });

    // --- Droppable Hook Call #2: For the SUPPORT SLOT ---
    const { isOver: isSupportSlotOver, setNodeRef: setSupportSlotRef } = useDroppable({
        id: isOpponent ? 'opponent-support-slot' : 'my-support-slot',
        disabled: isOpponent,
    });

    // --- Validation Logic for ACTIVE SLOT ---
    const isValidDropOnActive = () => {
        if (!activeDragData || !gameState) return false;
        const draggedCard = activeDragData.cardData;
        return gameState.phase === 'setup' && draggedCard?.cardType === 'Player' && !playerState.hasChosenActive;
    };
    const canDropOnActive = isActiveSlotOver && isValidDropOnActive();
    const isInvalidDropOnActive = isActiveSlotOver && !isValidDropOnActive();

    // --- Validation Logic for SUPPORT SLOT ---
    const isValidDropOnSupport = () => {
        if (!activeDragData || !gameState) return false;
        const draggedCard = activeDragData.cardData;
        return gameState.phase === 'main_phase' && (draggedCard?.cardType === 'Base' || draggedCard?.cardType === 'Team');
    };
    const canDropOnSupport = isSupportSlotOver && isValidDropOnSupport();
    const isInvalidDropOnSupport = isSupportSlotOver && !isValidDropOnSupport();

    // Helper to determine if a specific card is selected
    const isCardSelected = (droppableId) => selectedCard === droppableId;

    // Helper to determine if a card is a valid target
    const isCardTargetable = (droppableId) => {
        if (!targeting.isTargeting || !targeting.action || !Array.isArray(targeting.action.validTargets)) return false;
        // Parse droppableId: e.g. 'my-bench-slot-2', 'opponent-active-card'
        console.log(droppableId)
        const parts = droppableId.split('-');
        const owner = parts[0]; // 'my' or 'opponent'
        const zone = parts[1]; // 'bench', 'active', etc.
        // Compose the target string as used in validTargets
        console.log(targeting)
        const targetString = `${owner}_${zone}`;
        // Check if this string is in validTargets
        return targeting.action.validTargets.includes(targetString);
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

                    <div className="w-32"></div>


                    {/* Active Card - centered */}
                    <div class="w-32"
                        ref={setActiveSlotRef} // This makes the whole area a drop zone
                        className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150
                            ${canDropOnActive ? 'bg-green-500/40 scale-105' : ''}
                            ${isInvalidDropOnActive ? 'bg-red-500/40' : ''}
                        `}
                    >
                        {activeCard
                            ? <CardOnField
                                cardData={activeCard}
                                droppableId={`${playerPrefix}-active-card`}
                                activeDragData={activeDragData}
                                gameState={gameState}
                                isSelected={isCardSelected(`${playerPrefix}-active-card`)}
                                isTargetable={isCardTargetable(`${playerPrefix}-active-card`)}
                                onCardClick={onCardClick}
                                onActionClick={onActionClick}
                            />
                            : <CardSlot />
                        }
                    </div>

                    {/* Support Card - positioned to the right */}
                    <div
                        ref={setSupportSlotRef}
                        className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150
                            ${canDropOnSupport ? 'bg-green-500/40 scale-105' : ''}
                            ${isInvalidDropOnSupport ? 'bg-red-500/40' : ''}
                        `}
                    >
                        {supportCard ? <CardOnField cardData={supportCard} /> : <CardSlot />}
                    </div>

                </div>
            </div>
            <div className="content-center">
                <DeckPile type="Discard" count={discard.length} cardData={discard[0]} />
            </div>
        </div>
    );

};

export default PlayerArea;