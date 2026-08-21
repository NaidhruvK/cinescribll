import { Film, Play, Sparkles, Trophy, Users } from 'lucide-react';
import React from 'react';

interface HomeProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onOpenHowToPlay: () => void;
}

const SAMPLE_MOVIES = [
  'Athadu',
  'Pokiri',
  'Baahubali',
  'Eega',
  'Magadheera',
  'Pushpa',
  'Jersey',
  'DJ Tillu',
  'Arjun Reddy',
  'Kalki 2898 AD',
  'Hanu-Man',
  'Saripodhaa Sanivaaram',
  'Jalsa',
  'Bommarillu',
  'Okkadu',
  'Simhadri',
  'Chatrapathi',
  'Race Gurram',
  'Drushyam',
  'Salaar',
];

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  onOpenHowToPlay,
}) => {
  return (
    <div id="cinescribbl-home" className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#24171f] via-[#1a1420] to-[#14101a] border border-red-900/40 p-6 md:p-12 overflow-hidden shadow-2xl shadow-red-950/20 text-center flex flex-col items-center">
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Film className="w-3.5 h-3.5 text-red-400" />
          <span>Multiplayer Telugu Cinema Game</span>
        </div>

        {/* Main Title */}
        <h1 className="font-['Fredoka',sans-serif] font-bold text-4xl sm:text-6xl md:text-7xl tracking-tight text-white mb-3">
          Cine<span className="text-red-500">Scribbl</span>
        </h1>

        {/* Tagline */}
        <p className="font-['Nunito',sans-serif] text-xl sm:text-2xl font-bold text-red-200/90 mb-4">
          "Draw the Movie. Guess the Movie."
        </p>

        {/* Description */}
        <p className="max-w-2xl text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
          The ultimate real-time multiplayer drawing & guessing party game for Tollywood lovers.
          Pick your favorite Telugu movie, draw hints on the canvas, and let your friends battle
          it out in the live chat to guess first!
        </p>

        {/* Primary CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-8">
          <button
            id="btn-home-create-room"
            onClick={onCreateRoom}
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-base shadow-lg shadow-red-700/40 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-red-500/40 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Create Room</span>
          </button>

          <button
            id="btn-home-join-room"
            onClick={onJoinRoom}
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-[#282133] hover:bg-[#342b43] text-gray-100 font-bold text-base border border-gray-700/60 hover:border-red-500/50 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-5 h-5 text-red-400" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Secondary link */}
        <button
          id="btn-home-rules"
          onClick={onOpenHowToPlay}
          className="text-xs font-semibold text-gray-400 hover:text-red-400 underline underline-offset-4 transition-colors"
        >
          📖 Learn How to Play & Game Rules
        </button>
      </div>

      {/* Visual Game Preview Mockup */}
      <div className="rounded-3xl bg-[#17141f] border border-gray-800/80 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
            <h2 className="font-['Fredoka',sans-serif] font-bold text-xl text-white">
              Live Game Preview
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span>Secret Word Hint:</span>
            <span className="px-3 py-1 bg-[#231b2d] border border-red-900/40 rounded-lg text-red-400 font-bold tracking-widest text-sm">
              E _ G A
            </span>
          </div>
        </div>

        {/* Mockup Canvas & Chat split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mock Canvas */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-4 h-64 sm:h-80 flex flex-col justify-between relative overflow-hidden shadow-inner border-4 border-[#2c2438]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
              <span>🎨 Artist: Rahul (drawing...)</span>
              <span className="font-mono text-red-600 font-bold">⏱️ 48s</span>
            </div>

            {/* Mock Drawing Graphic */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl sm:text-7xl mb-2 animate-bounce">🪰 💥 👓</div>
                <p className="text-xs text-gray-400 italic">"Revenge of the housefly..."</p>
              </div>
            </div>

            {/* Mock Tools Bar */}
            <div className="flex items-center justify-between bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 border border-gray-300"></span>
                <span className="w-4 h-4 rounded-full bg-yellow-500 border border-gray-300"></span>
                <span className="w-4 h-4 rounded-full bg-black border border-gray-300"></span>
                <span className="text-gray-600 text-[11px] font-medium ml-1">🖌️ 8px Brush</span>
              </div>
              <span className="text-gray-500 font-mono text-[11px]">CineScribbl Canvas</span>
            </div>
          </div>

          {/* Mock Chat / Guess Stream */}
          <div className="rounded-2xl bg-[#1d1827] border border-gray-800 p-4 flex flex-col justify-between h-64 sm:h-80">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Chat / Guesses</span>
              <span className="text-emerald-400">● 4 Players</span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="p-2 rounded-lg bg-[#251e33] text-gray-300">
                <span className="font-bold text-amber-400">Ananya:</span> Magadheera?
              </div>
              <div className="p-2 rounded-lg bg-[#251e33] text-gray-300">
                <span className="font-bold text-blue-400">Karthik:</span> Housefly?
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-bold flex items-center gap-1.5 animate-pulse">
                <span>🎉</span>
                <span>Naidhruv guessed the movie! (+450 pts)</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Type your Telugu movie guess..."
                className="w-full bg-[#13101c] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured 3-Pillar Value Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#1b1624] border border-gray-800/80 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 mb-1">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-white">
            2 to 12 Players
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Create custom private lobbies for your friends or family. Real-time WebSockets keep all
            drawing strokes synchronized with zero lag.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#1b1624] border border-gray-800/80 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-white">
            200+ Telugu Movies
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            From vintage blockbusters like Pokiri and Athadu to contemporary pan-India hits like
            Kalki 2898 AD, Salaar, and Pushpa.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#1b1624] border border-gray-800/80 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-1">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-white">
            Speed-Based Scoring
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The faster you guess the movie, the higher your score. Progressive letter hints reveal
            as the countdown timer ticks down!
          </p>
        </div>
      </div>

      {/* Curated Movies Ticker */}
      <div className="rounded-2xl bg-[#16121f] border border-gray-800/60 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-red-500" />
          Featured Telugu Movies in CineScribbl
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_MOVIES.map((movie) => (
            <span
              key={movie}
              className="px-3 py-1 rounded-lg bg-[#221c2d] border border-gray-800 text-xs font-semibold text-gray-300 hover:text-red-400 hover:border-red-900/60 transition-colors"
            >
              🎬 {movie}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
