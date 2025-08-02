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
        if (gameState.phase === 'setup' && dropZoneId === 'my-active') {
            actions.setInitialActive(cardHandIndex);
        }

        if (gameState.phase === 'main_phase' && typeof dropZoneId === 'string' && dropZoneId.startsWith('my-bench-')) {
            const benchIndex = parseInt(dropZoneId.split('-')[2]);
            actions.playCardToBench(cardHandIndex, benchIndex);
        }

        if (gameState.phase === 'main_phase' && dropZoneId === 'my-support') {
            actions.playSupportCard(cardHandIndex);
            return; // Stop processing
        }

        // --- Use validTargets for Item cards ---
        if (active.data.current?.cardData?.cardType === 'Item' && typeof dropZoneId === 'string') {
            const draggedCard = active.data.current.cardData;
            if (Array.isArray(draggedCard.validTargets)) {
                // Convert dropZoneId to target string
                const parts = dropZoneId.split('-');
                const owner = parts[0];
                const zone = parts[1];
                const idx = parts[2];
                const targetString = idx !== undefined ? `${owner}_${zone}_${idx}` : `${owner}_${zone}`;
                if (draggedCard.validTargets.includes(targetString)) {
                    // Construct the target object for the backend
                    const target = {
                        playerId: owner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                        zone: zone,
                        index: idx !== undefined ? parseInt(idx) : null,
                    };
                    actions.playItemCard(cardHandIndex, target);
                    return;
                }
            }
        }
    };

    // Show a loading/error state if something is wrong
    if (!gameState || !myPlayerState || !opponentState) {
        return <div>Loading Game...</div>; // Or a more robust loading screen
    }

    // Check for a winner to show the game over screen
    if (gameState.winner) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
                <h2 className="text-2xl mb-2">{gameState.players[gameState.winner]?.username || 'Unknown'} wins!</h2>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg shadow-lg max-w-xl w-full">
                    <h3 className="text-lg font-semibold mb-2">Game Log:</h3>
                    <ul className="max-h-64 overflow-y-auto text-sm">
                        {gameState.log.map((entry, idx) => (
                            <li key={idx} className="mb-1">{entry}</li>
                        ))}
                    </ul>
                </div>
                <button className="mt-8 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300" onClick={() => window.location.href = '/lobbies'}>
                    Return to Lobby
                </button>
            </div>
        );
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