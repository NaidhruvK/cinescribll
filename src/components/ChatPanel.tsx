import { MessageSquare, Send, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getAvatar } from '../constants/avatars';
import { ChatMessage, Player } from '../types';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  currentPlayer: Player;
  isArtist: boolean;
  hasGuessed: boolean;
  onSendGuess: (text: string) => void;
}

const EMOJI_REACTIONS = ['🎬', '🍿', '🔥', '👏', '😂', '🤯', '👑', '🎉'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  currentPlayer,
  isArtist,
  hasGuessed,
  onSendGuess,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendGuess(inputText.trim());
    setInputText('');
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendGuess(emoji);
  };

  return (
    <div
      id="cinescribbl-chat-panel"
      className="rounded-3xl bg-[#171320] border border-gray-800 p-4 sm:p-5 shadow-xl flex flex-col h-[480px] lg:h-full justify-between"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-red-500" />
          <span className="font-['Fredoka',sans-serif] font-bold text-sm text-white">
            Live Guesses & Chat
          </span>
        </div>
        {hasGuessed && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <span>✓</span> Guessed!
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 italic text-center p-4">
            Guesses will appear here in real-time. Guess the Telugu movie!
          </div>
        ) : (
          chatMessages.map((msg) => {
            // Correct guess special styling
            if (msg.type === 'correct') {
              return (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/90 to-[#122b1c] border border-emerald-700/70 text-emerald-300 font-bold text-xs shadow-md flex items-center gap-2 animate-bounce-short"
                >
                  <span className="text-base">🎉</span>
                  <div className="flex-1">{msg.text}</div>
                </div>
              );
            }

            // Close guess private alert
            if (msg.type === 'close') {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            // System notifications
            if (
              msg.type === 'system' ||
              msg.type === 'join' ||
              msg.type === 'leave' ||
              msg.type === 'artist_turn'
            ) {
              return (
                <div
                  key={msg.id}
                  className="py-1 px-2.5 rounded-lg bg-[#110e17] text-gray-400 text-[11px] font-medium text-center border border-gray-800/40"
                >
                  {msg.text}
                </div>
              );
            }

            // Normal user chat or guess
            const avatar = getAvatar(msg.senderAvatar);
            const isMe = msg.senderId === currentPlayer.id;

            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-red-950/25 border-red-900/40 ml-2'
                    : 'bg-[#120e18] border-gray-800/80 mr-2'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{avatar.emoji}</span>
                  <span className="font-bold text-gray-200 text-[11px]">
                    {msg.senderNickname || 'Player'}:
                  </span>
                </div>
                <p className="text-gray-100 text-xs break-words pl-5 leading-relaxed">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Bar */}
      <div className="flex items-center gap-1 py-2 border-t border-gray-800/80 overflow-x-auto">
        {EMOJI_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1 rounded-lg bg-[#120e18] hover:bg-gray-800 text-xs transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Guess Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 flex gap-2">
        <input
          id="input-game-guess"
          type="text"
          maxLength={80}
          disabled={isArtist}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isArtist
              ? 'You are drawing! (cannot guess)'
              : hasGuessed
              ? '✓ You guessed! Chat here...'
              : 'Type your Telugu movie guess...'
          }
          className="flex-1 bg-[#110e17] border border-gray-700 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
        />
        <button
          id="btn-game-guess-send"
          type="submit"
          disabled={isArtist || !inputText.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
