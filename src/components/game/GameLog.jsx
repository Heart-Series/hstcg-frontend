// src/components/game/GameLog.jsx
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

const GameLog = ({ logs, players }) => {
  const { user } = useAuth(); // Get the currently logged-in user
  const logEndRef = useRef(null); // Ref to auto-scroll to the bottom

  // Auto-scroll to the bottom whenever logs change
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  let lastTurn = null;

  return (
    <div className="text-sm space-y-2">
      {logs.map((log, index) => {
        const isVisible = log.level === 'public' ||
          (log.level === 'private' && log.metadata?.actingPlayerId === user.userId);

        if (!isVisible) {
          return null;
        }

        // --- Turn Header Logic ---
        const turnNumber = log.metadata?.turn;
        let turnHeader = null;
        if (turnNumber && turnNumber !== lastTurn) {
          const turnPlayer = Object.values(players).find(p => p.socketId === log.metadata.activePlayerId);
          const playerName = turnPlayer ? turnPlayer.username : 'A player';
          turnHeader = (
            <div className="pt-2 mt-2 border-t border-gray-700">
              <h4 className="font-semibold text-gray-400">
                Turn {turnNumber} - {playerName}'s Turn
              </h4>
            </div>
          );
          lastTurn = turnNumber;
        }

        // --- Styling for Private Logs ---
        const logStyle = log.level === 'private' ? 'italic text-gray-500' : 'text-gray-200';

        return (
          <React.Fragment key={index}>
            {turnHeader}
            <p className={logStyle}>
              - {log.message}
            </p>
          </React.Fragment>
        );
      })}
      {/* An invisible element at the end of the list to scroll to */}
      <div ref={logEndRef} />
    </div>
  );
};

export default GameLog;