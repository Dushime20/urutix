import { useCallback, useEffect, useRef, useState } from 'react';
import { PenTool, RotateCcw } from 'lucide-react';
import { TranslatedText } from '../translated-text';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  error?: string;
}

type Point = { x: number; y: number; pressure: number };

function pointFromEvent(event: PointerEvent | React.PointerEvent, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure > 0 ? event.pressure : 0.5,
  };
}

function strokeWidth(point: Point, pointerType: string) {
  if (pointerType === 'pen') return 1.2 + point.pressure * 3.4;
  return 2.35;
}

function exportSignature(source: HTMLCanvasElement) {
  const width = Math.max(1, Math.round(source.clientWidth));
  const height = Math.max(1, Math.round(source.clientHeight));
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = output.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return output.toDataURL('image/jpeg', 0.78);
}

export function SignaturePad({ value, onChange, error }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const valueRef = useRef(value);
  const [hasStroke, setHasStroke] = useState(Boolean(value));

  useEffect(() => {
    valueRef.current = value;
    setHasStroke(Boolean(value));
  }, [value]);

  const configureContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    return ctx;
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    if (width < 2 || height < 2) return;

    const previous = canvas.width > 0 ? canvas.toDataURL() : '';
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = configureContext(canvas);
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const stored = valueRef.current;
    const restoreFrom = stored && stored.startsWith('data:image/') ? stored : previous;
    if (restoreFrom && restoreFrom.length > 80) {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, width, height);
      image.src = restoreFrom;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  const emitChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(exportSignature(canvas));
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas ? configureContext(canvas) : null;
    if (!canvas || !ctx) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = pointFromEvent(event, canvas);
    lastPointRef.current = point;
    ctx.beginPath();
    ctx.arc(point.x, point.y, strokeWidth(point, event.pointerType) / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasStroke(true);
  };

  const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas ? configureContext(canvas) : null;
    const from = lastPointRef.current;
    if (!canvas || !ctx || !from) return;
    event.preventDefault();

    const native = event.nativeEvent;
    const coalesced =
      typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [native];

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    let next = from;
    for (const pointer of coalesced) {
      next = pointFromEvent(pointer, canvas);
      ctx.lineWidth = strokeWidth(next, event.pointerType);
      ctx.lineTo(next.x, next.y);
    }
    ctx.stroke();
    lastPointRef.current = next;
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    emitChange();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    configureContext(canvas);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawingRef.current = false;
    lastPointRef.current = null;
    setHasStroke(false);
    onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <TranslatedText text="Draw your signature" />
        </p>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <TranslatedText text="Clear" />
        </button>
      </div>
      <div
        ref={wrapperRef}
        className={`relative h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed transition-colors ${
          error
            ? 'border-red-300'
            : hasStroke
              ? 'border-primary-200'
              : 'border-slate-200 hover:border-primary-300'
        }`}
      >
        <div className="pointer-events-none absolute left-6 right-6 bottom-7 border-b border-slate-200" />
        <canvas
          ref={canvasRef}
          onPointerDown={startStroke}
          onPointerMove={continueStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
        {!hasStroke && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
            <PenTool className="w-6 h-6 text-slate-300" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.22em]">
              <TranslatedText text="Sign here with mouse, finger, or stylus" />
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1">{error}</p>
      )}
    </div>
  );
}
