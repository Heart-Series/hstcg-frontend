// src/components/game/GameBoard.jsx
import React from 'react';
import PlayerArea from './PlayerArea';
import DeckPile from './DeckPile';
import InspectorPanel from './InspectorPanel';
import { useGame } from '../../context/GameContext';
import SpectatorCount from './SpectatorCount';

const GameBoard = ({ myPlayerState, opponentState, isMyTurn, actions, gameState, activeDragData, promptChoice, isSpectator = false }) => {
    const { selectedCard, onCardClick, onActionClick, targeting, cancelAllActions, resolutionState, setResolutionState } = useGame();
    const spectatorCount = gameState?.spectators?.length ?? 0;

    // --- Highlight valid targets if promptChoice is active ---
    const getTargetingForPrompt = () => {
        if (targeting.isTargeting && targeting.action && Array.isArray(targeting.validTargets)) {
            return targeting.validTargets;
        }
        return [];
    };
    const validTargets = getTargetingForPrompt();

    const handleTurnButtonClick = (e) => {
        // Stop the click from bubbling up and cancelling actions
        e.stopPropagation();

        // Decide which action to call based on the phase
        if (resolutionState.isActive) {
            actions.resolvePhase();
        } else {
            actions.endTurn();
        }
    };

    const getTurnText = () => {
        // Highest priority: Setup Phase
        if (gameState.phase === 'setup') {
            return "Setup Phase";
        }

        // Next: Spectator View
        if (isSpectator) {
            const activePlayer = Object.values(gameState.players).find(p => p.socketId === gameState.activePlayerId);
            return activePlayer ? `${activePlayer.username}'s Turn` : "Loading...";
        }

        // Default: Player View
        return isMyTurn ? "Your Turn" : "Opponent's Turn";
    };

    // Pass validTargets to PlayerArea for contextual highlighting
    return (
        <div className="flex-grow flex flex-col justify-center items-center gap-2 h-full py-2 relative" onClick={cancelAllActions}>
            <InspectorPanel />
            {/* --- Turn Indicator: Always Top Left --- */}
            <div
                className="absolute top-4 left-4 z-30 bg-slate-800 bg-opacity-80 rounded-lg shadow-lg p-3 flex flex-col gap-2"
                style={{ pointerEvents: 'auto' }} // Ensure buttons inside are clickable
            >
                <div className="flex flex-col gap-1">
                    <h2 className="text-md font-bold uppercase tracking-widest text-white">
                        {getTurnText()}
                    </h2>
                    <div className="text-sm text-gray-200 font-mono flex items-center gap-4">
                        <span>Turn {gameState.turn}</span>
                        <SpectatorCount count={spectatorCount} />
                    </div>
                </div>

                {isMyTurn && (
                    <div className="mt-2 w-full">
                        <button
                            className="w-full px-4 py-2 bg-red-800 text-white font-bold rounded-md shadow-md hover:bg-red-700 transition-colors duration-200"
                            onClick={handleTurnButtonClick}
                        >
                            {resolutionState.isActive ? 'Finish Turn' : 'End Turn'}
                        </button>
                    </div>
                )}
            </div>


            {/* Opponent's Area (rendered in reverse) */}
            <div className="flex-1 flex items-end justify-center w-full">
                <PlayerArea playerState={opponentState} isOpponent={true} actions={actions} gameState={gameState} activeDragData={activeDragData} promptChoice={promptChoice} validTargets={validTargets} isSpectator={isSpectator} />
            </div>

            {/* A simple divider for the middle of the board */}
            <div className="w-full h-0.5 bg-gray-600 rounded-full my-1"></div>

            {/* My Area */}
            <div className="flex-1 flex items-start justify-center w-full">
                <PlayerArea playerState={myPlayerState} isOpponent={false} actions={actions} gameState={gameState} activeDragData={activeDragData} promptChoice={promptChoice} validTargets={validTargets} isSpectator={isSpectator} />
            </div>
        </div>
    );
};

export default GameBoard;