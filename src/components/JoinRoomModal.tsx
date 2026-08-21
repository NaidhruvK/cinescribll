import { KeyRound, LogIn, RefreshCw, X } from 'lucide-react';
import React, { useState } from 'react';
import { AVATARS, getAvatar } from '../constants/avatars';
import { AvatarId } from '../types';

interface JoinRoomModalProps {
  isOpen: boolean;
  initialRoomCode?: string;
  onClose: () => void;
  onJoinRoom: (roomId: string, nickname: string, avatar: AvatarId) => Promise<void>;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  initialRoomCode = '',
  onClose,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode);
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('cinescribbl_nickname') || '';
  });
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(() => {
    return (localStorage.getItem('cinescribbl_avatar') as AvatarId) || 'sunglasses';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim();

    if (!cleanRoom) {
      setError('Please enter a room code');
      return;
    }
    if (!cleanNick) {
      setError('Please enter your nickname');
      return;
    }

    setIsLoading(true);
    setError(null);

    localStorage.setItem('cinescribbl_nickname', cleanNick);
    localStorage.setItem('cinescribbl_avatar', selectedAvatar);

    try {
      await onJoinRoom(cleanRoom, cleanNick, selectedAvatar);
    } catch (err: any) {
      setError(err?.message || 'Failed to join room. Please check the code.');
      setIsLoading(false);
    }
  };

  return (
    <div
      id="modal-join-room"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#1b1624] border border-gray-800 shadow-2xl p-6 sm:p-8 text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Fredoka',sans-serif] font-bold text-xl text-white">
                Join Game Room
              </h2>
              <p className="text-xs text-gray-400">Enter code to join friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
              Room Code (6 Letters)
            </label>
            <input
              id="input-join-room-code"
              type="text"
              required
              maxLength={8}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD12"
              className="w-full bg-[#120e18] border border-gray-700/80 focus:border-red-500 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono font-bold tracking-widest uppercase"
            />
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Your Nickname
            </label>
            <input
              id="input-join-nickname"
              type="text"
              required
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full bg-[#120e18] border border-gray-700/80 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
              <span>Choose Your Avatar</span>
              <span className="text-[11px] text-red-400 font-semibold">
                {getAvatar(selectedAvatar).name}
              </span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-36 overflow-y-auto pr-1">
              {AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/80 border-red-500 ring-2 ring-red-500/40 scale-105 shadow-md'
                        : 'bg-[#120e18] border-gray-800 hover:border-gray-700 hover:bg-[#1a1424]'
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="text-[10px] text-gray-300 mt-1 font-medium truncate w-full text-center">
                      {av.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-join-room"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-700/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Joining Lobby...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Join Game Room</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
