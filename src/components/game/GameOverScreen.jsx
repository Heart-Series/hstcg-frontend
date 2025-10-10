// src/components/game/GameOverScreen.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaBookOpen } from 'react-icons/fa';
import GameLog from './GameLog';

const GameOverScreen = ({ gameOverData, onReturn, isSpectator }) => {
  const { user } = useAuth();

  if (!gameOverData) return null;  

  const { winner: winnerId, gameState:  finalState } = gameOverData;
  
  // The winner ID should be a socket ID, so first try to find by socketId
  // If that fails, try by userId as a fallback
  let winnerData = Object.values(finalState.players).find(p => p.socketId === winnerId);
  if (!winnerData) {
    winnerData = Object.values(finalState.players).find(p => p.userId === winnerId);
  }

  const isWinner = winnerData?.userId?.toString() === user?.userId?.toString();

  let bannerText = '';
  let bannerColor = '';

  if (isSpectator) {
    bannerText = `${winnerData?.username || 'Unknown'} Wins!`;
    bannerColor = 'bg-yellow-500';
  } else {
    bannerText = isWinner ? 'VICTORY' : 'DEFEAT';
    bannerColor = isWinner ? 'bg-green-500' : 'bg-red-700';
  }

  const myFinalState = Object.values(finalState.players).find(p => p.userId?.toString() === user?.userId?.toString());
  const opponentFinalState = Object.values(finalState.players).find(p => p.userId?.toString() !== user?.userId?.toString());

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black opacity-60"/>

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-slate-900 rounded-lg shadow-2xl border-2 border-slate-700">
          {/* Banner */}
          <div className={`w-full p-4 rounded-t-lg text-center ${bannerColor}`}>
            <h1 className="text-4xl font-extrabold uppercase tracking-widest text-white text-shadow-lg">{bannerText}</h1>
          </div>

          <div className="flex flex-row">
            {/* Main Content: Game Log */}
            <div className="flex-grow p-4 border-r border-slate-700">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-300"><FaBookOpen /> Final Game Log</h3>
              <div className="h-96 overflow-y-auto bg-slate-800 rounded p-2">
                <GameLog logs={finalState.log || []} players={finalState.players || {}} />
              </div>
            </div>

            {/* Side Content: Summary */}
            <div className="w-64 flex-shrink-0 p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Post-Game Summary</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-400">Total Turns</p>
                  <p className="text-md text-white">{finalState.turn}</p>
                </div>
                <hr className="border-slate-700" />
                {myFinalState && opponentFinalState && !isSpectator && (
                  <>
                    <div>
                      <p className="font-bold text-gray-400">Final Score</p>
                      <p className=""><span className="">{myFinalState.username}: {myFinalState.points}</span> vs <span className="">{opponentFinalState.username}: {opponentFinalState.points}</span></p>
                    </div>
                    <hr className="border-slate-700" />
                    <div>
                      <p className="font-bold text-gray-400">Cards Left in Deck</p>
                      <p><span className="text-gray-300">{myFinalState.username}:</span> {myFinalState.deck.length}</p>
                      <p><span className="text-gray-300">{opponentFinalState.username}:</span> {opponentFinalState.deck.length}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Button */}
          <div className="p-4 border-t border-slate-700 text-center">
            <button
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
              onClick={onReturn}
            >
              Return to Lobbies
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameOverScreen;