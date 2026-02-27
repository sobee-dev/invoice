"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/axios";
import { db } from "@/lib/db";
import { IUser } from "@/lib/types";

export default function OAuthCallback() {
  useEffect(() => {
    const finalizeLogin = async () => {
      try {
        // Fetch the authenticated user from your backend
        const data = await apiFetch("/api/users/me/"); // Reads cookie

        // Save user in IndexedDB for offline use
        
        const user: IUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        };
        
        
        await db.users.put(data.user);

        // Full reload to dashboard (fresh auth boundary)
        window.location.href = "/dashboard";
      } catch {
        // If something fails, fallback to login page
        window.location.href = "/login";
      }
    };

    finalizeLogin();
  }, []);

  return <p>Signing you in…</p>;
}
