// app/oauth/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error || !code) {
        router.replace("/login?error=oauth_cancelled");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ← sends/receives cookies
            body: JSON.stringify({ code }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Authentication failed.");
        }

        // Store tokens in localStorage (matches your existing auth pattern)
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        // New users go to onboarding, existing users go to dashboard
        if (data.user.isNew) {
          router.replace("/onboarding");
        } else {
          router.replace("/dashboard");
        }

      } catch (err: any) {
        console.error("OAuth error:", err);
        router.replace(`/login?error=${encodeURIComponent(err.message)}`);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Signing you in with Google...
      </p>
    </div>
  );
}