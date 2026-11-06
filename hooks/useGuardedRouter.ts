// hooks/useGuardedRouter.ts
"use client";

import { useRouter } from "next/navigation";

// The subscription lock is gone, so this is now just useRouter().
// Swap each caller to useRouter() and delete this file.
export function useGuardedRouter() {
  return useRouter();
}