// src/pages/GamePage.jsx

import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';

import { useLocation } from 'react-router-dom';

// Import all the "dumb" UI components
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/Card';
import CardPileViewer from '../components/game/CardPileViewer';
import PromptDisplay from '../components/game/PromptDisplay';
import CoinFlipAnimation from '../components/game/CoinFlipAnimation';
import { useTexture } from '@react-three/drei';
import { GameProvider, useGame } from '../context/GameContext';
// import GameLog from '../components/game/GameLog';
// import GameOverScreen from '../components/game/GameOverScreen'; // For the future

const GamePageContent = ({ }) => {

    useEffect(() => {
        // This tells Three.js to start downloading these textures in the background.
        // The empty dependency array [] means this effect runs only once when the component mounts.
        useTexture.preload('/images/heads.png');
        useTexture.preload('/images/tails.png');
    }, []);

    const {
        gameState, myPlayerState, opponentState, isSpectator,
        actions, promptChoice, isMyTurn, canPerformAction,
        animation, hideAnimation,
        viewingCardPile, openCardPileViewer, closeCardPileViewer,
        promptMessage,
        activeDragId, activeDragData,
        isHandOpen, setIsHandOpen,
        handleDragStart, handleDragEnd,
        targeting, setTargeting, openInspector
    } = useGame();    

    const handleAnimationComplete = () => {
        // This is called by the animation component when it's done.
        hideAnimation(null); // Hide the animation component

        // Now, we call back to the server to continue the action.
        if (promptChoice) {
            actions.resolveAbilityStep(
                promptChoice.choosingState.sourceInstanceId,
                promptChoice.choosingState.initialTargetId,
                promptChoice.phase,
                promptChoice.choosingState
            );
        }
    };

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

        // Case 1 : Play Animation 
        // if (promptChoice.uiAction === 'PLAY_ANIMATION' && promptChoice.animation?.type === 'COIN_FLIP') {
        //     setAnimation(promptChoice.animation); // Activate the animation
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

    useEffect(() => {
        if (promptChoice?.uiAction === 'WAIT_FOR_ANIMATION') {
            console.log("Game is paused, waiting for animation to complete...");
            const animationDuration = 3500;

            const timer = setTimeout(() => {
                console.log("Animation time is up. Resolving prompt.");
                actions.resolveAbilityStep(
                    promptChoice.choosingState.sourceInstanceId,
                    promptChoice.choosingState.initialTargetId,
                    promptChoice.phase,
                    promptChoice.choosingState
                );
            }, animationDuration);

            return () => clearTimeout(timer);
        }
    }, [promptChoice, actions]);


    // --- Debugging: Log targeting state ---
    useEffect(() => {
        console.log('Targeting State:', targeting);
    }, [targeting]);

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
            disabled={isSpectator}
        >
            <div className="h-[calc(100vh-5rem)] overflow-hidden bg-gray-800 text-white flex flex-col">


                {viewingCardPile && (
                    <CardPileViewer
                        title={viewingCardPile.title}
                        cards={viewingCardPile.cards}
                        onClose={closeCardPileViewer}
                    />
                )}

                {animation?.type === 'COIN_FLIP' && (
                    <CoinFlipAnimation
                        result={animation.result}
                        onAnimationEnd={handleAnimationComplete}
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
                        isSpectator={isSpectator}
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
                    isSpectator={isSpectator}
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
    const initialIsSpectator = location.state?.isSpectator || false;

     return (
        <GameProvider initialGameState={initialGameState} isSpectator={initialIsSpectator}>
            <GamePageContent />
        </GameProvider>
    );
};

export default GamePage;
