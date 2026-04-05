// components/GoogleAuthButton.tsx
"use client";

import { FcGoogle } from "react-icons/fc";

export default function GoogleAuthButton({ label = "Continue with Google" }: { label?: string }) {

  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/oauth/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        <FcGoogle className="h-5 w-5" /> Google
      </button>
  );
}