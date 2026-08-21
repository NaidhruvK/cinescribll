import {
  Check,
  Clock,
  Copy,
  Crown,
  Play,
  RotateCcw,
  Settings2,
  Share2,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { AVATARS, getAvatar } from '../constants/avatars';
import { AvatarId, ChatMessage, GameState, Player, RoomSettings } from '../types';

interface LobbyProps {
  gameState: GameState;
  currentPlayer: Player;
  chatMessages: ChatMessage[];
  onStartGame: () => Promise<{ success: boolean; error?: string }>;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onUpdateProfile: (nickname: string, avatar: AvatarId) => void;
  onSendChat: (msg: string) => void;
  onLeaveRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  gameState,
  currentPlayer,
  chatMessages,
  onStartGame,
  onUpdateSettings,
  onUpdateProfile,
  onSendChat,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNick, setEditNick] = useState(currentPlayer.nickname);
  const [editAvatar, setEditAvatar] = useState<AvatarId>(currentPlayer.avatar);
  const [chatInput, setChatInput] = useState('');

  const isHost = currentPlayer.isHost;
  const connectedPlayers = gameState.players.filter((p) => p.connected);
  const canStart = connectedPlayers.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    setStartError(null);
    try {
      const res = await onStartGame();
      if (!res.success) {
        setStartError(res.error || 'Failed to start game');
        setIsStarting(false);
      }
    } catch (err: any) {
      setStartError(err?.message || 'Failed to start game');
      setIsStarting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNick.trim()) return;
    onUpdateProfile(editNick.trim(), editAvatar);
    setIsEditingProfile(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div id="cinescribbl-lobby" className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Banner: Room Code & Quick Share */}
      <div className="rounded-3xl bg-gradient-to-r from-[#24171f] via-[#1b1523] to-[#17131e] border border-red-900/40 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Tollywood Room Lobby</span>
          </div>
          <h1 className="font-['Fredoka',sans-serif] font-bold text-2xl sm:text-3xl text-white">
            Waiting for Players
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Share the room code with your friends to draw and guess together!
          </p>
        </div>

        {/* Big Room Code Box */}
        <div className="flex items-center gap-3 bg-[#130f1a] border border-red-900/60 rounded-2xl px-5 py-3 shadow-inner">
          <div className="text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Room Code</span>
            <span className="font-mono font-black text-2xl sm:text-3xl text-red-400 tracking-widest">
              {gameState.roomId}
            </span>
          </div>
          <button
            id="btn-lobby-copy-code"
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Players & Host controls, Right is Lobby Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Connected Players Section */}
          <div className="rounded-3xl bg-[#181321] border border-gray-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5 border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                <h2 className="font-['Fredoka',sans-serif] font-bold text-lg text-white">
                  Players ({connectedPlayers.length}/{gameState.settings.maxPlayers})
                </h2>
              </div>
              <button
                id="btn-edit-my-profile"
                onClick={() => {
                  setEditNick(currentPlayer.nickname);
                  setEditAvatar(currentPlayer.avatar);
                  setIsEditingProfile(!isEditingProfile);
                }}
                className="text-xs font-semibold text-gray-400 hover:text-white bg-[#221b2d] px-3 py-1.5 rounded-xl border border-gray-700 transition-colors"
              >
                {isEditingProfile ? 'Cancel Edit' : 'Edit My Profile'}
              </button>
            </div>

            {/* Profile Edit Drawer (Inline) */}
            {isEditingProfile && (
              <form
                onSubmit={handleSaveProfile}
                className="mb-6 p-4 rounded-2xl bg-[#120e18] border border-red-900/50 space-y-4 animate-fade-in"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Update Your Profile
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={18}
                    value={editNick}
                    onChange={(e) => setEditNick(e.target.value)}
                    className="flex-1 bg-[#1b1523] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter nickname"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1.5">Pick Avatar:</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setEditAvatar(av.id)}
                        className={`p-2 text-xl rounded-xl border transition-all ${
                          editAvatar === av.id
                            ? 'bg-red-950 border-red-500 scale-110'
                            : 'bg-[#1b1523] border-gray-800 hover:border-gray-700'
                        }`}
                        title={av.name}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gameState.players.map((player) => {
                const avatar = getAvatar(player.avatar);
                const isMe = player.id === currentPlayer.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-red-950/30 border-red-800/60 shadow-md ring-1 ring-red-500/20'
                        : 'bg-[#120e18] border-gray-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#231a2c] border border-gray-700 flex items-center justify-center text-2xl shadow-inner relative">
                        {avatar.emoji}
                        {player.isHost && (
                          <div
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md text-[10px]"
                            title="Room Host"
                          >
                            👑
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate max-w-[120px] sm:max-w-[140px]">
                            {player.nickname}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-900/60 text-red-300 rounded border border-red-700/40">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">{avatar.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {player.connected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 text-[10px] font-semibold">
                          Away
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Controls or Waiting State */}
          <div className="rounded-3xl bg-[#181321] border border-gray-800 p-6 shadow-lg">
            {isHost ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-red-400" />
                    <h3 className="font-['Fredoka',sans-serif] font-bold text-base text-white">
                      Host Game Settings
                    </h3>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> You are Host
                  </span>
                </div>

                {startError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
                    {startError}
                  </div>
                )}

                {/* Settings adjusters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Rounds */}
                  <div className="p-3 rounded-xl bg-[#120e18] border border-gray-800 flex flex-col justify-between gap-2">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Rounds:
                    </span>
                    <div className="flex gap-1">
                      {[2, 3, 5, 8].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => onUpdateSettings({ rounds: r })}
                          className={`flex-1 py-1 rounded-lg font-bold text-center border transition-colors ${
                            gameState.settings.rounds === r
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-[#1b1523] border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Draw Time */}
                  <div className="p-3 rounded-xl bg-[#120e18] border border-gray-800 flex flex-col justify-between gap-2">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Draw Time:
                    </span>
                    <div className="flex gap-1">
                      {[60, 80, 100, 120].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => onUpdateSettings({ drawTime: t })}
                          className={`flex-1 py-1 rounded-lg font-bold text-center text-[11px] border transition-colors ${
                            gameState.settings.drawTime === t
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-[#1b1523] border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Players */}
                  <div className="p-3 rounded-xl bg-[#120e18] border border-gray-800 flex flex-col justify-between gap-2">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-red-400" /> Max Players:
                    </span>
                    <div className="flex gap-1">
                      {[4, 6, 8, 12].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onUpdateSettings({ maxPlayers: p })}
                          className={`flex-1 py-1 rounded-lg font-bold text-center border transition-colors ${
                            gameState.settings.maxPlayers === p
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-[#1b1523] border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Start Game Button */}
                <button
                  id="btn-lobby-start-game"
                  type="button"
                  disabled={!canStart || isStarting}
                  onClick={handleStart}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-['Fredoka',sans-serif] font-bold text-lg shadow-xl shadow-red-700/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>
                    {canStart ? 'Start CineScribbl Game' : 'Waiting for at least 2 Players...'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 animate-pulse">
                  <Play className="w-5 h-5" />
                </div>
                <h3 className="font-['Fredoka',sans-serif] font-bold text-base text-white">
                  Waiting for Host to Start
                </h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  The host is configuring settings. The game will automatically launch for everyone
                  when started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lobby Live Chat */}
        <div className="rounded-3xl bg-[#181321] border border-gray-800 p-5 shadow-lg flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
            <span className="font-['Fredoka',sans-serif] font-bold text-sm text-white">
              Lobby Chat
            </span>
            <span className="text-[11px] text-gray-400">Say hi to other players!</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-center p-4">
                Chat feed is quiet. Type a message below!
              </div>
            ) : (
              chatMessages.map((msg) => {
                if (msg.type === 'join' || msg.type === 'leave' || msg.type === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="p-2 rounded-xl bg-[#120e18] text-gray-400 italic text-[11px] border border-gray-800/60 text-center"
                    >
                      {msg.text}
                    </div>
                  );
                }

                const senderAvatar = getAvatar(msg.senderAvatar);
                const isMe = msg.senderId === currentPlayer.id;

                return (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-xl border ${
                      isMe
                        ? 'bg-red-950/30 border-red-900/40 ml-2'
                        : 'bg-[#120e18] border-gray-800/80 mr-2'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span>{senderAvatar.emoji}</span>
                      <span className="font-bold text-white text-[11px]">
                        {msg.senderNickname || 'Player'}:
                      </span>
                    </div>
                    <p className="text-gray-200 text-xs break-words pl-5">{msg.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
            <input
              id="input-lobby-chat"
              type="text"
              maxLength={120}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Chat with players..."
              className="flex-1 bg-[#120e18] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <button
              id="btn-lobby-chat-send"
              type="submit"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
