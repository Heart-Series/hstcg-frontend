// src/components/game/GameBoard.jsx
import React from 'react';
import PlayerArea from './PlayerArea';
import DeckPile from './DeckPile';

const GameBoard = ({ myPlayerState, opponentState, isMyTurn, actions }) => {
    return (
        <div className="flex-grow flex flex-col justify-center items-center gap-2 h-full py-2">
            {/* Opponent's Area (rendered in reverse) */}
            <div className="flex-1 flex items-end justify-center w-full">
                <PlayerArea playerState={opponentState} isOpponent={true} actions={actions} />
            </div>

            {/* A simple divider for the middle of the board */}
            <div className="w-full h-0.5 bg-gray-600 rounded-full my-1"></div>

            {/* My Area */}
            <div className="flex-1 flex items-start justify-center w-full">
                <PlayerArea playerState={myPlayerState} isOpponent={false} actions={actions} />
            </div>
        </div>
    );
};

export default GameBoard;