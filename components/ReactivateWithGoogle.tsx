// components/ReactivateWithGoogle.tsx
"use client";

import { useEffect, useState } from "react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { GOOGLE_OAUTH_KEYS } from "@/lib/googleOAuth";

export default function ReactivateWithGoogle({ scheduledFor }: { scheduledFor?: string }) {
  const [error, setError] = useState("");

  useEffect(() => {
    const flash = sessionStorage.getItem(GOOGLE_OAUTH_KEYS.flash);
    if (flash) {
      sessionStorage.removeItem(GOOGLE_OAUTH_KEYS.flash);
      setError(flash);
    }
  }, []);

  const date = scheduledFor ? new Date(scheduledFor) : null;
  const readableDate =
    date && !isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Restore your account</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">
          {readableDate
            ? `This account is scheduled to be permanently deleted on ${readableDate}.`
            : "This account is scheduled for deletion."}{" "}
          Continue with Google to restore it.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
          {error}
        </div>
      )}

      <GoogleAuthButton purpose="reactivate" label="Restore my account with Google" />
    </div>
  );
}