import confetti from 'canvas-confetti';
import { Award, Crown, Home, Play, RotateCcw, Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { getAvatar } from '../constants/avatars';
import { GameState, Player } from '../types';

interface GameOverModalProps {
  gameState: GameState;
  currentPlayer: Player;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  currentPlayer,
  onPlayAgain,
  onLeaveRoom,
}) => {
  if (gameState.status !== 'GAME_OVER') return null;

  // Fire confetti cannon on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e50914', '#f59e0b', '#10b981', '#ffffff', '#ffd700'],
      });
      const interval = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);

      return () => clearTimeout(interval);
    } catch (e) {
      // ignore
    }
  }, []);

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isHost = currentPlayer.isHost;

  return (
    <div
      id="modal-game-over"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#2a1422] via-[#1b1222] to-[#120d18] border-2 border-red-500/80 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Match Concluded</span>
        </div>

        <h1 className="font-['Fredoka',sans-serif] font-black text-3xl sm:text-4xl text-white mb-2">
          🏆 Tollywood Box Office Champion!
        </h1>

        {/* Winner Highlight Card */}
        {winner && (
          <div className="w-full my-4 p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#261528] to-red-950/80 border border-amber-500/50 shadow-xl flex items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#1b1122] border-2 border-amber-400 flex items-center justify-center text-4xl shadow-md">
                {getAvatar(winner.avatar).emoji}
              </div>
              <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-black rounded-full p-1 shadow-md">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <div className="text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1st Place Megastar
              </div>
              <div className="font-['Fredoka',sans-serif] font-bold text-xl sm:text-2xl text-white">
                {winner.nickname}
              </div>
              <div className="text-sm font-mono font-black text-emerald-400">
                {winner.score} Total Points
              </div>
            </div>
          </div>
        )}

        {/* Complete Scoreboard */}
        <div className="w-full my-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">
            Final Standings
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, idx) => {
              const avatar = getAvatar(player.avatar);
              const isMe = player.id === currentPlayer.id;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    idx === 0
                      ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                      : isMe
                      ? 'bg-red-950/30 border-red-800/60 text-white'
                      : 'bg-[#140e1b] border-gray-800/80 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black w-4 text-center">#{idx + 1}</span>
                    <span className="text-base">{avatar.emoji}</span>
                    <span className="font-bold">
                      {player.nickname} {isMe ? '(You)' : ''}
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm">{player.score} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
          {isHost ? (
            <button
              id="btn-game-play-again"
              onClick={onPlayAgain}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-700/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="flex-1 py-3.5 rounded-2xl bg-[#1d1526] border border-gray-800 text-gray-400 text-xs font-semibold flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Waiting for Host to Restart...</span>
            </div>
          )}

          <button
            id="btn-game-leave"
            onClick={onLeaveRoom}
            className="sm:w-1/3 py-3.5 rounded-2xl bg-[#221a2c] hover:bg-[#2e233b] border border-gray-700 text-gray-200 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
