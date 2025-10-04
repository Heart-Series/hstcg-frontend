// src/components/game/PlayerArea.jsx
import React from 'react';
import CardOnField from './CardOnField';
import CardSlot from './CardSlot';
import DeckPile from './DeckPile';
import { useDroppable } from '@dnd-kit/core';
import Card from '../Card';
import { useGame } from '../../context/GameContext';
import { canDrop } from '../../utils/dropValidation';
import PlayerInfoPanel from './PlayerInfoPanel';

const PlayerArea = ({
  playerState,
  isOpponent = false,
  isSpectator = false,
  actions,
  gameState,
  activeDragData,
  promptChoice,
}) => {
  const { selectedCardId, onCardClick, onActionClick, targeting, openInspector, openCardPileViewer } = useGame();
  const { activeCard, bench, supportCard, attachedItems, deck, discard } = playerState;
  const playerPrefix = isOpponent ? 'opponent' : 'my';

  const validTargets = promptChoice?.validTargets || targeting.action?.validTargets || [];

  // Helper: returns true if card (by instanceId) is included in validTargets
  const isInstanceIdTargetable = (cardInstanceId) => {
    if (!cardInstanceId) return false;
    if (Array.isArray(validTargets) && validTargets.includes(cardInstanceId)) return true;
    // If validTargets contains declarative strings like 'my_bench', keep previous behavior
    return false;
  }

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
      });
      const isValidDrop = () => canDrop({
        draggedCard: activeDragData?.cardData,
        zone: 'bench',
        ownerPlayerState: playerState,
        playerPrefix: isOpponent ? 'opponent' : 'my',
        gameState,
        index
      });
      const canDropSlot = isOver && isValidDrop();
      const isInvalidDrop = isOver && !isValidDrop();

      // console.log(`Targetable`)
      // console.log(`Card: ${card?.instanceId}, Valid Targets: ${validTargets}`);
      // --- Targetable logic: use both targeting and validTargets ---
      // Prefer instanceId based validTargets. If none, fall back to declarative matching by using the targeting.action or promptChoice.
      const isTargetable = isInstanceIdTargetable(card?.instanceId) || (Array.isArray(validTargets) && validTargets.includes(`${playerPrefix}_bench`));


      return (
        <div
          key={index}
          ref={setNodeRef}
          className={`transition-all duration-150 w-32 aspect-[3/4] mx-auto 
                        ${canDropSlot ? 'bg-green-500/40 scale-105' : ''}
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
  });

  // --- Droppable Hook Call #2: For the SUPPORT SLOT ---
  const { isOver: isSupportSlotOver, setNodeRef: setSupportSlotRef } = useDroppable({
    id: isOpponent ? 'opponent-support' : 'my-support',
  });

  // --- Validation Logic for ACTIVE SLOT ---
  const isValidDropOnActive = () => canDrop({
    draggedCard: activeDragData?.cardData,
    zone: 'active',
    ownerPlayerState: playerState,
    playerPrefix: isOpponent ? 'opponent' : 'my',
    gameState,
  });
  const canDropSlotOnActive = isActiveSlotOver && isValidDropOnActive();
  const isInvalidDropOnActive = isActiveSlotOver && !isValidDropOnActive();

  // --- Validation Logic for SUPPORT SLOT ---
  const isValidDropOnSupport = () => canDrop({
    draggedCard: activeDragData?.cardData,
    zone: 'support',
    ownerPlayerState: playerState,
    playerPrefix: isOpponent ? 'opponent' : 'my',
    gameState,
  });
  const canDropSlotOnSupport = isSupportSlotOver && isValidDropOnSupport();
  const isInvalidDropOnSupport = isSupportSlotOver && !isValidDropOnSupport();

  const mainRowOrder = isOpponent ? 'flex-row' : 'flex-row-reverse';

  const isActiveCardTargetable = isInstanceIdTargetable(activeCard?.instanceId) || (Array.isArray(validTargets) && validTargets.includes(`${playerPrefix}_active`));

  return (
    <div className="relative w-full h-full mx-auto overflow-visible">
      {/* Points Indicator */}
      <PlayerInfoPanel
        playerState={playerState}
        isOpponent={isOpponent}
        isSpectator={isSpectator}
      />

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
          <div className="grid grid-cols-3 gap-2 items-center">

            {/* Column 1: Active Item Attachments */}
            <div className="flex flex-row items-center justify-end gap-x-2 h-full">
              {activeCard && activeCard.attachedItems && activeCard.attachedItems.length > 0 && (
                activeCard.attachedItems.map(item => (
                  <div
                    key={item.instanceId}
                    className="w-32 cursor-pointer flex-shrink-0"
                    onClick={() => openInspector(item)}
                  >
                    <Card cardData={item} />
                  </div>
                ))
              )}
            </div>

            {/* Column 2: Active Card Slot (Centered) */}
            <div
              ref={setActiveSlotRef}
              className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150 justify-self-center
            ${canDropSlotOnActive ? 'bg-green-500/40 scale-105' : ''}
            ${isInvalidDropOnActive ? 'bg-red-500/40' : ''}
        `}
            >
              {activeCard
                ? (
                  (gameState?.phase === 'setup' && isOpponent) ? (
                    <div className="w-full h-full rounded-lg overflow-hidden cursor-default select-none">
                      <img src="/images/card_back.png" alt="Face Down" className="w-full h-full object-cover rounded-lg" />
                    </div>
                  ) : (
                    <CardOnField
                      cardData={activeCard}
                      isSelected={selectedCardId === activeCard.instanceId}
                      isTargetable={isActiveCardTargetable}
                      onCardClick={(cardData) => onCardClick(cardData, isActiveCardTargetable)}
                      onActionClick={onActionClick}
                      showTuckedAttachments={false}
                    />
                  )
                )
                : <CardSlot />
              }
            </div>

            {/* Column 3: Support Card Slot */}
            <div
              ref={setSupportSlotRef}
              onClick={() => supportCard && openInspector(supportCard)}
              className={`w-32 aspect-[3/4] rounded-lg transition-all duration-150 justify-self-center
            ${supportCard ? 'cursor-pointer' : ''} 
            ${canDropSlotOnSupport ? 'bg-green-500/40 scale-105' : ''}
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