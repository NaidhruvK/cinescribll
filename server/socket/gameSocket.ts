import { Server as SocketIOServer, Socket } from 'socket.io';
import { AvatarId, DrawFill, DrawStroke, RoomSettings } from '../../src/types';
import { RoomManager } from '../game/roomManager';

export function setupGameSocket(io: SocketIOServer, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Create Room
    socket.on(
      'create_room',
      (
        data: { nickname: string; avatar: AvatarId; settings: RoomSettings },
        callback: (res: any) => void
      ) => {
        try {
          const { roomId, player } = roomManager.createRoom(
            socket.id,
            data.nickname,
            data.avatar,
            data.settings
          );
          socket.join(roomId);
          const gameState = roomManager.getRoomState(roomId, player.id);
          callback({ success: true, roomId, player, gameState });
        } catch (err: any) {
          callback({ success: false, error: err?.message || 'Failed to create room' });
        }
      }
    );

    // Join Room
    socket.on(
      'join_room',
      (
        data: { roomId: string; nickname: string; avatar: AvatarId; existingPlayerId?: string },
        callback: (res: any) => void
      ) => {
        try {
          const result = roomManager.joinRoom(
            data.roomId,
            socket.id,
            data.nickname,
            data.avatar,
            data.existingPlayerId
          );

          if (!result.success || !result.player || !result.room) {
            callback({ success: false, error: result.error || 'Failed to join room' });
            return;
          }

          socket.join(result.room.id);
          const gameState = roomManager.getRoomState(result.room.id, result.player.id);
          const canvasHistory = roomManager.getCanvasHistory(result.room.id);

          callback({ success: true, player: result.player, gameState });

          // Send current canvas drawing to joining player
          if (canvasHistory.length > 0) {
            socket.emit('canvas_history', canvasHistory);
          }
        } catch (err: any) {
          callback({ success: false, error: err?.message || 'Failed to join room' });
        }
      }
    );

    // Reconnect
    socket.on(
      'reconnect_player',
      (data: { roomId: string; playerId: string }, callback: (res: any) => void) => {
        try {
          const result = roomManager.joinRoom(
            data.roomId,
            socket.id,
            '',
            'hero',
            data.playerId
          );
          if (result.success && result.player && result.room) {
            socket.join(result.room.id);
            const gameState = roomManager.getRoomState(result.room.id, result.player.id);
            const canvasHistory = roomManager.getCanvasHistory(result.room.id);
            callback({ success: true, player: result.player, gameState });
            if (canvasHistory.length > 0) {
              socket.emit('canvas_history', canvasHistory);
            }
          } else {
            callback({ success: false, error: result.error || 'Session expired.' });
          }
        } catch (err: any) {
          callback({ success: false, error: 'Reconnection failed' });
        }
      }
    );

    // Profile updates
    socket.on('update_profile', (data: { nickname: string; avatar: AvatarId }) => {
      roomManager.updateProfile(socket.id, data.nickname, data.avatar);
    });

    // Settings update (host only)
    socket.on('update_settings', (settings: Partial<RoomSettings>) => {
      roomManager.updateSettings(socket.id, settings);
    });

    // Start Game (host only)
    socket.on('start_game', (callback: (res: any) => void) => {
      const res = roomManager.startGame(socket.id);
      if (callback) callback(res);
    });

    // Select Movie (artist only)
    socket.on('select_movie', (movie: string) => {
      roomManager.selectMovie(socket.id, movie);
    });

    // Drawing events
    socket.on('draw_stroke', (stroke: DrawStroke) => {
      roomManager.addCanvasStroke(socket.id, stroke);
    });

    socket.on('draw_fill', (fill: DrawFill) => {
      roomManager.addCanvasFill(socket.id, fill);
    });

    socket.on('clear_canvas', () => {
      roomManager.clearCanvas(socket.id);
    });

    socket.on('undo_stroke', () => {
      roomManager.undoStroke(socket.id);
    });

    // Guess submission / Chat
    socket.on('send_guess', (guess: string) => {
      roomManager.processGuess(socket.id, guess);
    });

    // Play again (host)
    socket.on('play_again', () => {
      roomManager.playAgain(socket.id);
    });

    // Leave room
    socket.on('leave_room', () => {
      roomManager.leaveRoom(socket.id);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      roomManager.handleDisconnect(socket.id);
    });
  });
}
