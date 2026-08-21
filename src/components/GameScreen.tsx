import { Clock, Film, Sparkles } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getAvatar } from '../constants/avatars';
import {
  CanvasAction,
  ChatMessage,
  DrawFill,
  DrawStroke,
  DrawStrokeEnd,
  DrawStrokeMove,
  DrawStrokeStart,
  GameState,
  Player,
} from '../types';
import { ChatPanel } from './ChatPanel';
import { DrawingCanvas } from './DrawingCanvas';
import { GameOverModal } from './GameOverModal';
import { MovieChoiceModal } from './MovieChoiceModal';
import { PlayerSidebar } from './PlayerSidebar';
import { RoundEndOverlay } from './RoundEndOverlay';

interface GameScreenProps {
  gameState: GameState;
  currentPlayer: Player;
  chatMessages: ChatMessage[];
  movieChoices: string[];
  canvasActions: CanvasAction[];
  lastNotification: { text: string; type: 'correct' | 'close' | 'system'; timestamp: number } | null;
  socket?: Socket | null;
  onSelectMovie: (movie: string) => void;
  onSendStrokeStart?: (data: DrawStrokeStart) => void;
  onSendStrokeMove?: (data: DrawStrokeMove) => void;
  onSendStrokeEnd?: (data: DrawStrokeEnd) => void;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onUndoStroke: () => void;
  onSendGuess: (guess: string) => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
  // Audio hooks
  playCorrectSound: () => void;
  playCloseSound: () => void;
  playTurnStartSound: () => void;
  playTickSound: () => void;
  playGameOverSound: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  currentPlayer,
  chatMessages,
  movieChoices,
  canvasActions,
  lastNotification,
  socket,
  onSelectMovie,
  onSendStrokeStart,
  onSendStrokeMove,
  onSendStrokeEnd,
  onSendStroke,
  onClearCanvas,
  onUndoStroke,
  onSendGuess,
  onPlayAgain,
  onLeaveRoom,
  playCorrectSound,
  playCloseSound,
  playTurnStartSound,
  playTickSound,
  playGameOverSound,
}) => {
  const isArtist = gameState.currentArtistId === currentPlayer.id;
  const hasGuessed = currentPlayer.hasGuessed;
  const prevStatusRef = useRef(gameState.status);
  const prevTimeRef = useRef(gameState.remainingTime);

  // Audio triggers based on state changes
  useEffect(() => {
    if (prevStatusRef.current !== gameState.status) {
      if (gameState.status === 'DRAWING' || gameState.status === 'CHOOSING_MOVIE') {
        playTurnStartSound();
      } else if (gameState.status === 'GAME_OVER') {
        playGameOverSound();
      }
      prevStatusRef.current = gameState.status;
    }
  }, [gameState.status, playTurnStartSound, playGameOverSound]);

  // Audio triggers for last notification
  useEffect(() => {
    if (lastNotification) {
      if (lastNotification.type === 'correct') {
        playCorrectSound();
      } else if (lastNotification.type === 'close') {
        playCloseSound();
      }
    }
  }, [lastNotification, playCorrectSound, playCloseSound]);

  // Audio tick sound when <= 10s
  useEffect(() => {
    if (
      gameState.status === 'DRAWING' &&
      gameState.remainingTime <= 10 &&
      gameState.remainingTime > 0 &&
      gameState.remainingTime !== prevTimeRef.current
    ) {
      playTickSound();
      prevTimeRef.current = gameState.remainingTime;
    }
  }, [gameState.remainingTime, gameState.status, playTickSound]);

  const artistAvatar = getAvatar(gameState.currentArtistAvatar || undefined);

  // Split hint into spaced words for beautiful rendering
  const renderHint = () => {
    if (isArtist && gameState.hint) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">
            Secret Movie:
          </span>
          <span className="font-['Fredoka',sans-serif] font-bold text-lg sm:text-2xl text-amber-300 tracking-wider">
            {gameState.hint}
          </span>
        </div>
      );
    }

    if (!gameState.hint) {
      return <span className="text-gray-400 text-xs italic">Waiting for artist to choose...</span>;
    }

    const words = gameState.hint.split(' ');
    return (
      <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-5">
        {words.map((word, wIdx) => (
          <div key={wIdx} className="flex items-center gap-1.5 sm:gap-2">
            {word.split('').map((char, cIdx) => (
              <span
                key={cIdx}
                className={`w-5 h-7 sm:w-7 sm:h-9 flex items-center justify-center rounded-lg font-mono font-black text-sm sm:text-lg uppercase transition-all ${
                  char !== '_'
                    ? 'bg-red-950/80 border border-red-500 text-red-300 shadow-sm animate-pop'
                    : 'bg-[#140e1b] border border-gray-800 text-gray-400'
                }`}
              >
                {char !== '_' ? char : ''}
              </span>
            ))}
            <span className="text-[10px] text-gray-400 font-mono self-end -mb-1">
              ({word.length})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="cinescribbl-game-screen" className="max-w-7xl mx-auto px-2 sm:px-4 py-4 flex flex-col gap-4">
      {/* Top Header Stats Bar */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#171321] border border-red-950/60 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Round Counter */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#110e18] border border-gray-800 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-gray-300">
              Round{' '}
              <span className="text-white font-mono font-black">
                {gameState.round}/{gameState.totalRounds}
              </span>
            </span>
          </div>

          {/* Current Artist Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#110e18] border border-gray-800 text-xs">
            <span>{artistAvatar.emoji}</span>
            <span className="text-gray-400">Artist:</span>
            <span className="font-bold text-white">
              {isArtist ? 'You' : gameState.currentArtistName || 'Choosing...'}
            </span>
          </div>
        </div>

        {/* Secret Word Hint in Center */}
        <div className="flex-1 flex justify-center px-2">{renderHint()}</div>

        {/* Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base border shadow-inner transition-colors ${
            gameState.remainingTime <= 10
              ? 'bg-red-950/90 border-red-500 text-red-400 animate-pulse'
              : gameState.remainingTime <= 25
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-[#120e18] border-gray-800 text-gray-200'
          }`}
        >
          <Clock
            className={`w-4 h-4 ${
              gameState.remainingTime <= 10 ? 'text-red-500 animate-spin' : 'text-gray-400'
            }`}
          />
          <span>{gameState.remainingTime}s</span>
        </div>
      </div>

      {/* Main 3-Column Layout (Desktop) / Vertical Stack (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Player Sidebar (3 cols on desktop) */}
        <div className="hidden lg:block lg:col-span-3 h-[600px]">
          <PlayerSidebar
            players={gameState.players}
            currentPlayerId={currentPlayer.id}
            currentArtistId={gameState.currentArtistId}
          />
        </div>

        {/* Center: Drawing Canvas (6 cols on desktop) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <DrawingCanvas
            isArtist={isArtist && gameState.status === 'DRAWING'}
            canvasActions={canvasActions}
            socket={socket}
            onSendStrokeStart={onSendStrokeStart}
            onSendStrokeMove={onSendStrokeMove}
            onSendStrokeEnd={onSendStrokeEnd}
            onSendStroke={onSendStroke}
            onClearCanvas={onClearCanvas}
            onUndoStroke={onUndoStroke}
          />

          {/* Mobile Player Score summary (collapsible or horizontal) */}
          <div className="lg:hidden block">
            <PlayerSidebar
              players={gameState.players}
              currentPlayerId={currentPlayer.id}
              currentArtistId={gameState.currentArtistId}
            />
          </div>
        </div>

        {/* Right: Real-time Chat & Guessing (3 cols on desktop) */}
        <div className="lg:col-span-3 h-[480px] lg:h-[600px]">
          <ChatPanel
            chatMessages={chatMessages}
            currentPlayer={currentPlayer}
            isArtist={isArtist}
            hasGuessed={hasGuessed}
            onSendGuess={onSendGuess}
          />
        </div>
      </div>

      {/* Modals and Overlays */}
      {/* 1. Movie Choice (Artist only) */}
      {isArtist && gameState.status === 'CHOOSING_MOVIE' && (
        <MovieChoiceModal
          isOpen={true}
          choices={movieChoices.length > 0 ? movieChoices : gameState.movieChoices || []}
          onSelectMovie={onSelectMovie}
        />
      )}

      {/* 2. Round End Reveal */}
      <RoundEndOverlay gameState={gameState} currentPlayer={currentPlayer} />

      {/* 3. Game Over Podium */}
      <GameOverModal
        gameState={gameState}
        currentPlayer={currentPlayer}
        onPlayAgain={onPlayAgain}
        onLeaveRoom={onLeaveRoom}
      />
    </div>
  );
};
