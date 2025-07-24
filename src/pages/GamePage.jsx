// src/pages/GamePage.jsx

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';

// Import all the "dumb" UI components
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import { useState } from 'react';
// import GameLog from '../components/game/GameLog';
// import GameOverScreen from '../components/game/GameOverScreen'; // For the future

const GamePage = () => {
    // Get the initial game state passed from the lobby page
    const location = useLocation();
    const initialGameState = location.state?.initialGameState;

    // Initialize the game engine
    const {
        gameState,
        error,
        myPlayerState,
        opponentState,
        isMyTurn,
        actions,
    } = useGameEngine(initialGameState);

    const [isHandOpen, setIsHandOpen] = useState(false);

    // Show a loading/error state if something is wrong
    if (!gameState || !myPlayerState || !opponentState) {
        return <div>Loading Game...</div>; // Or a more robust loading screen
    }

    // Check for a winner to show the game over screen
    if (gameState.winner) {
        return <GameOverScreen winner={gameState.winner} />;
    }

    return (
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
                />
            </div>

            {/* --- Player Hand --- */}
            <PlayerHand
                cards={myPlayerState.hand}
                isMyTurn={isMyTurn}
                onPlayCard={actions.playCard}
                isOpen={isHandOpen}
                setIsOpen={setIsHandOpen}
            />
            {/* You could add the GameLog as an overlay or sidebar */}
            {/* <GameLog log={gameState.log} /> */}
        </div>
    );
};

export default GamePage;