import {
  Brush,
  Eraser,
  Film,
  Paintbrush,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  CanvasAction,
  DrawPoint,
  DrawStroke,
  DrawStrokeEnd,
  DrawStrokeMove,
  DrawStrokeStart,
  GameStatus,
} from '../types';

interface DrawingCanvasProps {
  isArtist: boolean;
  status?: GameStatus;
  currentArtistName?: string | null;
  canvasActions: CanvasAction[];
  socket?: Socket | null;
  onSendStrokeStart?: (data: DrawStrokeStart) => void;
  onSendStrokeMove?: (data: DrawStrokeMove) => void;
  onSendStrokeEnd?: (data: DrawStrokeEnd) => void;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onUndoStroke: () => void;
}

const PALETTE = [
  '#000000', // Black
  '#ffffff', // White
  '#e50914', // Cine Red
  '#991b1b', // Deep Maroon
  '#ea580c', // Orange
  '#f59e0b', // Amber Gold
  '#eab308', // Yellow
  '#16a34a', // Emerald Green
  '#10b981', // Mint Teal
  '#0284c7', // Sky Blue
  '#2563eb', // Royal Blue
  '#7c3aed', // Purple
  '#db2777', // Hot Pink
  '#78350f', // Brown
  '#475569', // Slate Gray
  '#94a3b8', // Light Gray
];

const BRUSH_SIZES = [
  { size: 4, label: 'Fine' },
  { size: 8, label: 'Medium' },
  { size: 16, label: 'Thick' },
  { size: 28, label: 'Heavy' },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isArtist,
  status,
  currentArtistName,
  canvasActions,
  socket,
  onSendStrokeStart,
  onSendStrokeMove,
  onSendStrokeEnd,
  onSendStroke,
  onClearCanvas,
  onUndoStroke,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drawing state for artist
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  // Active stroke tracking
  const currentStrokeIdRef = useRef<string | null>(null);
  const currentPointsRef = useRef<DrawPoint[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastEmittedPointRef = useRef<DrawPoint | null>(null);

  // Logical coordinate system resolution
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 520;

  const canvasActionsRef = useRef<CanvasAction[]>(canvasActions);
  canvasActionsRef.current = canvasActions;

  // Redraw complete canvas history onto the 2D context using logical coordinate system
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Render all actions in order
    canvasActionsRef.current.forEach((action) => {
      if (action.type === 'clear') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      } else if (action.type === 'stroke') {
        const stroke = action.data;
        if (!stroke.points || stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
        ctx.fillStyle = stroke.isEraser ? '#ffffff' : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.points.length === 1) {
          const p = stroke.points[0];
          ctx.beginPath();
          ctx.arc(p.x * LOGICAL_WIDTH, p.y * LOGICAL_HEIGHT, stroke.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          const startX = stroke.points[0].x * LOGICAL_WIDTH;
          const startY = stroke.points[0].y * LOGICAL_HEIGHT;
          ctx.moveTo(startX, startY);

          for (let i = 1; i < stroke.points.length; i++) {
            const px = stroke.points[i].x * LOGICAL_WIDTH;
            const py = stroke.points[i].y * LOGICAL_HEIGHT;
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }
    });
  }, [LOGICAL_WIDTH, LOGICAL_HEIGHT]);

  // Handle ResizeObserver for responsive display & high-DPI scaling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const setupCanvasResolution = () => {
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.round(LOGICAL_WIDTH * dpr);
      const targetHeight = Math.round(LOGICAL_HEIGHT * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      redrawCanvas();
    };

    const resizeObserver = new ResizeObserver(() => {
      setupCanvasResolution();
    });

    resizeObserver.observe(container);
    setupCanvasResolution();

    return () => {
      resizeObserver.disconnect();
    };
  }, [redrawCanvas, LOGICAL_WIDTH, LOGICAL_HEIGHT]);

  // Redraw when actions history changes (new stroke committed, undo, clear, late join)
  useEffect(() => {
    redrawCanvas();
  }, [canvasActions, redrawCanvas]);

  // Real-time live remote drawing stream listener
  useEffect(() => {
    if (!socket) return;

    // Track active streaming strokes for non-artists
    const activeRemoteStrokes = new Map<
      string,
      { lastPoint: DrawPoint; color: string; size: number; isEraser: boolean }
    >();

    const handleRemoteStart = (data: DrawStrokeStart) => {
      if (isArtist) return; // Artist already draws locally

      activeRemoteStrokes.set(data.strokeId, {
        lastPoint: data.point,
        color: data.color,
        size: data.size,
        isEraser: data.isEraser,
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.fillStyle = data.isEraser ? '#ffffff' : data.color;
      ctx.beginPath();
      ctx.arc(
        data.point.x * LOGICAL_WIDTH,
        data.point.y * LOGICAL_HEIGHT,
        data.size / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const handleRemoteMove = (data: DrawStrokeMove) => {
      if (isArtist) return;

      const active = activeRemoteStrokes.get(data.strokeId);
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = active.isEraser ? '#ffffff' : active.color;
      ctx.lineWidth = active.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(active.lastPoint.x * LOGICAL_WIDTH, active.lastPoint.y * LOGICAL_HEIGHT);

      data.points.forEach((pt) => {
        ctx.lineTo(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT);
        active.lastPoint = pt;
      });

      ctx.stroke();
    };

    const handleRemoteEnd = (data: DrawStrokeEnd) => {
      activeRemoteStrokes.delete(data.strokeId);
    };

    socket.on('draw_stroke_start', handleRemoteStart);
    socket.on('draw_stroke_move', handleRemoteMove);
    socket.on('draw_stroke_end', handleRemoteEnd);

    return () => {
      socket.off('draw_stroke_start', handleRemoteStart);
      socket.off('draw_stroke_move', handleRemoteMove);
      socket.off('draw_stroke_end', handleRemoteEnd);
    };
  }, [socket, isArtist, LOGICAL_WIDTH, LOGICAL_HEIGHT]);

  // Convert PointerEvent coordinate into normalized [0, 1] logical coordinate
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, clientY / rect.height));

    return { x: normX, y: normY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isArtist) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    const strokeId = `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    currentStrokeIdRef.current = strokeId;
    currentPointsRef.current = [pt];
    lastEmittedPointRef.current = pt;

    // Draw single dot locally immediately
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.fillStyle = isEraser ? '#ffffff' : color;
      ctx.beginPath();
      ctx.arc(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Emit live stroke start to room
    if (onSendStrokeStart) {
      onSendStrokeStart({
        strokeId,
        point: pt,
        color,
        size: brushSize,
        isEraser,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isArtist || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pt = getNormalizedPoint(e);
    const prevPt = lastEmittedPointRef.current;

    if (!prevPt) {
      lastEmittedPointRef.current = pt;
      return;
    }

    // Skip redundant micro-movements
    if (Math.abs(pt.x - prevPt.x) < 0.0005 && Math.abs(pt.y - prevPt.y) < 0.0005) {
      return;
    }

    currentPointsRef.current.push(pt);

    // Draw segment locally immediately
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = isEraser ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(prevPt.x * LOGICAL_WIDTH, prevPt.y * LOGICAL_HEIGHT);
      ctx.lineTo(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT);
      ctx.stroke();
    }

    // Emit live stroke segment to room
    if (onSendStrokeMove && currentStrokeIdRef.current) {
      onSendStrokeMove({
        strokeId: currentStrokeIdRef.current,
        points: [pt],
      });
    }

    lastEmittedPointRef.current = pt;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isArtist || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    const strokeId = currentStrokeIdRef.current;
    const points = [...currentPointsRef.current];

    if (strokeId && points.length > 0) {
      const completeStroke: DrawStroke = {
        id: strokeId,
        points,
        color,
        size: brushSize,
        isEraser,
      };

      if (onSendStrokeEnd) {
        onSendStrokeEnd({ strokeId, stroke: completeStroke });
      } else {
        onSendStroke(completeStroke);
      }
    }

    currentStrokeIdRef.current = null;
    currentPointsRef.current = [];
    lastEmittedPointRef.current = null;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Canvas Dedicated Fixed Aspect Ratio Container */}
      <div
        ref={containerRef}
        id="cinescribbl-whiteboard-container"
        className="relative w-full aspect-[800/520] bg-white rounded-2xl sm:rounded-3xl border-4 border-[#2c2438] overflow-hidden shadow-2xl touch-none select-none box-border flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          id="cinescribbl-whiteboard-canvas"
          style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`block w-full h-full ${
            isArtist ? (isEraser ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-default'
          }`}
        />

        {/* Guesser watermark when not artist */}
        {!isArtist && (
          <div className="absolute bottom-2 right-3 pointer-events-none opacity-40 text-[11px] font-bold text-gray-800 tracking-wider select-none">
            CineScribbl Canvas
          </div>
        )}
      </div>

      {/* Artist Tools Bar */}
      {isArtist ? (
        <div
          id="cinescribbl-drawing-toolbar"
          className="rounded-2xl bg-[#1a1424] border border-red-900/40 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3"
        >
          {/* Tool Modes (Brush vs Eraser) */}
          <div className="flex items-center gap-1.5 bg-[#120e18] p-1 rounded-xl border border-gray-800">
            <button
              id="btn-tool-brush"
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${
                !isEraser
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Brush Tool"
            >
              <Brush className="w-4 h-4" />
              <span className="hidden sm:inline">Brush</span>
            </button>

            <button
              id="btn-tool-eraser"
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${
                isEraser
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-[#120e18] p-1 rounded-xl border border-gray-800">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                type="button"
                onClick={() => setBrushSize(b.size)}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                  brushSize === b.size
                    ? 'bg-red-950/80 border border-red-500 text-red-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={`${b.label} (${b.size}px)`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: `${Math.min(18, b.size + 4)}px`,
                    height: `${Math.min(18, b.size + 4)}px`,
                  }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-[#120e18] p-1.5 rounded-xl border border-gray-800 max-w-full overflow-x-auto">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                  color === c && !isEraser
                    ? 'scale-125 border-white ring-2 ring-red-500 shadow-md'
                    : 'border-black/40 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          {/* Undo and Clear Canvas */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-tool-undo"
              type="button"
              onClick={onUndoStroke}
              className="p-2 rounded-xl bg-[#120e18] border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Undo last stroke"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-tool-clear"
              type="button"
              onClick={onClearCanvas}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          id="cinescribbl-guesser-notice"
          className="py-2.5 px-4 rounded-xl bg-[#16121f] border border-gray-800/60 text-center text-xs text-gray-400 flex items-center justify-center gap-2"
        >
          {status === 'CHOOSING_MOVIE' ? (
            <>
              <Film className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300 font-medium">
                🎬 {currentArtistName || 'Artist'} is choosing a Telugu movie...
              </span>
            </>
          ) : (
            <>
              <Paintbrush className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Watch the canvas carefully and type your Telugu movie guess in the chat!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
