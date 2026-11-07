// components/settings/SignatureField.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { inputCls } from "./ui";
import { SignaturePad } from "../SignaturePad";


export type SignatureType = "none" | "text" | "image";

interface Props {
  type: SignatureType;
  text: string;
  url: string;
  uploading: boolean;
  onTypeChange: (t: SignatureType) => void;
  onTextChange: (t: string) => void;
  onDrawn: (png: Blob) => void;
  onRemoveImage: () => void;
}

const OPTIONS: { key: SignatureType; label: string }[] = [
  { key: "none", label: "None" },
  { key: "text", label: "Typed" },
  { key: "image", label: "Drawn" },
];

export function SignatureField({ type, text, url, uploading, onTypeChange, onTextChange, onDrawn, onRemoveImage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [inked, setInked] = useState(false);
  const [redrawing, setRedrawing] = useState(false);

  const showPad = type === "image" && (!url || redrawing);

  // Reset the pad whenever it appears.
  useEffect(() => {
    if (showPad) setInked(false);
  }, [showPad]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  const PEN_COLOR = "#1a3fa8";

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    canvasRef.current!.setPointerCapture(e.pointerId);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = PEN_COLOR;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setInked(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setInked(false);
  };

  const save = () => {
    // PNG keeps transparency, since the signature renders over invoice content.
    canvasRef.current!.toBlob((blob) => {
      if (blob) {
        onDrawn(blob);
        setRedrawing(false);
      }
    }, "image/png");
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Signature type" className="mb-4 inline-flex rounded-lg bg-surface-container p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={type === o.key}
            onClick={() => onTypeChange(o.key)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              type === o.key ? "bg-white font-semibold text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {type === "none" && <p className="text-sm text-on-surface-variant">Invoices will show an empty signature line.</p>}

      {type === "text" && (
        <div>
          <input
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type your name"
            maxLength={60}
            className={inputCls}
          />
          {text && <p className="mt-3 font-serif text-3xl italic text-on-surface">{text}</p>}
        </div>
      )}

      {type === "image" && !showPad && (
        <div className="flex items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Your signature" className="h-20 max-w-[240px] rounded-lg border border-outline-variant bg-white object-contain p-2" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRedrawing(true)} className="h-9 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low">
              Redraw
            </button>
            <button type="button" onClick={onRemoveImage} className="h-9 rounded-lg px-3 text-sm font-semibold text-error hover:bg-error-container">
              Remove
            </button>
          </div>
        </div>
      )}

     {showPad && (
        <SignaturePad
            uploading={uploading}
            onSave={(blob) => { onDrawn(blob); setRedrawing(false); }}
            onCancel={redrawing ? () => setRedrawing(false) : undefined}
        />
      )}
    </div>
  );
}