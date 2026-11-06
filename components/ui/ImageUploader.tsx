// components/ui/ImageUploader.tsx
"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { btnOutline } from "@/components/ui/buttonStyles";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/imageUpload";

interface ImageUploaderProps {
  imageUrl: string;       // a saved URL or a local preview
  busy?: boolean;         // an upload is running
  disabled?: boolean;
  error?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function ImageUploader({ imageUrl, busy = false, disabled = false, error, onSelect, onRemove }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const locked = busy || disabled;

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(file);
    // Clearing the input lets the same file be chosen again after a removal.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!locked) pick(e.dataTransfer.files);
        }}
        className={`relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 sm:w-40 ${
          imageUrl ? "border-solid" : "border-dashed"
        } ${dragging ? "border-primary-container bg-primary-fixed" : "border-outline-variant bg-surface"}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={locked}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
          >
            <Icon name="add_photo_alternate" size={32} />
            <span className="text-xs font-semibold">Add image</span>
          </button>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Icon name="progress_activity" size={28} className="animate-spin text-primary" />
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={locked} className={btnOutline}>
            {imageUrl ? "Replace image" : "Upload image"}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={locked}
              className="h-10 rounded-lg px-3 text-sm font-semibold text-error hover:bg-error-container disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-on-surface-variant">JPG, PNG or WebP, up to 3 MB. Drop a file onto the box, or choose one.</p>
        {error && (
          <p role="alert" className="text-xs font-semibold text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
