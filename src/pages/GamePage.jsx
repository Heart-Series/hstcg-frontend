// src/pages/GamePage.jsx

import React, { useEffect } from 'react';
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

    // UI state from context
    const {
        selectedCard, setSelectedCard,
        targeting, setTargeting,
        isHandOpen, setIsHandOpen,
        activeDragId, setActiveDragId,
        activeDragData, setActiveDragData,
        openInspector
    } = useGameUI();

    const {
        gameState,
        error,
        myPlayerState,
        opponentState,
        isMyTurn,
        canPerformAction,
        actions,
        promptChoice,
    } = useGameEngine(initialGameState, { openInspector });

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

        setActiveDragId(null);
        setActiveDragData(null);

        if (!over) return;

        // --- THE ONLY IDENTIFIER WE NEED FROM THE DRAGGED CARD ---
        const draggedCard = active.data.current?.cardData;
        const instanceId = active.data.current?.cardData?.instanceId;
        if (!instanceId) return; // If for some reason there's no ID, do nothing.
        console.log(instanceId)

        const dropZoneId = over.id;

        if (draggedCard?.initiatesUI === 'inspector') {
            const parts = dropZoneId.split('-');
            const owner = parts[0];
            const zone = parts[1];
            const index = parts[2] !== undefined ? parseInt(idx) : null;

            // Find the card that was dropped on from the gameState
            const player = owner === 'my' ? myPlayerState : opponentState;
            const targetCard = zone === 'active' ? player.activeCard : player.bench[index];

            if (targetCard) {
                openInspector(targetCard);
            }
            // We do NOT send an action to the backend yet. The UI takes over.
            return;
        }

        // --- Handle dropping based on the game phase and drop zone ID ---
        if (active.data.current?.cardData?.cardType === 'Item') {
            const parts = dropZoneId.split('-');
            const owner = parts[0];
            const zone = parts[1];
            const idx = parts[2];

            const target = {
                playerId: owner === 'my' ? myPlayerState.socketId : opponentState.socketId,
                zone: zone,
                index: idx !== undefined ? parseInt(idx) : null,
            };

            // Call the correct action for items.
            actions.playItemCard(instanceId, target);
            return; // Action sent, stop processing.
        }

        // --- CHECK 2: Was something dropped on the active slot during setup? ---
        if (gameState.phase === 'setup' && dropZoneId === 'my-active') {
            actions.setInitialActive(instanceId);
            return;
        }

        // --- CHECK 3: Was a PLAYER card dropped on a bench slot? ---
        if (gameState.phase === 'main_phase' && dropZoneId.startsWith('my-bench-')) {
            const benchIndex = parseInt(dropZoneId.split('-')[2]);
            actions.playCardToBench(instanceId, benchIndex);
            return;
        }

        // --- CHECK 4: Was a SUPPORT card dropped on the support slot? ---
        if (gameState.phase === 'main_phase' && dropZoneId === 'my-support') {
            actions.playSupportCard(instanceId);
            return;
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

    // --- PromptChoice Integration ---
    // If promptChoice is active, set up targeting system
    useEffect(() => {
        if (!promptChoice) return;
        const targets = promptChoice.validTargets || promptChoice.options;

        // Only handle target selection prompts (not generic options)
        if (promptChoice.choiceType === 'target' && Array.isArray(targets)) {
            setTargeting({
                isTargeting: true,
                action: promptChoice, // The entire prompt object
                validTargets: targets,   // Use the corrected list of targets
                chosenTargets: [],
                cancelable: true
            });
        } else {
            // This handles cases where a prompt is not for targeting
            setTargeting({ isTargeting: false });
        }
    }, [promptChoice, setTargeting]);

    // --- Debugging: Log targeting state ---
    useEffect(() => {
        console.log('Targeting State:', targeting);
    }, [targeting]);


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
                        promptChoice={promptChoice}
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
                    promptChoice={promptChoice}
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
        promptChoice,
        ...rest
    } = useGameEngine(initialGameState);

    return (
        <GameUIProvider actions={actions} myPlayerState={myPlayerState} opponentState={opponentState} promptChoice={promptChoice}>
            <GamePageContent initialGameState={initialGameState} />
        </GameUIProvider>
    );
};

export default GamePage;
