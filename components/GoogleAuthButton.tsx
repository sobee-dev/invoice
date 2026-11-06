// components/GoogleAuthButton.tsx
"use client";

import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthPurpose, startGoogleOAuth } from "@/lib/googleOAuth";

interface GoogleAuthButtonProps {
  label?: string;
  purpose?: GoogleOAuthPurpose;
  reason?: string;
  returnTo?: string;
  disabled?: boolean;
  tone?: "default" | "danger";
}

export default function GoogleAuthButton({
  label = "Continue with Google",
  purpose = "login",
  reason,
  returnTo,
  disabled = false,
  tone = "default",
}: GoogleAuthButtonProps) {
  const toneClasses =
    tone === "danger"
      ? "border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]"
      : "border-[#c5c6d0] text-[#1b1b1f] hover:bg-[#f5f3f8]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => startGoogleOAuth({ purpose, reason, returnTo })}
      className={`w-full flex items-center justify-center gap-2 p-3 border rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${toneClasses}`}
    >
      <FcGoogle className="h-5 w-5" /> {label === "Continue with Google" ? "Google" : label}
    </button>
  );
}