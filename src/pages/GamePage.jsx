// src/pages/GamePage.jsx

import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';

import { useLocation } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';
import { GameUIProvider, useGameUI } from '../context/GameUIContext';

// Import all the "dumb" UI components
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/Card';
import CardPileViewer from '../components/game/CardPileViewer';
import PromptDisplay from '../components/game/PromptDisplay';
import { useMemo } from 'react';
// import GameLog from '../components/game/GameLog';
// import GameOverScreen from '../components/game/GameOverScreen'; // For the future

const GamePageContent = ({ initialGameState }) => {

    // UI state from context
    const {
        selectedCard, setSelectedCard,
        targeting, setTargeting,
        isHandOpen, setIsHandOpen,
        activeDragId, setActiveDragId,
        activeDragData, setActiveDragData,
        openInspector,
        viewingCardPile,
        openCardPileViewer, closeCardPileViewer,
        resolutionState, setResolutionState,
        showToast
    } = useGameUI();

    // Initialize the game engine
    const {
        gameState,
        myPlayerState,
        opponentState,
        isMyTurn,
        canPerformAction,
        actions,
        promptChoice,
    } = useGameEngine(initialGameState, { showToast, setResolutionState, openCardPileViewer });

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

        // --- CHECK 3 : Was a Player Card dropped on an EMPTY active slot during the main phase? ---
        if (gameState.phase === 'main_phase' && dropZoneId === 'my-active' && !myPlayerState.activeCard) {
            actions.playCardToActive(instanceId);
            return;
        }

        // --- CHECK 4: Was a PLAYER card dropped on a bench slot? ---
        if (gameState.phase === 'main_phase' && dropZoneId.startsWith('my-bench-')) {
            const benchIndex = parseInt(dropZoneId.split('-')[2]);
            actions.playCardToBench(instanceId, benchIndex);
            return;
        }

        // --- CHECK 5: Was a SUPPORT card dropped on the support slot? ---
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
        if (!promptChoice) {
            // When a prompt is cleared, ensure targeting is also cleared.
            if (targeting.isTargeting) {
                setTargeting(prev => ({ ...prev, isTargeting: false }));
            }
            return;
        }

        // Case 1: Hijack Action
        // if (promptChoice.hijackAction) {
        //     setTargeting({
        //         isTargeting: true,
        //         action: promptChoice.newAction,
        //         hijackState: promptChoice.hijackState,
        //         validTargets: promptChoice.newAction.validTargets || [],
        //     });
        //     return;
        // }

        // Case 2: Open Inspector
        if (promptChoice.uiAction === 'open_inspector' && promptChoice.uiActionTarget) {
            const player = promptChoice.uiActionTarget.playerId === myPlayerState.socketId ? myPlayerState : opponentState;
            const cardToInspect = promptChoice.uiActionTarget.zone === 'active'
                ? player.activeCard
                : player.bench[promptChoice.uiActionTarget.index];
            if (cardToInspect) openInspector(cardToInspect);
        }

        // Case 3: Show a card pile
        if (promptChoice.choiceType === 'card_pile_selection') {
            openCardPileViewer(promptChoice.title, promptChoice.cards);
            setTargeting({ isTargeting: false });
            return;
        }

        // Case 4: Standard board targeting
        if (promptChoice.choiceType === 'target') {
            setTargeting({
                isTargeting: true,
                action: promptChoice,
                validTargets: promptChoice.validTargets || [],
            });
        }

    }, [promptChoice])

    const promptMessage = useMemo(() => {
        if (resolutionState.isActive) {
            return "End-of-Turn Actions";
        }
        // When we enter targeting mode for the copied attack, this will read the title
        if (targeting.isTargeting && targeting.action?.title) {
            return targeting.action.title;
        }
        // This is a fallback for the first step of Revenge
        if (promptChoice?.title) {
            return promptChoice.title;
        }
        return null;
    }, [resolutionState.isActive, targeting, promptChoice]);

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
              

                {viewingCardPile && (
                    <CardPileViewer
                        title={viewingCardPile.title}
                        cards={viewingCardPile.cards}
                        onClose={closeCardPileViewer}
                    />
                )}

                <PromptDisplay message={promptMessage} />

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
