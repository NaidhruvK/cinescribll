// CineScribbl Shared Types

export type AvatarId =
  | 'clapperboard'
  | 'popcorn'
  | 'camera'
  | 'sunglasses'
  | 'mustache'
  | 'whistle'
  | 'hero'
  | 'star'
  | 'crown'
  | 'ticket'
  | 'reel'
  | 'megaphone';

export interface AvatarOption {
  id: AvatarId;
  name: string;
  emoji: string;
  color: string;
}

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: AvatarId;
  score: number;
  roundScore: number;
  isHost: boolean;
  isArtist: boolean;
  hasGuessed: boolean;
  guessTime?: number;
  isReady: boolean;
  connected: boolean;
  rank?: number;
}

export type GameStatus =
  | 'LOBBY'
  | 'CHOOSING_MOVIE'
  | 'DRAWING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number; // 2 - 12
  rounds: number; // 1 - 10
  drawTime: number; // 60, 80, 100, 120 seconds
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  points: DrawPoint[];
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawStrokeStart {
  strokeId: string;
  point: DrawPoint;
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawStrokeMove {
  strokeId: string;
  points: DrawPoint[];
}

export interface DrawStrokeEnd {
  strokeId: string;
  stroke: DrawStroke;
}

export interface DrawFill {
  x: number;
  y: number;
  color: string;
}

export type CanvasAction =
  | { type: 'stroke'; data: DrawStroke }
  | { type: 'fill'; data: DrawFill }
  | { type: 'clear' };

export type MessageType =
  | 'chat'
  | 'system'
  | 'correct'
  | 'close'
  | 'join'
  | 'leave'
  | 'artist_turn';

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderNickname?: string;
  senderAvatar?: AvatarId;
  text: string;
  type: MessageType;
  timestamp: number;
  pointsEarned?: number;
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  round: number;
  totalRounds: number;
  currentTurnIndex: number;
  currentArtistId: string | null;
  currentArtistName: string | null;
  currentArtistAvatar: AvatarId | null;
  hint: string;
  revealedIndices: number[];
  wordLengths: number[];
  remainingTime: number;
  totalTime: number;
  players: Player[];
  settings: RoomSettings;
  revealedMovie?: string;
  nextArtistName?: string | null;
  isLastTurnOfRound?: boolean;
  movieChoices?: string[]; // Only sent to active artist
  scoresChanged?: { playerId: string; points: number; total: number }[];
  winners?: { rank: number; player: Player }[];
}

export interface ClientToServerEvents {
  create_room: (
    data: { nickname: string; avatar: AvatarId; settings: RoomSettings },
    callback: (res: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;

  join_room: (
    data: { roomId: string; nickname: string; avatar: AvatarId },
    callback: (res: { success: boolean; error?: string; gameState?: GameState }) => void
  ) => void;

  reconnect_player: (
    data: { roomId: string; playerId: string },
    callback: (res: { success: boolean; error?: string; gameState?: GameState }) => void
  ) => void;

  update_profile: (data: { nickname: string; avatar: AvatarId }) => void;
  update_settings: (data: Partial<RoomSettings>) => void;
  toggle_ready: () => void;
  start_game: (callback: (res: { success: boolean; error?: string }) => void) => void;

  select_movie: (movie: string) => void;

  draw_stroke_start: (data: DrawStrokeStart) => void;
  draw_stroke_move: (data: DrawStrokeMove) => void;
  draw_stroke_end: (data: DrawStrokeEnd) => void;
  draw_stroke: (stroke: DrawStroke) => void;
  draw_fill: (fill: DrawFill) => void;
  clear_canvas: () => void;
  undo_stroke: () => void;

  send_guess: (guess: string) => void;
  leave_room: () => void;
  play_again: () => void;
}

export interface ServerToClientEvents {
  room_state: (state: GameState) => void;
  player_joined: (player: Player) => void;
  player_left: (data: { playerId: string; nickname: string }) => void;
  chat_message: (message: ChatMessage) => void;
  draw_stroke_start: (data: DrawStrokeStart) => void;
  draw_stroke_move: (data: DrawStrokeMove) => void;
  draw_stroke_end: (data: DrawStrokeEnd) => void;
  draw_stroke: (stroke: DrawStroke) => void;
  draw_fill: (fill: DrawFill) => void;
  clear_canvas: () => void;
  canvas_history: (actions: CanvasAction[]) => void;
  timer_tick: (data: { remainingTime: number; hint?: string }) => void;
  movie_choices: (choices: string[]) => void;
  round_started: (data: { artistId: string; artistName: string; drawTime: number }) => void;
  correct_guess: (data: { playerId: string; nickname: string; pointsEarned: number }) => void;
  close_guess: (data: { playerId: string; text: string }) => void;
  round_ended: (data: { movie: string; scores: { playerId: string; points: number; total: number }[] }) => void;
  game_over: (data: { winners: { rank: number; player: Player }[] }) => void;
  error_message: (msg: string) => void;
}
