import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import React, { useState } from 'react';
import { CreateRoomModal } from './components/CreateRoomModal';
import { GameScreen } from './components/GameScreen';
import { Home } from './components/Home';
import { HowToPlayModal } from './components/HowToPlayModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { Lobby } from './components/Lobby';
import { Navbar } from './components/Navbar';
import { useAudio } from './hooks/useAudio';
import { useSocket } from './hooks/useSocket';
import { AvatarId, RoomSettings } from './types';

export const App: React.FC = () => {
  const {
    isConnected,
    gameState,
    currentPlayer,
    chatMessages,
    movieChoices,
    canvasActions,
    lastNotification,
    errorModal,
    clearErrorModal,
    createRoom,
    joinRoom,
    startGame,
    selectMovie,
    sendStroke,
    sendFill,
    clearCanvas,
    undoStroke,
    sendGuess,
    updateProfile,
    updateSettings,
    playAgain,
    leaveRoom,
  } = useSocket();

  const {
    isMuted,
    toggleMute,
    playCorrectSound,
    playCloseSound,
    playTurnStartSound,
    playTickSound,
    playGameOverSound,
  } = useAudio();

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  const handleCreateRoom = async (
    nickname: string,
    avatar: AvatarId,
    settings: RoomSettings
  ) => {
    const res = await createRoom(nickname, avatar, settings);
    if (res.success) {
      setIsCreateOpen(false);
    } else {
      throw new Error(res.error || 'Failed to create room');
    }
  };

  const handleJoinRoom = async (
    roomId: string,
    nickname: string,
    avatar: AvatarId
  ) => {
    const res = await joinRoom(roomId, nickname, avatar);
    if (res.success) {
      setIsJoinOpen(false);
    } else {
      throw new Error(res.error || 'Failed to join room');
    }
  };

  return (
    <div id="cinescribbl-app" className="min-h-screen bg-[#0d0a14] text-gray-100 flex flex-col font-['Nunito',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        roomCode={gameState?.roomId}
        isConnected={isConnected}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onLeaveRoom={gameState ? leaveRoom : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {!gameState ? (
          /* Landing Screen */
          <Home
            onCreateRoom={() => setIsCreateOpen(true)}
            onJoinRoom={() => setIsJoinOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          />
        ) : gameState.status === 'LOBBY' && currentPlayer ? (
          /* Room Lobby */
          <Lobby
            gameState={gameState}
            currentPlayer={currentPlayer}
            chatMessages={chatMessages}
            onStartGame={startGame}
            onUpdateSettings={updateSettings}
            onUpdateProfile={updateProfile}
            onSendChat={sendGuess}
            onLeaveRoom={leaveRoom}
          />
        ) : currentPlayer ? (
          /* Active Game Screen */
          <GameScreen
            gameState={gameState}
            currentPlayer={currentPlayer}
            chatMessages={chatMessages}
            movieChoices={movieChoices}
            canvasActions={canvasActions}
            lastNotification={lastNotification}
            onSelectMovie={selectMovie}
            onSendStroke={sendStroke}
            onClearCanvas={clearCanvas}
            onUndoStroke={undoStroke}
            onSendGuess={sendGuess}
            onPlayAgain={playAgain}
            onLeaveRoom={leaveRoom}
            playCorrectSound={playCorrectSound}
            playCloseSound={playCloseSound}
            playTurnStartSound={playTurnStartSound}
            playTickSound={playTickSound}
            playGameOverSound={playGameOverSound}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center p-8">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p>Connecting to CineScribbl...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-400 border-t border-gray-900 bg-[#0b0812]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🎬 <strong className="text-gray-200">CineScribbl</strong> — Multiplayer Telugu Movie Drawing & Guessing Game
          </span>
          <span className="text-gray-400">
            Tollywood Master Dataset • 200+ Movies • Real-Time WebSockets
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Error Alert Toast / Modal */}
      {errorModal && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-2xl bg-red-950/90 border border-red-700 shadow-2xl text-red-200 text-xs font-semibold flex items-center gap-3 animate-fade-in max-w-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">{errorModal}</div>
          <button
            onClick={clearErrorModal}
            className="p-1 hover:bg-red-900/60 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
