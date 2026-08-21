import { Clock, Play, RefreshCw, RotateCcw, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { AVATARS, getAvatar } from '../constants/avatars';
import { AvatarId, RoomSettings } from '../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (nickname: string, avatar: AvatarId, settings: RoomSettings) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('cinescribbl_nickname') || '';
  });
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(() => {
    return (localStorage.getItem('cinescribbl_avatar') as AvatarId) || 'hero';
  });
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [rounds, setRounds] = useState<number>(3);
  const [drawTime, setDrawTime] = useState<number>(80);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setError('Please enter your nickname');
      return;
    }

    setIsLoading(true);
    setError(null);

    localStorage.setItem('cinescribbl_nickname', cleanNick);
    localStorage.setItem('cinescribbl_avatar', selectedAvatar);

    try {
      await onCreateRoom(cleanNick, selectedAvatar, {
        maxPlayers,
        rounds,
        drawTime,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create room');
      setIsLoading(false);
    }
  };

  return (
    <div
      id="modal-create-room"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#1b1624] border border-red-900/60 shadow-2xl p-6 sm:p-8 text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-['Fredoka',sans-serif] font-bold text-xl text-white">
                Create Game Room
              </h2>
              <p className="text-xs text-gray-400">Set up your Tollywood drawing battle</p>
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
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Your Nickname
            </label>
            <input
              id="input-create-nickname"
              type="text"
              required
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Mahesh, Allu, Prabhas"
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

          {/* Game Settings */}
          <div className="bg-[#130f1a] border border-gray-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Room Settings
            </h3>

            {/* Players (2 - 12) */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-400" />
                Players Limit:
              </span>
              <div className="flex items-center gap-2">
                {[4, 6, 8, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      maxPlayers === num
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-[#1e1828] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds (1 - 10) */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Total Rounds:
              </span>
              <div className="flex items-center gap-2">
                {[2, 3, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRounds(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      rounds === num
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-[#1e1828] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Time (60, 80, 100, 120s) */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Turn Duration:
              </span>
              <div className="flex items-center gap-2">
                {[60, 80, 100, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDrawTime(sec)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      drawTime === sec
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-[#1e1828] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-create-room"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-700/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Create & Enter Lobby</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
