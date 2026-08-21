import {
  Brush,
  Eraser,
  Paintbrush,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasAction, DrawPoint, DrawStroke } from '../types';

interface DrawingCanvasProps {
  isArtist: boolean;
  canvasActions: CanvasAction[];
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
  canvasActions,
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
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<DrawPoint[]>([]);

  // Internal logical resolution
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 520;

  // Redraw all canvas history onto the 2D context
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply each action
    canvasActions.forEach((action) => {
      if (action.type === 'clear') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (action.type === 'stroke') {
        const stroke = action.data;
        if (!stroke.points || stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const startX = stroke.points[0].x * canvas.width;
        const startY = stroke.points[0].y * canvas.height;
        ctx.moveTo(startX, startY);

        if (stroke.points.length === 1) {
          ctx.lineTo(startX + 0.1, startY + 0.1);
        } else {
          for (let i = 1; i < stroke.points.length; i++) {
            const px = stroke.points[i].x * canvas.width;
            const py = stroke.points[i].y * canvas.height;
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    });
  }, [canvasActions]);

  // Handle ResizeObserver for responsive display
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set internal pixel buffer
      canvas.width = LOGICAL_WIDTH * dpr;
      canvas.height = LOGICAL_HEIGHT * dpr;

      // Scale context to match logical resolution
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawCanvas();
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    observer.observe(container);
    handleResize();

    return () => {
      observer.disconnect();
    };
  }, [redrawCanvas]);

  // Redraw when actions change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get normalized coordinate from PointerEvent
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

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    currentPointsRef.current = [pt];

    // Live preview single dot
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = isEraser ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT);
      ctx.lineTo(pt.x * LOGICAL_WIDTH + 0.1, pt.y * LOGICAL_HEIGHT + 0.1);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isArtist || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pt = getNormalizedPoint(e);
    const points = currentPointsRef.current;
    const prevPt = points[points.length - 1];

    points.push(pt);

    // Live render segment
    const ctx = canvas.getContext('2d');
    if (ctx && prevPt) {
      ctx.strokeStyle = isEraser ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prevPt.x * LOGICAL_WIDTH, prevPt.y * LOGICAL_HEIGHT);
      ctx.lineTo(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isArtist || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const newStroke: DrawStroke = {
        id: `stroke_${Date.now()}_${Math.random()}`,
        points: [...currentPointsRef.current],
        color,
        size: brushSize,
        isEraser,
      };
      onSendStroke(newStroke);
      currentPointsRef.current = [];
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[800/520] bg-white rounded-2xl sm:rounded-3xl border-4 border-[#2c2438] overflow-hidden shadow-2xl touch-none select-none"
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`block w-full h-full ${
            isArtist ? (isEraser ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-default'
          }`}
        />

        {/* Guesser watermark when not artist */}
        {!isArtist && (
          <div className="absolute bottom-2 right-3 pointer-events-none opacity-40 text-[11px] font-bold text-gray-800 tracking-wider">
            CineScribbl Canvas
          </div>
        )}
      </div>

      {/* Artist Tools Bar */}
      {isArtist ? (
        <div className="rounded-2xl bg-[#1a1424] border border-red-900/40 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
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
                  style={{ width: `${Math.min(18, b.size + 4)}px`, height: `${Math.min(18, b.size + 4)}px` }}
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
                className={`w-6 h-6 rounded-full border transition-transform ${
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
              className="p-2 rounded-xl bg-[#120e18] border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              title="Undo last stroke"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-tool-clear"
              type="button"
              onClick={() => {
                if (window.confirm('Clear the entire drawing canvas?')) {
                  onClearCanvas();
                }
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-2 px-4 rounded-xl bg-[#16121f] border border-gray-800/60 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <Paintbrush className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Watch the canvas carefully and type your Telugu movie guess in the chat!</span>
        </div>
      )}
    </div>
  );
};
