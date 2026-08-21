import { AvatarOption } from '../types';

export const AVATARS: AvatarOption[] = [
  { id: 'hero', name: 'Mass Hero', emoji: '🦸‍♂️', color: '#e50914' },
  { id: 'sunglasses', name: 'Cool Star', emoji: '😎', color: '#f59e0b' },
  { id: 'clapperboard', name: 'Director', emoji: '🎬', color: '#3b82f6' },
  { id: 'popcorn', name: 'Movie Buff', emoji: '🍿', color: '#ec4899' },
  { id: 'camera', name: 'Cameraman', emoji: '🎥', color: '#10b981' },
  { id: 'mustache', name: 'Vintage Babu', emoji: '🧔‍♂️', color: '#8b5cf6' },
  { id: 'whistle', name: 'Balcony Whistle', emoji: '🎺', color: '#f97316' },
  { id: 'star', name: 'Megastar', emoji: '⭐', color: '#eab308' },
  { id: 'crown', name: 'Box Office King', emoji: '👑', color: '#ef4444' },
  { id: 'ticket', name: 'FDFS Fan', emoji: '🎟️', color: '#06b6d4' },
  { id: 'reel', name: 'Film Reel', emoji: '🎞️', color: '#64748b' },
  { id: 'megaphone', name: 'Action Master', emoji: '📢', color: '#d946ef' },
];

export function getAvatar(id?: string): AvatarOption {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}
