// src/pages/GamePage.jsx

import React, { useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';

import { useLocation, useNavigate } from 'react-router-dom';

// Import all the "dumb" UI components
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/Card';
import CardPileViewer from '../components/game/CardPileViewer';
import PromptDisplay from '../components/game/PromptDisplay';
import CoinFlipAnimation from '../components/game/CoinFlipAnimation';
import { useTexture } from '@react-three/drei';
import { GameProvider, useGame } from '../context/GameContext';
import GameOverScreen from '../components/game/GameOverScreen';
// import GameOverScreen from '../components/game/GameOverScreen'; // For the future

const GamePageContent = () => {

    useEffect(() => {
        // This tells Three.js to start downloading these textures in the background.
        // The empty dependency array [] means this effect runs only once when the component mounts.
        useTexture.preload('/images/heads.png');
        useTexture.preload('/images/tails.png');
    }, []);

    const {
        gameState, gameOverData, myPlayerState, opponentState, isSpectator,
        actions, promptChoice, isMyTurn, canPerformAction,
        animation, hideAnimation,
        viewingCardPile, openCardPileViewer, closeCardPileViewer,
        promptMessage,
        activeDragId, activeDragData,
        isHandOpen, setIsHandOpen,
        handleDragStart, handleDragEnd,
        targeting, setTargeting, openInspector
    } = useGame();
    const navigate = useNavigate();

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

    // --- Debugging: Log targeting state ---
    useEffect(() => {
        console.log('Targeting State:', targeting);
    }, [targeting]);

    // Show a loading/error state if something is wrong
    if (!gameState || !myPlayerState || !opponentState) {
        return <div>Loading Game...</div>; // Or a more robust loading screen
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            disabled={isSpectator}
        >
            <div className="h-[calc(100vh-5rem)] overflow-hidden bg-gray-800 text-white flex flex-col">

                {gameOverData && (
                    <GameOverScreen
                        gameOverData={gameOverData}
                        onReturn={() => navigate('/lobbies')}
                        isSpectator={isSpectator}
                    />
                )}

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
                        desiredOutcome={animation.desiredOutcome}
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
