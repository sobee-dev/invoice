// components/docs/InvoicePreview.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_WIDTH = 794;  // A4 at 96 dpi
const MIN_HEIGHT = 1123;

export function InvoicePreview({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(MIN_HEIGHT);

  // Shrink the sheet to fit the space it is given, never enlarge it.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A new template starts from a full sheet again, so the frame can shrink back.
  useEffect(() => {
    setHeight(MIN_HEIGHT);
  }, [html]);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    setHeight(Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0, MIN_HEIGHT));
  }, []);

  const handleLoad = useCallback(() => {
    measure();
    // Logos and signatures finish after the page does and change its height.
    const doc = frameRef.current?.contentDocument;
    doc?.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", measure, { once: true });
      img.addEventListener("error", measure, { once: true });
    });
  }, [measure]);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-lg bg-white shadow-card ring-1 ring-outline-variant"
        style={{ width: PAGE_WIDTH * scale, height: height * scale }}
      >
        <iframe
          ref={frameRef}
          title="Document preview"
          srcDoc={html}
          sandbox="allow-same-origin"
          onLoad={handleLoad}
          style={{
            width: PAGE_WIDTH,
            height,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}