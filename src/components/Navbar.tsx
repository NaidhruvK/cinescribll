import { Check, Copy, Film, HelpCircle, LogOut, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

interface NavbarProps {
  roomCode?: string;
  isConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHowToPlay: () => void;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  isConnected,
  isMuted,
  onToggleMute,
  onOpenHowToPlay,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header
      id="cinescribbl-navbar"
      className="w-full bg-[#16141c]/90 border-b border-red-950/60 backdrop-blur-md px-4 py-2.5 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/30 ring-1 ring-red-500/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Fredoka',sans-serif] font-bold text-2xl tracking-tight text-white">
                Cine<span className="text-red-500">Scribbl</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/50 rounded-full">
                Telugu Cinema
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-gray-400 font-medium -mt-0.5">
              Draw the Movie. Guess the Movie.
            </p>
          </div>
        </div>

        {/* Room Code Badge (if in room) */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-[#221d2b] border border-red-900/40 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-xs text-gray-400 uppercase font-semibold hidden sm:inline">
              Room:
            </span>
            <span className="font-mono font-bold text-base text-red-400 tracking-wider">
              {roomCode}
            </span>
            <button
              id="btn-copy-room-code"
              onClick={copyRoomCode}
              className="p-1 text-gray-400 hover:text-white bg-black/30 hover:bg-red-900/40 rounded-lg transition-colors"
              title="Copy Room Code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f1b26] border border-gray-800 text-xs font-medium"
            title={isConnected ? 'Connected to live game server' : 'Disconnected'}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
                <span className="text-gray-300 text-[11px] hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <WifiOff className="w-3.5 h-3.5 text-red-400 hidden sm:inline" />
                <span className="text-red-300 text-[11px] hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200'
                : 'bg-red-950/40 border-red-800/40 text-red-400 hover:bg-red-900/50'
            }`}
            title={isMuted ? 'Unmute Game Sounds' : 'Mute Sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* How to play button */}
          <button
            id="btn-how-to-play"
            onClick={onOpenHowToPlay}
            className="p-2 rounded-xl bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Leave Room Button */}
          {roomCode && onLeaveRoom && (
            <button
              id="btn-leave-room"
              onClick={onLeaveRoom}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
