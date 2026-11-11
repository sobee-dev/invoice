// hooks/useShareSheet.ts
import { useEffect, useState } from "react";
import { prefersShareSheet } from "@/lib/shareFile";

export function useShareSheet(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(prefersShareSheet());
  }, []);
  return touch;
}