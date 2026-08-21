import { Crown, Paintbrush, Trophy } from 'lucide-react';
import React from 'react';
import { getAvatar } from '../constants/avatars';
import { Player } from '../types';

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerId: string;
  currentArtistId: string | null;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  players,
  currentPlayerId,
  currentArtistId,
}) => {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div
      id="cinescribbl-player-sidebar"
      className="rounded-3xl bg-[#171320] border border-gray-800 p-4 sm:p-5 shadow-xl flex flex-col h-full"
    >
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-['Fredoka',sans-serif] font-bold text-sm text-white">
            Scoreboard
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-semibold">{players.length} Players</span>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {sortedPlayers.map((player, index) => {
          const avatar = getAvatar(player.avatar);
          const isMe = player.id === currentPlayerId;
          const isArtist = player.id === currentArtistId;
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                isMe
                  ? 'bg-red-950/30 border-red-800/60 ring-1 ring-red-500/20'
                  : 'bg-[#120e18] border-gray-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Rank number */}
                <span
                  className={`w-5 text-center text-xs font-black font-mono ${
                    index === 0
                      ? 'text-amber-400'
                      : index === 1
                      ? 'text-gray-300'
                      : index === 2
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`}
                >
                  #{index + 1}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-[#221a2c] border border-gray-700 flex items-center justify-center text-xl relative shadow-inner">
                  {avatar.emoji}
                  {player.isHost && (
                    <div className="absolute -top-1 -right-1 text-[10px]" title="Host">
                      👑
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white truncate max-w-[90px] sm:max-w-[110px]">
                      {player.nickname}
                    </span>
                    {isMe && (
                      <span className="px-1 text-[8px] font-bold uppercase bg-red-900/60 text-red-300 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    {player.score} pts
                  </span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1">
                {isArtist && (
                  <span
                    className="px-2 py-0.5 rounded-lg bg-red-950 border border-red-800 text-red-400 text-[10px] font-bold flex items-center gap-1"
                    title="Currently Drawing"
                  >
                    <Paintbrush className="w-3 h-3 animate-bounce" />
                    <span className="hidden sm:inline">Artist</span>
                  </span>
                )}

                {hasGuessed && !isArtist && (
                  <span
                    className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1"
                    title="Guessed correctly"
                  >
                    <span>✓</span>
                    <span className="hidden sm:inline">Done</span>
                  </span>
                )}

                {!player.connected && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-yellow-950 border border-yellow-800 text-yellow-400 text-[9px] font-bold"
                    title="Disconnected"
                  >
                    Away
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
