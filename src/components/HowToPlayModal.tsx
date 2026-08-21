import { Award, Clock, Film, HelpCircle, MessageSquare, Paintbrush, X } from 'lucide-react';
import React from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-how-to-play"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1b1524] border border-red-900/60 shadow-2xl p-6 sm:p-8 text-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Fredoka',sans-serif] font-bold text-xl text-white">
                How to Play CineScribbl
              </h2>
              <p className="text-xs text-gray-400">Telugu Movie Drawing & Guessing Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#130f1a] border border-gray-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-red-950/90 border border-red-800 text-red-400 flex items-center justify-center font-bold font-mono shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-red-400" />
                Select Secret Telugu Movie
              </h3>
              <p className="text-gray-300 leading-relaxed">
                When it's your turn as the artist, you'll be offered 3 random Telugu movies from our
                master dataset (e.g., <em>Athadu</em>, <em>Pokiri</em>, <em>Eega</em>). Pick one
                within 15 seconds!
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#130f1a] border border-gray-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-amber-950/90 border border-amber-800 text-amber-400 flex items-center justify-center font-bold font-mono shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                Draw Movie Clues
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Use brushes, colors, and the eraser to illustrate characters, iconic scenes, props,
                or plot twists. <strong>Do NOT write letters or the movie name directly!</strong>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#130f1a] border border-gray-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-purple-950/90 border border-purple-800 text-purple-400 flex items-center justify-center font-bold font-mono shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                Guess Fast in Live Chat
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Type your Telugu movie guesses in the chat box. Case, minor punctuation, and spacing
                differences are automatically normalized by the server. If your guess is very
                close, you'll receive a private hint!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-[#130f1a] border border-gray-800 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">
              4
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Scoring & Hints
              </h3>
              <p className="text-gray-300 leading-relaxed">
                The quicker you guess correctly, the more points you score (up to 550+ pts). As time
                winds down, letters are gradually revealed in the hint bar. The artist also earns
                bonus points when players guess!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
