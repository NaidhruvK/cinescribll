import { CheckCircle2, Film, Sparkles, Trophy } from 'lucide-react';
import React from 'react';
import { getAvatar } from '../constants/avatars';
import { GameState, Player } from '../types';

interface RoundEndOverlayProps {
  gameState: GameState;
  currentPlayer: Player;
}

export const RoundEndOverlay: React.FC<RoundEndOverlayProps> = ({
  gameState,
  currentPlayer,
}) => {
  if (gameState.status !== 'ROUND_END') return null;

  const movie = gameState.revealedMovie || 'Telugu Movie';
  const players = gameState.players;

  // Filter players who scored this turn
  const scoringPlayers = players.filter((p) => p.roundScore > 0);

  const isLastTurn = gameState.isLastTurnOfRound;
  const isFinalRound = gameState.round >= gameState.totalRounds;

  return (
    <div
      id="modal-round-end"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#281622] via-[#1c1424] to-[#120e18] border-2 border-red-600/80 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center overflow-hidden">
        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          {isLastTurn ? (
            isFinalRound ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Final Round Completed</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Round {gameState.round} Completed</span>
              </>
            )
          ) : (
            <>
              <Film className="w-3.5 h-3.5 text-red-400" />
              <span>Turn Ended</span>
            </>
          )}
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
          The Secret Telugu Movie Was
        </h3>

        {/* Revealed Movie Title */}
        <div className="my-2 p-4 w-full rounded-2xl bg-[#120d1a] border border-red-900/60 shadow-inner">
          <h2 className="font-['Fredoka',sans-serif] font-black text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-400 tracking-wide">
            {movie}
          </h2>
        </div>

        {/* Scores summary */}
        <div className="w-full my-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">
            <span>Turn Points Earned</span>
            <span>+Score</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {scoringPlayers.length === 0 ? (
              <div className="py-3 text-xs text-gray-400 italic">
                Nobody guessed in time! No points awarded this turn.
              </div>
            ) : (
              scoringPlayers.map((player) => {
                const avatar = getAvatar(player.avatar);
                const isMe = player.id === currentPlayer.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      isMe
                        ? 'bg-red-950/40 border-red-800/60'
                        : 'bg-[#140f1c] border-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{avatar.emoji}</span>
                      <span className="font-bold text-white">
                        {player.nickname} {player.isArtist ? '(Artist)' : ''}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      +{player.roundScore} pts
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-xs text-amber-300 font-semibold animate-pulse flex items-center justify-center gap-1.5 mt-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {isLastTurn ? (
            isFinalRound ? (
              <span>Match finished! Tallying final champion podium...</span>
            ) : (
              <span>
                Round {gameState.round} completed! Round {gameState.round + 1} of {gameState.totalRounds} starts next...
              </span>
            )
          ) : gameState.nextArtistName ? (
            <span>
              Next up: <span className="text-white font-bold">{gameState.nextArtistName}</span> will choose a movie...
            </span>
          ) : (
            <span>Next turn starting in a few seconds...</span>
          )}
        </div>
      </div>
    </div>
  );
};
