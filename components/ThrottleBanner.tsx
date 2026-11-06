// components/ThrottleBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function ThrottleBanner() {
  const { throttledUntil } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!throttledUntil) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [throttledUntil]);

  if (!throttledUntil || now >= throttledUntil) return null;

  const seconds = Math.ceil((throttledUntil - now) / 1000);

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-50 bg-[#fece65] text-[#755700] text-sm font-semibold text-center py-2 px-4"
    >
      Too many requests. Please wait {seconds}s before trying again.
    </div>
  );
}