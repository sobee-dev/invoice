// app/oauth/callback/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService, termsRequiredToken } from "@/services/auth";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { GOOGLE_OAUTH_KEYS as KEYS, GoogleOAuthPurpose } from "@/lib/googleOAuth";
import { ROUTES } from "@/lib/routes";
import { stashSignupToken } from "@/lib/termsConsent";

// Only these backend codes are passed on to the login page. Anything else
// becomes a generic message, so the URL can never carry arbitrary text.
const PASSTHROUGH_CODES = new Set(["suspended", "business_suspended", "disabled"]);

const PURPOSES: GoogleOAuthPurpose[] = ["login", "delete_account", "reactivate"];

// The return path was saved by our own code, but never redirect anywhere
// that is not a plain path on this site.
function safeReturnPath(raw: string | null, fallback: string): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export default function OAuthCallback() {
  const router = useRouter();
  const { user, isLoading: authLoading, loginWithGoogle, logout, refreshUser } = useAuth();
  // A Google authorization code works exactly once, and StrictMode runs
  // effects twice in development, so guard the exchange.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const storedPurpose = sessionStorage.getItem(KEYS.purpose) as GoogleOAuthPurpose | null;
    const purpose: GoogleOAuthPurpose =
      storedPurpose && PURPOSES.includes(storedPurpose) ? storedPurpose : "login";

    // Deleting an account needs the signed in session restored first.
    if (purpose === "delete_account" && authLoading) return;

    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");

    const expectedState = sessionStorage.getItem(KEYS.state);
    const reason = sessionStorage.getItem(KEYS.reason) ?? "";
    const returnTo = safeReturnPath(sessionStorage.getItem(KEYS.returnTo), ROUTES.login);
    [KEYS.state, KEYS.purpose, KEYS.reason, KEYS.returnTo].forEach((key) =>
      sessionStorage.removeItem(key)
    );

    // Delete and restore report back to the page that started them.
    const flashAndReturn = (message: string) => {
      sessionStorage.setItem(KEYS.flash, message);
      router.replace(returnTo);
    };

    const run = async () => {
      if (error || !code) {
        if (purpose === "login") {
          router.replace(`${ROUTES.login}?error=oauth_cancelled`);
        } else {
          flashAndReturn("Google confirmation was cancelled.");
        }
        return;
      }

      if (!state || !expectedState || state !== expectedState) {
        if (purpose === "login") {
          router.replace(`${ROUTES.login}?error=oauth_state_mismatch`);
        } else {
          flashAndReturn("We could not verify that Google sign-in. Please try again.");
        }
        return;
      }

      if (purpose === "delete_account") {
        if (!user) {
          router.replace(ROUTES.login);
          return;
        }
        try {
          await authService.requestAccountDeletionWithGoogle(code, reason);
          await logout();
          router.replace(`${ROUTES.login}?notice=deletion_scheduled`);
        } catch (err: any) {
          flashAndReturn(getApiErrorMessage(err, "Could not schedule account deletion."));
        }
        return;
      }

      if (purpose === "reactivate") {
        try {
          await authService.cancelAccountDeletionWithGoogle(code);
          await refreshUser();
          router.replace(ROUTES.entry);
        } catch (err: any) {
          flashAndReturn(getApiErrorMessage(err, "Could not restore your account."));
        }
        return;
      }

      try {
        await loginWithGoogle(code);
        // The entry page sends a new owner to onboarding, a returning owner
        // or staff member to their own home, and handles a forced password change.
        router.replace(ROUTES.entry);
      } catch (err: any) {
        const signupToken = termsRequiredToken(err);
        if (signupToken) {
          stashSignupToken(signupToken);
          router.replace("/accept-terms");
          return;
        }
        console.error("OAuth error:", err);
        const body = err?.response?.data;

        if (body?.code === "pending_deletion") {
          const query = new URLSearchParams({
            method: "google",
            scheduledFor: body.deletionScheduledFor ?? "",
          });
          router.replace(`${ROUTES.reactivateAccount}?${query.toString()}`);
          return;
        }

        const errorCode = PASSTHROUGH_CODES.has(body?.code) ? body.code : "oauth_failed";
        router.replace(`${ROUTES.login}?error=${errorCode}`);
      }
    };

    run();
  }, [authLoading, user, router, loginWithGoogle, logout, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fbf8fd]">
      <div className="w-10 h-10 rounded-full border-4 border-[#1b2e5e] border-t-transparent animate-spin" />
      <p className="text-sm text-[#757680]">One moment, finishing up with Google...</p>
    </div>
  );
}