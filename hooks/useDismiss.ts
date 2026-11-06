// hooks/useDismiss.ts
"use client";

import { RefObject, useEffect } from "react";

// Closes a popover when the user clicks outside it or presses Escape.
export function useDismiss(ref: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;

    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active, onDismiss]);
}