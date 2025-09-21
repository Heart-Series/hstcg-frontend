// src/components/game/PlayerArea.jsx
import React from 'react';
import CardOnField from './CardOnField';
import CardSlot from './CardSlot';
import DeckPile from './DeckPile';
import { useDroppable } from '@dnd-kit/core';
import Card from '../Card';
import { useGame } from '../../context/GameContext';

const PlayerArea = ({
    playerState,
    isOpponent = false,
    isSpectator= false, 
    actions,
    gameState,
    activeDragData,
    promptChoice,
}) => {
    const { selectedCardId, onCardClick, onActionClick, targeting, openInspector, openCardPileViewer } = useGame();
    const { activeCard, bench, supportCard, attachedItems, deck, discard } = playerState;
    const playerPrefix = isOpponent ? 'opponent' : 'my';

    const validTargets = promptChoice?.validTargets || targeting.action?.validTargets || [];

    const handleDiscardClick = () => {
        // Only open if there are cards to see
        if (discard && discard.length > 0) {
            openCardPileViewer(`${playerState.username}'s Discard Pile`, discard);
        }
    };

    // --- BENCH DROPPABLES & LOGIC ---
    const renderBench = () => {
        const benchSlots = Array(4).fill(null);
        bench.forEach((card, index) => {
            if (card && index < 4) {
                benchSlots[index] = card;
            }
        });
        return benchSlots.map((card, index) => {
            const droppableId = isOpponent ? `opponent-bench-${index}` : `my-bench-${index}`;
            const { isOver, setNodeRef } = useDroppable({
                id: droppableId,
                disabled: isOpponent,
            });
            const isValidDrop = () => {
                if (!activeDragData) return false;
                const draggedCard = activeDragData.cardData;

                // Case 1: Dragging an Item (like Frog)
                if (draggedCard?.cardType === 'Item') {
                    // It's a valid drop IF the slot is OCCUPIED by a player card
                    // AND this bench slot is in the item's validTargets.
                    if (!card) return false; // Must have a card to attach to.

                    const targetString = `${playerPrefix}_bench`; // e.g., 'my_bench'
                    return draggedCard.validTargets?.includes(targetString);
                }

                // Case 2: Dragging a Player card
                if (draggedCard?.cardType === 'Player') {
                    // It's a valid drop IF the slot is EMPTY.
                    return !card;
                }

                // Default: not a valid drop
                return false;
            };
            const canDrop = isOver && isValidDrop();
            const isInvalidDrop = isOver && !isValidDrop();

            // console.log(`Targetable`)
            // console.log(`Card: ${card?.instanceId}, Valid Targets: ${validTargets}`);
            // --- Targetable logic: use both targeting and validTargets ---
            const isTargetable = validTargets.includes(card?.instanceId);


            return (
                <div
                    key={index}
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
                            isSelected={selectedCardId === card.instanceId}
                            isTargetable={isTargetable}
                            onCardClick={(cardData, id) => onCardClick(cardData, id, isTargetable)}
                            onActionClick={onActionClick}
                        />
                    ) : (
                        <CardSlot label={`Bench ${index + 1}`} />
                    )}
                </div>
            );
        });
    };

    // --- Droppable Hook Call #1: For the ACTIVE SLOT ---
    const { isOver: isActiveSlotOver, setNodeRef: setActiveSlotRef } = useDroppable({
        id: isOpponent ? 'opponent-active' : 'my-active',
        // disabled: isOpponent,
    });

    // --- Droppable Hook Call #2: For the SUPPORT SLOT ---
    const { isOver: isSupportSlotOver, setNodeRef: setSupportSlotRef } = useDroppable({
        id: isOpponent ? 'opponent-support' : 'my-support',
        // disabled: isOpponent,
    });

    // --- Validation Logic for ACTIVE SLOT ---
    const isValidDropOnActive = () => {
        if (!activeDragData || !gameState) return false;
        const draggedCard = activeDragData.cardData;

        // Case 1: Dragging an Item (like Invisibility Potion)
        if (draggedCard?.cardType === 'Item') {
            // It's a valid drop IF the active slot has a card 
            // AND this active slot is in the item's validTargets.
            if (!activeCard) return false; // Must have a card to attach to.

            // This correctly checks 'my_active' vs 'opponent_active'
            const targetString = `${playerPrefix}_active`;
            return draggedCard.validTargets?.includes(targetString);
        }

        // Case 2: Dragging a Player card
        if (draggedCard?.cardType === 'Player') {
            // It's a valid drop IF it's the setup phase AND you haven't chosen a card yet.
            console.log(`Player Active Card Droppable  ${gameState.phase === 'setup' || (gameState?.phase === 'main_phase' && gameState?.activePlayerId === playerState.socketId && !playerState.activeCard)}`)
            return gameState.phase === 'setup' || (gameState?.phase === 'main_phase' && gameState?.activePlayerId === playerState.socketId && !playerState.activeCard);
        }

        // Default: not a valid drop
        return false;
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

    const mainRowOrder = isOpponent ? 'flex-row' : 'flex-row-reverse';

    const isActiveCardTargetable = validTargets.includes(activeCard?.instanceId);

    return (
        <div className="relative w-full h-full mx-auto overflow-visible">
            {/* Points Indicator */}
            <div
                className={`absolute ${isOpponent ? 'top-2 right-2' : 'bottom-2 right-2'} bg-yellow-600 text-white rounded-lg px-3 py-1 text-sm font-bold shadow-md z-20`}
                style={{ pointerEvents: 'none' }}   
            >
                 {isSpectator && (
                    <span className="block text-xs font-normal opacity-80">{playerState?.username}</span>
                )}
                Points: {playerState?.points ?? 0}
            </div>

            <div className={`flex flex-row w-full h-full gap-4 px-2`}>
                <div className="content-center">
                    <DeckPile type="Deck" count={deck.length}></DeckPile>
                </div>
                <div className={`w-full h-full flex gap-2 justify-around ${isOpponent ? 'flex-col' : 'flex-col-reverse'}`}>

                    {/* --- Bench Row --- */}
                    <div className="grid grid-cols-4 gap-1 content-between">
                        {renderBench()}
                    </div>

                    {/* --- Active/Support Row --- */}
                    <div className={`flex flex-row gap-2 justify-around`}>

                        <div className="w-32"></div>

                        {/* Active Card - centered */}
                        <div
                            ref={setActiveSlotRef}
                            className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150
                                ${canDropOnActive ? 'bg-green-500/40 scale-105' : ''}
                                ${isInvalidDropOnActive ? 'bg-red-500/40' : ''}
                            `}
                        >
                                {activeCard
                                    ? (
                                        // During the setup phase, the first active card chosen should be face-down
                                        // for the opponent only until the game actually starts. The owner should
                                        // still see their own active card.
                                        (gameState?.phase === 'setup' && isOpponent) ? (
                                            <div className="w-full h-full rounded-lg overflow-hidden cursor-default select-none">
                                                <img src="/images/card_back.png" alt="Face Down" className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                        ) : (
                                            <CardOnField
                                                cardData={activeCard}
                                                droppableId={`${playerPrefix}-active`}
                                                activeDragData={activeDragData}
                                                gameState={gameState}
                                                isSelected={selectedCardId === activeCard.instanceId}
                                                isTargetable={isActiveCardTargetable}
                                                onCardClick={(cardData) => onCardClick(cardData, isActiveCardTargetable)}
                                                onActionClick={onActionClick}
                                            />
                                        )
                                    )
                                    : <CardSlot />
                                }
                        </div>

                        {/* Support Card - positioned to the right */}
                        <div
                            ref={setSupportSlotRef}
                            onClick={() => supportCard && openInspector(supportCard)}
                            className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150
        ${supportCard ? 'cursor-pointer' : ''} 
        ${canDropOnSupport ? 'bg-green-500/40 scale-105' : ''}
        ${isInvalidDropOnSupport ? 'bg-red-500/40' : ''}
    `}
                        >
                            {supportCard ? <Card cardData={supportCard} /> : <CardSlot />}
                        </div>

                    </div>
                </div>
                 <div className="content-center" onClick={handleDiscardClick}>
                    <DeckPile 
                        type="Discard" 
                        count={discard.length} 
                        cardData={discard[0]} 
                    />
                </div>
            </div>
        </div>
    );

};

export default PlayerArea;