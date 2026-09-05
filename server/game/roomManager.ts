import { Server as SocketIOServer } from 'socket.io';
import {
  AvatarId,
  CanvasAction,
  ChatMessage,
  DrawFill,
  DrawStroke,
  DrawStrokeEnd,
  DrawStrokeMove,
  DrawStrokeStart,
  GameState,
  GameStatus,
  Player,
  RoomSettings,
} from '../../src/types';
import { getRandomMovieChoices } from '../data/movieService';
import {
  calculateArtistScore,
  calculateGuessScore,
  isCloseGuess,
  isCorrectGuess,
} from './scoring';

interface Room {
  id: string;
  hostId: string;
  status: GameStatus;
  round: number;
  totalRounds: number;
  currentTurnIndex: number;
  turnOrder: string[]; // player ids
  currentArtistId: string | null;
  currentMovie: string | null;
  currentMovieChoices: string[];
  hint: string;
  revealedIndices: number[];
  remainingTime: number;
  totalTime: number;
  settings: RoomSettings;
  players: Map<string, Player>;
  canvasHistory: CanvasAction[];
  usedMovies: Set<string>;
  correctGuessCount: number;
  timerInterval: NodeJS.Timeout | null;
  choiceTimeout: NodeJS.Timeout | null;
  roundEndTimeout: NodeJS.Timeout | null;
  createdAt: number;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToPlayer: Map<string, { roomId: string; playerId: string }> = new Map();
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private emptyRoomTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 12) +
      Math.random().toString(36).substring(2, 12)
    );
  }

  private scheduleEmptyRoomCleanup(roomId: string) {
    if (this.emptyRoomTimeouts.has(roomId)) return;
    const timeout = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (room) {
        const connectedCount = Array.from(room.players.values()).filter((p) => p.connected).length;
        if (connectedCount === 0) {
          this.clearAllTimers(room);
          this.rooms.delete(roomId);
          console.log(`[RoomManager] Room ${roomId} cleaned up after being empty for 3 minutes.`);
        }
      }
      this.emptyRoomTimeouts.delete(roomId);
    }, 180000);
    this.emptyRoomTimeouts.set(roomId, timeout);
  }

  private cancelEmptyRoomCleanup(roomId: string) {
    if (this.emptyRoomTimeouts.has(roomId)) {
      clearTimeout(this.emptyRoomTimeouts.get(roomId)!);
      this.emptyRoomTimeouts.delete(roomId);
    }
  }

  public createRoom(
    socketId: string,
    nickname: string,
    avatar: AvatarId,
    settings: RoomSettings
  ): { roomId: string; player: Player; reconnectToken: string } {
    const roomId = this.generateRoomCode();
    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const reconnectToken = this.generateToken();

    const player: Player = {
      id: playerId,
      socketId,
      nickname: nickname.trim() || 'Hero',
      avatar,
      score: 0,
      roundScore: 0,
      isHost: true,
      isArtist: false,
      hasGuessed: false,
      isReady: true,
      connected: true,
      reconnectToken,
    };

    const room: Room = {
      id: roomId,
      hostId: playerId,
      status: 'LOBBY',
      round: 1,
      totalRounds: Math.min(10, Math.max(1, settings.rounds || 3)),
      currentTurnIndex: 0,
      turnOrder: [playerId],
      currentArtistId: null,
      currentMovie: null,
      currentMovieChoices: [],
      hint: '',
      revealedIndices: [],
      remainingTime: settings.drawTime || 80,
      totalTime: settings.drawTime || 80,
      settings: {
        maxPlayers: Math.min(12, Math.max(2, settings.maxPlayers || 8)),
        rounds: Math.min(10, Math.max(1, settings.rounds || 3)),
        drawTime: settings.drawTime || 80,
      },
      players: new Map([[playerId, player]]),
      canvasHistory: [],
      usedMovies: new Set(),
      correctGuessCount: 0,
      timerInterval: null,
      choiceTimeout: null,
      roundEndTimeout: null,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.socketToPlayer.set(socketId, { roomId, playerId });

    return { roomId, player, reconnectToken };
  }

  public joinRoom(
    roomId: string,
    socketId: string,
    nickname: string,
    avatar: AvatarId,
    existingPlayerId?: string,
    reconnectToken?: string
  ): {
    success: boolean;
    error?: string;
    player?: Player;
    room?: Room;
    reconnectToken?: string;
  } {
    const normalizedRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(normalizedRoomId);

    if (!room) {
      return { success: false, error: 'Room not found. Please check the room code.' };
    }

    this.cancelEmptyRoomCleanup(normalizedRoomId);

    // 1. Check reconnection / rejoin of existing player
    if (existingPlayerId && room.players.has(existingPlayerId)) {
      const player = room.players.get(existingPlayerId)!;

      // Validate security reconnectToken if present
      if (player.reconnectToken && reconnectToken && player.reconnectToken !== reconnectToken) {
        return { success: false, error: 'Invalid reconnect authorization credentials.' };
      }

      // If old socket still in map, remove it
      if (player.socketId && player.socketId !== socketId) {
        this.socketToPlayer.delete(player.socketId);
      }

      player.socketId = socketId;
      player.connected = true;

      // Update nickname or avatar if provided in rejoin modal
      if (nickname.trim()) player.nickname = nickname.trim();
      if (avatar) player.avatar = avatar;

      // Clear any disconnect timer
      const timeoutKey = `${normalizedRoomId}:${existingPlayerId}`;
      if (this.disconnectTimeouts.has(timeoutKey)) {
        clearTimeout(this.disconnectTimeouts.get(timeoutKey)!);
        this.disconnectTimeouts.delete(timeoutKey);
      }

      this.socketToPlayer.set(socketId, { roomId: normalizedRoomId, playerId: existingPlayerId });

      // If active game, RESET SCORE TO 0 (Requirement 2, 6, 22)
      if (room.status !== 'LOBBY' && room.status !== 'GAME_OVER') {
        player.score = 0;
        player.roundScore = 0;
        player.hasGuessed = false;
        player.guessTime = undefined;
        player.isArtist = room.currentArtistId === player.id;

        // Ensure player is present in turnOrder for upcoming rounds/turns
        if (!room.turnOrder.includes(player.id)) {
          room.turnOrder.push(player.id);
        }

        this.broadcastSystemMessage(
          normalizedRoomId,
          `🎬 ${player.nickname} rejoined the game! (Score reset to 0)`,
          'join'
        );
      } else {
        this.broadcastSystemMessage(
          normalizedRoomId,
          `🍿 ${player.nickname} reconnected to lobby!`,
          'join'
        );
      }

      this.broadcastRoomState(normalizedRoomId);

      return {
        success: true,
        player,
        room,
        reconnectToken: player.reconnectToken,
      };
    }

    // 2. Reject brand-new players if game is already active
    if (room.status !== 'LOBBY' && room.status !== 'GAME_OVER') {
      return {
        success: false,
        error: 'Game is currently in progress. Only returning players can rejoin this room.',
      };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is full (maximum capacity reached).' };
    }

    const trimmedNickname = nickname.trim() || 'Player';
    const isNickTaken = Array.from(room.players.values()).some(
      (p) => p.nickname.toLowerCase() === trimmedNickname.toLowerCase() && p.connected
    );

    if (isNickTaken) {
      return { success: false, error: 'That nickname is already in use in this room.' };
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const newReconnectToken = this.generateToken();
    const player: Player = {
      id: playerId,
      socketId,
      nickname: trimmedNickname,
      avatar,
      score: 0,
      roundScore: 0,
      isHost: room.players.size === 0,
      isArtist: false,
      hasGuessed: false,
      isReady: true,
      connected: true,
      reconnectToken: newReconnectToken,
    };

    room.players.set(playerId, player);
    if (!room.turnOrder.includes(playerId)) {
      room.turnOrder.push(playerId);
    }
    this.socketToPlayer.set(socketId, { roomId: normalizedRoomId, playerId });

    this.broadcastSystemMessage(
      normalizedRoomId,
      `🍿 ${player.nickname} joined the lobby!`,
      'join'
    );
    this.broadcastRoomState(normalizedRoomId);

    return { success: true, player, room, reconnectToken: newReconnectToken };
  }

  public updateProfile(socketId: string, nickname: string, avatar: AvatarId): boolean {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return false;
    const room = this.rooms.get(session.roomId);
    if (!room || (room.status !== 'LOBBY' && room.status !== 'GAME_OVER')) return false;

    const player = room.players.get(session.playerId);
    if (!player) return false;

    player.nickname = nickname.trim() || player.nickname;
    player.avatar = avatar;
    this.broadcastRoomState(room.id);
    return true;
  }

  public updateSettings(socketId: string, settings: Partial<RoomSettings>): boolean {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return false;
    const room = this.rooms.get(session.roomId);
    if (!room || (room.status !== 'LOBBY' && room.status !== 'GAME_OVER')) return false;

    const player = room.players.get(session.playerId);
    if (!player || !player.isHost) return false;

    if (settings.maxPlayers !== undefined) {
      room.settings.maxPlayers = Math.min(12, Math.max(2, settings.maxPlayers));
    }
    if (settings.rounds !== undefined) {
      room.settings.rounds = Math.min(10, Math.max(1, settings.rounds));
      room.totalRounds = room.settings.rounds;
    }
    if (settings.drawTime !== undefined) {
      room.settings.drawTime = settings.drawTime;
      room.totalTime = settings.drawTime;
    }

    this.broadcastRoomState(room.id);
    return true;
  }

  public startGame(socketId: string): { success: boolean; error?: string } {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return { success: false, error: 'Session not found.' };
    const room = this.rooms.get(session.roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const player = room.players.get(session.playerId);
    if (!player || !player.isHost) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      return { success: false, error: 'At least 2 players are needed to start the game.' };
    }

    // Reset game counters
    room.round = 1;
    room.totalRounds = room.settings.rounds;
    room.currentTurnIndex = 0;
    room.usedMovies.clear();
    room.turnOrder = connectedPlayers.map((p) => p.id);

    // Reset all player scores
    room.players.forEach((p) => {
      p.score = 0;
      p.roundScore = 0;
      p.isArtist = false;
      p.hasGuessed = false;
    });

    this.broadcastSystemMessage(
      room.id,
      `🎬 Lights, Camera, Action! Game Started - Round 1 of ${room.totalRounds}!`,
      'system'
    );
    this.startTurn(room);
    return { success: true };
  }

  private startTurn(room: Room) {
    this.clearAllTimers(room);
    room.canvasHistory = [];
    room.correctGuessCount = 0;
    this.io.to(room.id).emit('clear_canvas');

    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length < 2) {
      room.status = 'LOBBY';
      this.broadcastSystemMessage(
        room.id,
        'Not enough players connected to continue. Returned to lobby.',
        'system'
      );
      this.broadcastRoomState(room.id);
      return;
    }

    // Advance currentTurnIndex past any disconnected players in turnOrder
    let cycleCount = 0;
    while (cycleCount < room.turnOrder.length * 2) {
      if (room.currentTurnIndex >= room.turnOrder.length) {
        room.round++;
        room.currentTurnIndex = 0;
        if (room.round > room.totalRounds) {
          this.endGame(room);
          return;
        }
        this.broadcastSystemMessage(
          room.id,
          `🔔 Round ${room.round} of ${room.totalRounds} starts now!`,
          'system'
        );
      }

      const candidateId = room.turnOrder[room.currentTurnIndex];
      const candidate = room.players.get(candidateId);
      if (candidate && candidate.connected) {
        break;
      }
      // Candidate is disconnected or missing, advance index
      room.currentTurnIndex++;
      cycleCount++;
    }

    const artistId = room.turnOrder[room.currentTurnIndex];
    let artist = room.players.get(artistId);
    if (!artist || !artist.connected) {
      artist = connectedPlayers[0];
      room.currentArtistId = artist.id;
    } else {
      room.currentArtistId = artist.id;
    }

    room.currentArtistId = artist.id;
    room.currentMovie = null;
    room.status = 'CHOOSING_MOVIE';
    room.remainingTime = 15;
    room.totalTime = 15;

    // Reset guess status
    room.players.forEach((p) => {
      p.isArtist = p.id === artist.id;
      p.hasGuessed = false;
      p.roundScore = 0;
    });

    // Pick 3 random unique unused Telugu movies for this turn
    const choices = getRandomMovieChoices(3, room.usedMovies);

    if (choices.length < 3) {
      console.warn(
        `[RoomManager] Room ${room.id} ran out of unique movies in dataset (${choices.length} available). Ending match gracefully.`
      );
      this.broadcastSystemMessage(
        room.id,
        '⚠️ Movie dataset exhausted: Not enough unique unused Telugu movies remaining for 3 choices. Ending match...',
        'system'
      );
      this.endGame(room);
      return;
    }

    // Atomically mark all 3 offered choices as used for this game session
    // Once offered to any player, these movies will not be offered again during this game
    for (const choice of choices) {
      room.usedMovies.add(choice.trim().toLowerCase());
    }

    room.currentMovieChoices = choices;

    this.broadcastSystemMessage(
      room.id,
      `🎨 ${artist.nickname} is choosing a Telugu movie...`,
      'artist_turn'
    );

    // Send movie choices ONLY to the artist
    this.io.to(artist.socketId).emit('movie_choices', choices);
    this.broadcastRoomState(room.id);

    // Auto-select after 15 seconds if artist doesn't pick
    room.choiceTimeout = setTimeout(() => {
      if (room.status === 'CHOOSING_MOVIE') {
        const fallback = choices[0] || 'Athadu';
        this.selectMovie(artist.socketId, fallback);
      }
    }, 15000);
  }

  public selectMovie(socketId: string, movie: string): boolean {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return false;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'CHOOSING_MOVIE') return false;

    if (room.currentArtistId !== session.playerId) return false;

    if (room.choiceTimeout) {
      clearTimeout(room.choiceTimeout);
      room.choiceTimeout = null;
    }

    // Validate that the selected movie is from the offered choices
    const matchedChoice = room.currentMovieChoices.find(
      (c) => c.trim().toLowerCase() === movie.trim().toLowerCase()
    );
    const selectedMovie = matchedChoice || room.currentMovieChoices[0] || movie;

    room.currentMovie = selectedMovie;
    room.usedMovies.add(selectedMovie.trim().toLowerCase());
    room.status = 'DRAWING';
    room.remainingTime = room.settings.drawTime;
    room.totalTime = room.settings.drawTime;
    room.revealedIndices = [];
    room.hint = this.generateInitialHint(movie);

    const artist = room.players.get(room.currentArtistId);
    this.broadcastSystemMessage(
      room.id,
      `🎨 ${artist?.nickname || 'Artist'} is drawing now! Start guessing!`,
      'artist_turn'
    );

    this.io.to(room.id).emit('round_started', {
      artistId: artist?.id || '',
      artistName: artist?.nickname || '',
      drawTime: room.totalTime,
    });

    this.broadcastRoomState(room.id);
    this.startDrawingTimer(room);
    return true;
  }

  private generateInitialHint(movie: string): string {
    return movie
      .split('')
      .map((char) => {
        if (/[a-zA-Z0-9]/.test(char)) return '_';
        if (char === ' ') return ' ';
        return char;
      })
      .join('');
  }

  private revealHintLetter(room: Room) {
    if (!room.currentMovie) return;
    const movieChars = room.currentMovie.split('');
    const eligibleIndices: number[] = [];

    movieChars.forEach((char, idx) => {
      if (/[a-zA-Z0-9]/.test(char) && !room.revealedIndices.includes(idx)) {
        eligibleIndices.push(idx);
      }
    });

    // Don't reveal more than 40% of the letters
    const maxReveals = Math.max(1, Math.floor(eligibleIndices.length * 0.4));
    if (eligibleIndices.length > 0 && room.revealedIndices.length < maxReveals) {
      const randomIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
      room.revealedIndices.push(randomIndex);

      room.hint = movieChars
        .map((char, idx) => {
          if (!/[a-zA-Z0-9]/.test(char)) return char;
          if (room.revealedIndices.includes(idx)) return char;
          return '_';
        })
        .join('');
    }
  }

  private startDrawingTimer(room: Room) {
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      room.remainingTime--;

      // Hints at 50% and 25% time
      if (room.remainingTime === Math.floor(room.totalTime * 0.5)) {
        this.revealHintLetter(room);
      } else if (room.remainingTime === Math.floor(room.totalTime * 0.25)) {
        this.revealHintLetter(room);
      }

      this.io.to(room.id).emit('timer_tick', {
        remainingTime: room.remainingTime,
        hint: room.hint,
      });

      if (room.remainingTime <= 0) {
        this.endTurn(room);
      }
    }, 1000);
  }

  public processGuess(socketId: string, guessText: string): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room) return;

    const player = room.players.get(session.playerId);
    if (!player) return;

    const trimmed = guessText.trim();
    if (!trimmed) return;

    // Normal chat during lobby, round end, or game over
    if (room.status !== 'DRAWING' || !room.currentMovie) {
      this.broadcastChatMessage(room.id, player, trimmed, 'chat');
      return;
    }

    // Artist cannot guess
    if (player.id === room.currentArtistId) {
      this.broadcastChatMessage(room.id, player, trimmed, 'chat');
      return;
    }

    // Already guessed correctly
    if (player.hasGuessed) {
      // Send chat to everyone (or show with green indicator)
      this.broadcastChatMessage(room.id, player, trimmed, 'chat');
      return;
    }

    // Check if guess is correct
    if (isCorrectGuess(trimmed, room.currentMovie)) {
      player.hasGuessed = true;
      room.correctGuessCount++;

      const pointsEarned = calculateGuessScore(
        room.remainingTime,
        room.totalTime,
        room.correctGuessCount
      );

      player.score += pointsEarned;
      player.roundScore = pointsEarned;

      // Broadcast system celebration
      const correctMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: player.id,
        senderNickname: player.nickname,
        senderAvatar: player.avatar,
        text: `${player.nickname} guessed the movie! 🎉 (+${pointsEarned} pts)`,
        type: 'correct',
        timestamp: Date.now(),
        pointsEarned,
      };

      this.io.to(room.id).emit('chat_message', correctMsg);
      this.io.to(player.socketId).emit('correct_guess', {
        playerId: player.id,
        nickname: player.nickname,
        pointsEarned,
      });

      this.broadcastRoomState(room.id);

      // Check if all non-artist connected players have guessed
      const guessers = Array.from(room.players.values()).filter(
        (p) => p.connected && p.id !== room.currentArtistId
      );
      const allGuessed = guessers.length > 0 && guessers.every((p) => p.hasGuessed);

      if (allGuessed) {
        this.endTurn(room);
      }
      return;
    }

    // Check if guess is close
    if (isCloseGuess(trimmed, room.currentMovie)) {
      this.io.to(player.socketId).emit('close_guess', {
        playerId: player.id,
        text: `"${trimmed}" is very close! 🔥`,
      });
    }

    // Regular guess broadcast
    this.broadcastChatMessage(room.id, player, trimmed, 'chat');
  }

  private endTurn(room: Room) {
    this.clearAllTimers(room);
    room.status = 'ROUND_END';

    // Calculate score for artist
    const guessers = Array.from(room.players.values()).filter(
      (p) => p.connected && p.id !== room.currentArtistId
    );
    const artist = room.currentArtistId ? room.players.get(room.currentArtistId) : null;
    let artistPoints = 0;

    if (artist && guessers.length > 0) {
      artistPoints = calculateArtistScore(room.correctGuessCount, guessers.length);
      artist.score += artistPoints;
      artist.roundScore = artistPoints;
    }

    const scoresSummary = Array.from(room.players.values()).map((p) => ({
      playerId: p.id,
      points: p.roundScore,
      total: p.score,
    }));

    const remainingConnectedInRound = room.turnOrder
      .slice(room.currentTurnIndex + 1)
      .filter((id) => room.players.get(id)?.connected);

    const isLastTurnInRound = remainingConnectedInRound.length === 0;
    const isFinalTurnOfGame = isLastTurnInRound && room.round >= room.totalRounds;

    this.broadcastSystemMessage(
      room.id,
      `⏰ Turn ended! The Telugu movie was: "${room.currentMovie}"`,
      'system'
    );

    if (isLastTurnInRound && !isFinalTurnOfGame) {
      this.broadcastSystemMessage(
        room.id,
        `🏁 Round ${room.round} completed! Round ${room.round + 1} starting soon...`,
        'system'
      );
    }

    this.io.to(room.id).emit('round_ended', {
      movie: room.currentMovie || '',
      scores: scoresSummary,
    });

    this.broadcastRoomState(room.id);

    // Wait 4.5 seconds to show results then start next turn
    room.roundEndTimeout = setTimeout(() => {
      room.currentTurnIndex++;
      this.startTurn(room);
    }, 4500);
  }

  private endGame(room: Room) {
    this.clearAllTimers(room);
    room.status = 'GAME_OVER';

    const rankedPlayers = Array.from(room.players.values())
      .filter((p) => p.connected)
      .sort((a, b) => b.score - a.score);

    rankedPlayers.forEach((p, index) => {
      p.rank = index + 1;
    });

    const winners = rankedPlayers.slice(0, 3).map((player, idx) => ({
      rank: idx + 1,
      player,
    }));

    this.broadcastSystemMessage(
      room.id,
      `🏆 Game Over! Winner: ${rankedPlayers[0]?.nickname || 'Hero'} with ${rankedPlayers[0]?.score || 0} pts!`,
      'system'
    );

    this.io.to(room.id).emit('game_over', { winners });
    this.broadcastRoomState(room.id);
  }

  public playAgain(socketId: string): boolean {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return false;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'GAME_OVER') return false;

    const player = room.players.get(session.playerId);
    if (!player || !player.isHost) return false;

    room.status = 'LOBBY';
    room.round = 1;
    room.currentTurnIndex = 0;
    room.usedMovies.clear();
    room.canvasHistory = [];
    room.currentArtistId = null;
    room.currentMovie = null;

    // Prune players who were disconnected at end of match
    for (const [pId, p] of room.players.entries()) {
      if (!p.connected) {
        room.players.delete(pId);
      }
    }
    room.turnOrder = Array.from(room.players.values()).map((p) => p.id);

    room.players.forEach((p) => {
      p.score = 0;
      p.roundScore = 0;
      p.isArtist = false;
      p.hasGuessed = false;
      p.rank = undefined;
    });

    this.broadcastSystemMessage(room.id, '🔄 Host restarted the game! Ready in lobby.', 'system');
    this.broadcastRoomState(room.id);
    return true;
  }

  public startStroke(socketId: string, data: DrawStrokeStart): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    // Relay live stroke start to all other players in the room immediately
    this.io.to(room.id).except(socketId).emit('draw_stroke_start', data);
  }

  public moveStroke(socketId: string, data: DrawStrokeMove): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    // Relay live stroke segments to all other players in the room immediately
    this.io.to(room.id).except(socketId).emit('draw_stroke_move', data);
  }

  public endStroke(socketId: string, data: DrawStrokeEnd): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    // Persist full stroke in canvas history for reconnects and late joiners
    if (data.stroke && data.stroke.points && data.stroke.points.length > 0) {
      room.canvasHistory.push({ type: 'stroke', data: data.stroke });
    }

    // Relay stroke end to all other players
    this.io.to(room.id).except(socketId).emit('draw_stroke_end', data);
  }

  public addCanvasStroke(socketId: string, stroke: DrawStroke): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    room.canvasHistory.push({ type: 'stroke', data: stroke });
    // Broadcast stroke to everyone else
    this.io.to(room.id).except(socketId).emit('draw_stroke', stroke);
  }

  public addCanvasFill(socketId: string, fill: DrawFill): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    room.canvasHistory.push({ type: 'fill', data: fill });
    this.io.to(room.id).except(socketId).emit('draw_fill', fill);
  }

  public clearCanvas(socketId: string): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    room.canvasHistory = [{ type: 'clear' }];
    this.io.to(room.id).emit('clear_canvas');
  }

  public undoStroke(socketId: string): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;
    const room = this.rooms.get(session.roomId);
    if (!room || room.status !== 'DRAWING' || room.currentArtistId !== session.playerId) return;

    // Pop the last stroke
    for (let i = room.canvasHistory.length - 1; i >= 0; i--) {
      if (room.canvasHistory[i].type === 'stroke') {
        room.canvasHistory.splice(i, 1);
        break;
      }
    }
    this.io.to(room.id).emit('canvas_history', room.canvasHistory);
  }

  public handleDisconnect(socketId: string): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;

    const { roomId, playerId } = session;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.socketToPlayer.delete(socketId);
      return;
    }

    const player = room.players.get(playerId);
    if (!player) {
      this.socketToPlayer.delete(socketId);
      return;
    }

    player.connected = false;
    this.socketToPlayer.delete(socketId);

    this.broadcastSystemMessage(roomId, `⚠️ ${player.nickname} disconnected.`, 'leave');

    // If host disconnected and other connected players exist, pass host
    if (player.isHost) {
      const nextHost = Array.from(room.players.values()).find((p) => p.connected && p.id !== playerId);
      if (nextHost) {
        player.isHost = false;
        nextHost.isHost = true;
        this.broadcastSystemMessage(
          roomId,
          `👑 ${nextHost.nickname} is now the room host.`,
          'system'
        );
      }
    }

    // If in LOBBY, set a 60-second timeout to clean up abandoned slot
    if (room.status === 'LOBBY') {
      const timeoutKey = `${roomId}:${playerId}`;
      const timeout = setTimeout(() => {
        if (room.status === 'LOBBY' && !player.connected) {
          this.removePlayerPermanently(roomId, playerId);
        }
        this.disconnectTimeouts.delete(timeoutKey);
      }, 60000);
      this.disconnectTimeouts.set(timeoutKey, timeout);
    }

    // Check remaining connected players
    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length === 0) {
      this.scheduleEmptyRoomCleanup(roomId);
    }

    // If current artist disconnected during choosing or drawing, advance turn safely!
    if (
      (room.status === 'CHOOSING_MOVIE' || room.status === 'DRAWING') &&
      room.currentArtistId === playerId
    ) {
      this.broadcastSystemMessage(
        roomId,
        `🎨 Artist disconnected! Passing turn to next player...`,
        'system'
      );
      this.endTurn(room);
    } else {
      this.broadcastRoomState(roomId);
    }
  }

  public leaveRoom(socketId: string): void {
    const session = this.socketToPlayer.get(socketId);
    if (!session) return;

    const { roomId, playerId } = session;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.socketToPlayer.delete(socketId);
      return;
    }

    const player = room.players.get(playerId);
    if (!player) {
      this.socketToPlayer.delete(socketId);
      return;
    }

    this.socketToPlayer.delete(socketId);

    // If in LOBBY or GAME_OVER, remove permanently
    if (room.status === 'LOBBY' || room.status === 'GAME_OVER') {
      this.removePlayerPermanently(roomId, playerId);
      return;
    }

    // DURING ACTIVE GAME: Mark as disconnected/left, preserve membership for rejoining!
    player.connected = false;
    this.broadcastSystemMessage(roomId, `👋 ${player.nickname} left the room.`, 'leave');

    // If host left, pass host
    if (player.isHost) {
      const nextHost = Array.from(room.players.values()).find((p) => p.connected && p.id !== playerId);
      if (nextHost) {
        player.isHost = false;
        nextHost.isHost = true;
        this.broadcastSystemMessage(
          roomId,
          `👑 ${nextHost.nickname} is now the room host.`,
          'system'
        );
      }
    }

    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length === 0) {
      this.scheduleEmptyRoomCleanup(roomId);
    }

    // If artist left during choosing or drawing, advance turn safely!
    if (
      (room.status === 'CHOOSING_MOVIE' || room.status === 'DRAWING') &&
      room.currentArtistId === playerId
    ) {
      this.broadcastSystemMessage(
        roomId,
        `🎨 Artist left the room! Passing turn to next player...`,
        'system'
      );
      this.endTurn(room);
    } else {
      this.broadcastRoomState(roomId);
    }
  }

  private removePlayerPermanently(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    const removedIndex = room.turnOrder.indexOf(playerId);
    room.players.delete(playerId);
    room.turnOrder = room.turnOrder.filter((id) => id !== playerId);

    if (removedIndex !== -1 && removedIndex < room.currentTurnIndex) {
      room.currentTurnIndex = Math.max(0, room.currentTurnIndex - 1);
    }

    // Reassign host if host left
    if (player.isHost && room.players.size > 0) {
      const nextHost =
        Array.from(room.players.values()).find((p) => p.connected) ||
        Array.from(room.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
        this.broadcastSystemMessage(
          roomId,
          `👑 ${nextHost.nickname} is now the room host.`,
          'system'
        );
      }
    }

    this.io.to(roomId).emit('player_left', { playerId, nickname: player.nickname });

    if (room.players.size === 0) {
      this.clearAllTimers(room);
      this.rooms.delete(roomId);
      console.log(`[RoomManager] Room ${roomId} deleted (empty).`);
    } else {
      this.broadcastRoomState(roomId);
    }
  }

  public getRoomState(roomId: string, requestingPlayerId?: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const artist = room.currentArtistId ? room.players.get(room.currentArtistId) : null;
    const isArtist = requestingPlayerId === room.currentArtistId;

    const remainingConnectedInRound = room.turnOrder
      .slice(room.currentTurnIndex + 1)
      .filter((id) => room.players.get(id)?.connected);

    const isLastTurnOfRound = remainingConnectedInRound.length === 0;
    const nextArtistId = !isLastTurnOfRound
      ? remainingConnectedInRound[0]
      : room.round < room.totalRounds
      ? room.turnOrder.find((id) => room.players.get(id)?.connected) || null
      : null;

    const nextArtist = nextArtistId ? room.players.get(nextArtistId) : null;

    // Word lengths calculation
    const wordLengths = room.currentMovie
      ? room.currentMovie.split(' ').map((w) => w.length)
      : [];

    // Strip private reconnectToken from public GameState
    const publicPlayers: Player[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      socketId: p.socketId,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      roundScore: p.roundScore,
      isHost: p.isHost,
      isArtist: p.isArtist,
      hasGuessed: p.hasGuessed,
      guessTime: p.guessTime,
      isReady: p.isReady,
      connected: p.connected,
      rank: p.rank,
    }));

    return {
      roomId: room.id,
      status: room.status,
      round: room.round,
      totalRounds: room.totalRounds,
      currentTurnIndex: room.currentTurnIndex,
      currentArtistId: room.currentArtistId,
      currentArtistName: artist?.nickname || null,
      currentArtistAvatar: artist?.avatar || null,
      nextArtistName: nextArtist?.nickname || null,
      isLastTurnOfRound,
      hint: isArtist && room.currentMovie ? room.currentMovie : room.hint,
      revealedIndices: room.revealedIndices,
      wordLengths,
      remainingTime: room.remainingTime,
      totalTime: room.totalTime,
      players: publicPlayers,
      settings: room.settings,
      revealedMovie:
        room.status === 'ROUND_END' || room.status === 'GAME_OVER'
          ? room.currentMovie || undefined
          : undefined,
      movieChoices:
        isArtist && room.status === 'CHOOSING_MOVIE' ? room.currentMovieChoices : undefined,
    };
  }

  public broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.forEach((player) => {
      if (player.connected) {
        const state = this.getRoomState(roomId, player.id);
        if (state) {
          this.io.to(player.socketId).emit('room_state', state);
        }
      }
    });
  }

  public getCanvasHistory(roomId: string): CanvasAction[] {
    return this.rooms.get(roomId)?.canvasHistory || [];
  }

  private broadcastChatMessage(
    roomId: string,
    player: Player,
    text: string,
    type: ChatMessage['type']
  ) {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: player.id,
      senderNickname: player.nickname,
      senderAvatar: player.avatar,
      text,
      type,
      timestamp: Date.now(),
    };
    this.io.to(roomId).emit('chat_message', msg);
  }

  private broadcastSystemMessage(roomId: string, text: string, type: ChatMessage['type']) {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
    };
    this.io.to(roomId).emit('chat_message', msg);
  }

  private clearAllTimers(room: Room) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.choiceTimeout) {
      clearTimeout(room.choiceTimeout);
      room.choiceTimeout = null;
    }
    if (room.roundEndTimeout) {
      clearTimeout(room.roundEndTimeout);
      room.roundEndTimeout = null;
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
