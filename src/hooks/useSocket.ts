import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
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
  Player,
  RoomSettings,
} from '../types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    const saved = localStorage.getItem('cinescribbl_player');
    return saved ? JSON.parse(saved) : null;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [movieChoices, setMovieChoices] = useState<string[]>([]);
  const [canvasActions, setCanvasActions] = useState<CanvasAction[]>([]);
  const [lastNotification, setLastNotification] = useState<{
    text: string;
    type: 'correct' | 'close' | 'system';
    timestamp: number;
  } | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Initialize socket
  useEffect(() => {
    const socket: Socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to CineScribbl server:', socket.id);
      setIsConnected(true);

      // Attempt auto-reconnect if session exists
      const savedRoomId = localStorage.getItem('cinescribbl_room_id');
      const savedPlayerId = localStorage.getItem('cinescribbl_player_id');
      const savedToken = localStorage.getItem('cinescribbl_reconnect_token') || undefined;

      if (savedRoomId && savedPlayerId) {
        socket.emit(
          'reconnect_player',
          { roomId: savedRoomId, playerId: savedPlayerId, reconnectToken: savedToken },
          (res: any) => {
            if (res.success && res.player && res.gameState) {
              setCurrentPlayer(res.player);
              setGameState(res.gameState);
              localStorage.setItem('cinescribbl_player', JSON.stringify(res.player));
              if (res.reconnectToken) {
                localStorage.setItem('cinescribbl_reconnect_token', res.reconnectToken);
              }
            } else {
              localStorage.removeItem('cinescribbl_room_id');
              localStorage.removeItem('cinescribbl_reconnect_token');
            }
          }
        );
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    socket.on('room_state', (state: GameState) => {
      setGameState(state);
      // Update currentPlayer reference if in state
      if (currentPlayer) {
        const found = state.players.find((p) => p.id === currentPlayer.id);
        if (found) {
          setCurrentPlayer(found);
          localStorage.setItem('cinescribbl_player', JSON.stringify(found));
        }
      }
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-100), msg]);
    });

    socket.on('movie_choices', (choices: string[]) => {
      setMovieChoices(choices);
    });

    socket.on('draw_stroke_end', (data: DrawStrokeEnd) => {
      if (data.stroke) {
        setCanvasActions((prev) => {
          // Avoid duplicate stroke if already in history
          if (prev.some((a) => a.type === 'stroke' && a.data.id === data.stroke.id)) {
            return prev;
          }
          return [...prev, { type: 'stroke', data: data.stroke }];
        });
      }
    });

    socket.on('draw_stroke', (stroke: DrawStroke) => {
      setCanvasActions((prev) => {
        if (prev.some((a) => a.type === 'stroke' && a.data.id === stroke.id)) {
          return prev;
        }
        return [...prev, { type: 'stroke', data: stroke }];
      });
    });

    socket.on('draw_fill', (fill: DrawFill) => {
      setCanvasActions((prev) => [...prev, { type: 'fill', data: fill }]);
    });

    socket.on('clear_canvas', () => {
      setCanvasActions([{ type: 'clear' }]);
    });

    socket.on('canvas_history', (history: CanvasAction[]) => {
      setCanvasActions(history);
    });

    socket.on('timer_tick', (data: { remainingTime: number; hint?: string }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          remainingTime: data.remainingTime,
          hint: data.hint !== undefined ? data.hint : prev.hint,
        };
      });
    });

    socket.on('correct_guess', (data: { playerId: string; nickname: string; pointsEarned: number }) => {
      setLastNotification({
        text: `🎉 Correct! You earned +${data.pointsEarned} points!`,
        type: 'correct',
        timestamp: Date.now(),
      });
    });

    socket.on('close_guess', (data: { text: string }) => {
      setLastNotification({
        text: data.text,
        type: 'close',
        timestamp: Date.now(),
      });
    });

    socket.on('round_started', () => {
      setCanvasActions([]);
      setMovieChoices([]);
    });

    socket.on('round_ended', () => {
      setMovieChoices([]);
    });

    socket.on('error_message', (msg: string) => {
      setErrorModal(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (
      nickname: string,
      avatar: AvatarId,
      settings: RoomSettings
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Socket not connected' });
          return;
        }

        socketRef.current.emit(
          'create_room',
          { nickname, avatar, settings },
          (res: any) => {
            if (res.success && res.roomId && res.player) {
              setCurrentPlayer(res.player);
              setGameState(res.gameState);
              setChatMessages([]);
              setCanvasActions([]);

              const token = res.reconnectToken || '';
              localStorage.setItem('cinescribbl_room_id', res.roomId);
              localStorage.setItem('cinescribbl_player_id', res.player.id);
              localStorage.setItem('cinescribbl_player', JSON.stringify(res.player));
              if (token) {
                localStorage.setItem('cinescribbl_reconnect_token', token);
                localStorage.setItem(
                  `cinescribbl_session_${res.roomId}`,
                  JSON.stringify({
                    playerId: res.player.id,
                    reconnectToken: token,
                    nickname: res.player.nickname,
                    avatar: res.player.avatar,
                  })
                );
              }
              resolve({ success: true });
            } else {
              resolve({ success: false, error: res.error || 'Failed to create room' });
            }
          }
        );
      });
    },
    []
  );

  const joinRoom = useCallback(
    (
      roomId: string,
      nickname: string,
      avatar: AvatarId
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          resolve({ success: false, error: 'Socket not connected' });
          return;
        }

        const cleanRoom = roomId.trim().toUpperCase();

        // Check for existing saved session for this room
        let existingPlayerId: string | undefined;
        let reconnectToken: string | undefined;

        try {
          const sessionRaw = localStorage.getItem(`cinescribbl_session_${cleanRoom}`);
          if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            if (session.playerId) {
              existingPlayerId = session.playerId;
              reconnectToken = session.reconnectToken;
            }
          }
        } catch (e) {}

        if (!existingPlayerId) {
          const savedRoom = localStorage.getItem('cinescribbl_room_id');
          if (savedRoom === cleanRoom) {
            existingPlayerId = localStorage.getItem('cinescribbl_player_id') || undefined;
            reconnectToken = localStorage.getItem('cinescribbl_reconnect_token') || undefined;
          }
        }

        socketRef.current.emit(
          'join_room',
          { roomId: cleanRoom, nickname, avatar, existingPlayerId, reconnectToken },
          (res: any) => {
            if (res.success && res.player && res.gameState) {
              setCurrentPlayer(res.player);
              setGameState(res.gameState);
              setChatMessages([]);
              setCanvasActions([]);

              const token = res.reconnectToken || reconnectToken || '';
              localStorage.setItem('cinescribbl_room_id', cleanRoom);
              localStorage.setItem('cinescribbl_player_id', res.player.id);
              localStorage.setItem('cinescribbl_player', JSON.stringify(res.player));
              if (token) {
                localStorage.setItem('cinescribbl_reconnect_token', token);
                localStorage.setItem(
                  `cinescribbl_session_${cleanRoom}`,
                  JSON.stringify({
                    playerId: res.player.id,
                    reconnectToken: token,
                    nickname: res.player.nickname,
                    avatar: res.player.avatar,
                  })
                );
              }
              resolve({ success: true });
            } else {
              resolve({ success: false, error: res.error || 'Failed to join room' });
            }
          }
        );
      });
    },
    []
  );

  const startGame = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }
      socketRef.current.emit('start_game', (res: any) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const selectMovie = useCallback((movie: string) => {
    if (socketRef.current) {
      socketRef.current.emit('select_movie', movie);
      setMovieChoices([]);
    }
  }, []);

  const sendStrokeStart = useCallback((data: DrawStrokeStart) => {
    if (socketRef.current) {
      socketRef.current.emit('draw_stroke_start', data);
    }
  }, []);

  const sendStrokeMove = useCallback((data: DrawStrokeMove) => {
    if (socketRef.current) {
      socketRef.current.emit('draw_stroke_move', data);
    }
  }, []);

  const sendStrokeEnd = useCallback((data: DrawStrokeEnd) => {
    if (socketRef.current) {
      if (data.stroke) {
        setCanvasActions((prev) => {
          if (prev.some((a) => a.type === 'stroke' && a.data.id === data.stroke.id)) {
            return prev;
          }
          return [...prev, { type: 'stroke', data: data.stroke }];
        });
      }
      socketRef.current.emit('draw_stroke_end', data);
    }
  }, []);

  const sendStroke = useCallback((stroke: DrawStroke) => {
    if (socketRef.current) {
      setCanvasActions((prev) => [...prev, { type: 'stroke', data: stroke }]);
      socketRef.current.emit('draw_stroke', stroke);
    }
  }, []);

  const sendFill = useCallback((fill: DrawFill) => {
    if (socketRef.current) {
      setCanvasActions((prev) => [...prev, { type: 'fill', data: fill }]);
      socketRef.current.emit('draw_fill', fill);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (socketRef.current) {
      setCanvasActions([{ type: 'clear' }]);
      socketRef.current.emit('clear_canvas');
    }
  }, []);

  const undoStroke = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('undo_stroke');
    }
  }, []);

  const sendGuess = useCallback((guess: string) => {
    if (socketRef.current && guess.trim()) {
      socketRef.current.emit('send_guess', guess.trim());
    }
  }, []);

  const updateProfile = useCallback((nickname: string, avatar: AvatarId) => {
    if (socketRef.current) {
      socketRef.current.emit('update_profile', { nickname, avatar });
      setCurrentPlayer((prev) => (prev ? { ...prev, nickname, avatar } : null));
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    if (socketRef.current) {
      socketRef.current.emit('update_settings', settings);
    }
  }, []);

  const playAgain = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('play_again');
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
    }
    // Remove auto-reconnect keys so player returns to welcome screen,
    // but the room-specific session cinescribbl_session_${roomId} remains in localStorage
    // so if they enter this room code again in Join Room, they can rejoin seamlessly!
    localStorage.removeItem('cinescribbl_room_id');
    localStorage.removeItem('cinescribbl_player_id');
    localStorage.removeItem('cinescribbl_reconnect_token');
    setGameState(null);
    setChatMessages([]);
    setCanvasActions([]);
    setMovieChoices([]);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    gameState,
    currentPlayer,
    chatMessages,
    movieChoices,
    canvasActions,
    lastNotification,
    errorModal,
    clearErrorModal: () => setErrorModal(null),
    createRoom,
    joinRoom,
    startGame,
    selectMovie,
    sendStrokeStart,
    sendStrokeMove,
    sendStrokeEnd,
    sendStroke,
    sendFill,
    clearCanvas,
    undoStroke,
    sendGuess,
    updateProfile,
    updateSettings,
    playAgain,
    leaveRoom,
  };
}
