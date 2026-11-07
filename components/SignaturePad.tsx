"use client";

import { useRef, useState } from "react";

const PEN_COLOR = "#1a3fa8";
const PAD = 8; // transparent margin around the trimmed signature

function trimCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d")!;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return src;
  const x0 = Math.max(0, minX - PAD);
  const y0 = Math.max(0, minY - PAD);
  const w = Math.min(width, maxX + PAD) - x0;
  const h = Math.min(height, maxY + PAD) - y0;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  return out;
}

interface Props {
  uploading: boolean;
  onSave: (png: Blob) => void;
  onCancel?: () => void;
}

export function SignaturePad({ uploading, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [inked, setInked] = useState(false);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    canvasRef.current!.setPointerCapture(e.pointerId);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = PEN_COLOR;
    const p = point(e);
    last.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y); // smooths the line
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    last.current = p;
    setInked(true);
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setInked(false);
  };

  const save = () => {
    trimCanvas(canvasRef.current!).toBlob((blob) => { if (blob) onSave(blob); }, "image/png");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-40 w-full touch-none cursor-crosshair rounded-lg border border-dashed border-outline bg-white"
        aria-label="Draw your signature here"
      />
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={save} disabled={!inked || uploading}
          className="h-9 rounded-lg bg-primary-container px-4 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50">
          {uploading ? "Uploading..." : "Use this signature"}
        </button>
        <button type="button" onClick={clear} disabled={!inked}
          className="h-9 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50">
          Clear
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-9 px-3 text-sm font-semibold text-on-surface-variant">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}