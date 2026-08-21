import { Clock, Film, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MovieChoiceModalProps {
  isOpen: boolean;
  choices: string[];
  onSelectMovie: (movie: string) => void;
}

export const MovieChoiceModal: React.FC<MovieChoiceModalProps> = ({
  isOpen,
  choices,
  onSelectMovie,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(15);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(15);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || choices.length === 0) return null;

  return (
    <div
      id="modal-movie-choice"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#251722] via-[#1b1422] to-[#14101a] border-2 border-red-600/80 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Animated glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Film className="w-3.5 h-3.5" />
          <span>Artist Spotlight</span>
        </div>

        <h2 className="font-['Fredoka',sans-serif] font-bold text-2xl sm:text-3xl text-white mb-2">
          Choose a Telugu Movie to Draw
        </h2>
        <p className="text-xs text-gray-300 mb-6">
          Pick one secret title from the list below. Other players will try to guess it!
        </p>

        {/* 15s Timer indicator */}
        <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[#120e18] border border-red-900/60">
          <Clock className="w-4 h-4 text-red-500 animate-spin" />
          <span className="text-xs font-bold text-gray-300">
            Auto-selecting in <span className="text-red-400 font-mono font-black">{timeLeft}s</span>
          </span>
        </div>

        {/* 3 Movie Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mb-4">
          {choices.map((movie, idx) => (
            <button
              key={movie}
              id={`btn-choose-movie-${idx}`}
              onClick={() => onSelectMovie(movie)}
              className="group relative p-5 rounded-2xl bg-[#191321] hover:bg-gradient-to-b hover:from-red-900/40 hover:to-[#22172a] border border-gray-800 hover:border-red-500 shadow-lg hover:shadow-red-900/30 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-xs font-bold text-red-400/80 uppercase tracking-wider">
                Option {idx + 1}
              </span>
              <span className="font-['Fredoka',sans-serif] font-bold text-lg sm:text-xl text-white group-hover:text-red-300 text-center leading-snug">
                {movie}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold group-hover:text-gray-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Select Movie
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
