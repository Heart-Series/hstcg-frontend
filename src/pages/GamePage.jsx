// src/pages/GamePage.jsx

import React from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';

import { useLocation } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';
import { GameUIProvider, useGameUI } from '../context/GameUIContext';

// Import all the "dumb" UI components
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/Card';
// import GameLog from '../components/game/GameLog';
// import GameOverScreen from '../components/game/GameOverScreen'; // For the future

const GamePageContent = ({ initialGameState }) => {
    // Initialize the game engine
    const {
        gameState,
        error,
        myPlayerState,
        opponentState,
        isMyTurn,
        canPerformAction,
        actions,
    } = useGameEngine(initialGameState);

    // UI state from context
    const {
        selectedCard, setSelectedCard,
        targeting, setTargeting,
        isHandOpen, setIsHandOpen,
        activeDragId, setActiveDragId,
        activeDragData, setActiveDragData,
    } = useGameUI();

    const handleDragStart = (event) => {
        const { active } = event;
        // active.data.current holds the extra info we'll attach to the card
        setActiveDragId(active.id);
        setActiveDragData(active.data.current);
        // Collapse the hand when a drag starts
        setIsHandOpen(false);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        // Reset the drag state
        setActiveDragId(null);
        setActiveDragData(null);

        // If 'over' is null, it was dropped on a non-droppable area
        if (!over) return;

        // 'active.id' is the ID of the card being dragged (e.g., "hand-card-index-0")
        // 'over.id' is the ID of the droppable area it was dropped on (e.g., "my-active-slot")
        const cardHandIndex = active.data.current?.cardHandIndex;
        const dropZoneId = over.id;

        // --- Handle dropping based on the game phase and drop zone ID ---
        if (gameState.phase === 'setup' && dropZoneId === 'my-active-slot') {
            actions.setInitialActive(cardHandIndex);
        }

        if (gameState.phase === 'main_phase' && typeof dropZoneId === 'string' && dropZoneId.startsWith('my-bench-slot-')) {
            const benchIndex = parseInt(dropZoneId.split('-')[3]);
            actions.playCardToBench(cardHandIndex, benchIndex);
        }

        if (gameState.phase === 'main_phase' && dropZoneId === 'my-support-slot') {
            actions.playSupportCard(cardHandIndex);
            return; // Stop processing
        }

        if (active.data.current?.cardData?.cardType === 'Item' && typeof dropZoneId === 'string' && dropZoneId.includes('-card')) {
            const parts = dropZoneId.split('-'); // ['opponent', 'bench', 'card', '2']
            const targetOwner = parts[0];
            const targetZone = parts[1];
            const targetIndex = parts.length > 3 ? parseInt(parts[3]) : null;

            // Construct the target object for the backend
            const target = {
                playerId: targetOwner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone: targetZone,
                index: targetIndex,
            };

            actions.playItemCard(cardHandIndex, target);
            return;
        }
    };

    // Show a loading/error state if something is wrong
    if (!gameState || !myPlayerState || !opponentState) {
        return <div>Loading Game...</div>; // Or a more robust loading screen
    }

    // Check for a winner to show the game over screen
    if (gameState.winner) {
        return <GameOverScreen winner={gameState.winner} />;
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-5rem)] overflow-hidden bg-gray-800 text-white flex flex-col">
                {/* Display temporary game errors */}
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 p-3 rounded-lg shadow-lg z-50">
                        {error}
                    </div>
                )}

                {/* --- Game Board (Opponent and My Player Area) --- */}
                <div
                    className="flex-grow transition-all duration-500 ease-in-out"
                    style={{
                        // When the hand is open, add padding to the bottom to "push" the board up
                        paddingBottom: isHandOpen ? '250px' : '0px'
                    }}
                >
                    <GameBoard
                        myPlayerState={myPlayerState}
                        opponentState={opponentState}
                        isMyTurn={isMyTurn}
                        actions={actions}
                        gameState={gameState}
                        activeDragData={activeDragData}
                    />
                </div>

                {/* --- Player Hand --- */}
                <PlayerHand
                    cards={myPlayerState.hand}
                    isMyTurn={isMyTurn}
                    onPlayCard={actions.playCard}
                    isOpen={isHandOpen}
                    setIsOpen={setIsHandOpen}
                    canPerformAction={canPerformAction}
                />
            </div>

            <DragOverlay>
                {activeDragId ? (
                    <div className="w-32">
                        {/* Render a Card component using the data we stored in handleDragStart */}
                        <Card cardData={activeDragData?.cardData} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

const GamePage = () => {
    const location = useLocation();
    const initialGameState = location.state?.initialGameState;

    // Use the game engine here to get actions and player states
    const {
        actions,
        myPlayerState,
        opponentState,
        ...rest
    } = useGameEngine(initialGameState);

    return (
        <GameUIProvider actions={actions} myPlayerState={myPlayerState} opponentState={opponentState}>
            <GamePageContent initialGameState={initialGameState} />
        </GameUIProvider>
    );
};

export default GamePage;