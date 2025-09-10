// src/components/game/GameBoard.jsx
import React from 'react';
import PlayerArea from './PlayerArea';
import DeckPile from './DeckPile';
import { useGameUI } from '../../context/GameUIContext';
import InspectorPanel from './InspectorPanel';

const GameBoard = ({ myPlayerState, opponentState, isMyTurn, actions, gameState, activeDragData, promptChoice }) => {
    const { selectedCard, onCardClick, onActionClick, targeting, cancelAllActions, resolutionState, setResolutionState } = useGameUI();

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

    // Pass validTargets to PlayerArea for contextual highlighting
    return (
        <div className="flex-grow flex flex-col justify-center items-center gap-2 h-full py-2 relative" onClick={cancelAllActions}>
            <InspectorPanel />
            {/* --- Turn Indicator: Always Top Left --- */}
            <div
                className="absolute top-4 left-4 z-30 bg-slate-700 bg-opacity-90 rounded-lg shadow-lg px-4 py-2 flex flex-col items-start"
                style={{
                    maxWidth: '180px',
                    minWidth: '120px',
                    wordBreak: 'break-word',
                }}
            >
                <h2 className="text-md font-bold uppercase tracking-widest text-white mb-1">
                    {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                </h2>
                <p className="text-sm text-whitet-100 -mono">
                    Turn {gameState.turn}
                </p>
                {isMyTurn && (
                    <button
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-all duration-300 z-40"
                        onClick={handleTurnButtonClick}
                    >
                        {resolutionState.isActive ? 'Finish Turn' : 'End Turn'}
                    </button>
                )}
            </div>

            {/* Opponent's Area (rendered in reverse) */}
            <div className="flex-1 flex items-end justify-center w-full">
                <PlayerArea playerState={opponentState} isOpponent={true} actions={actions} gameState={gameState} activeDragData={activeDragData} promptChoice={promptChoice} validTargets={validTargets} />
            </div>

            {/* A simple divider for the middle of the board */}
            <div className="w-full h-0.5 bg-gray-600 rounded-full my-1"></div>

            {/* My Area */}
            <div className="flex-1 flex items-start justify-center w-full">
                <PlayerArea playerState={myPlayerState} isOpponent={false} actions={actions} gameState={gameState} activeDragData={activeDragData} promptChoice={promptChoice} validTargets={validTargets} />
            </div>
        </div>
    );
};

export default GameBoard;