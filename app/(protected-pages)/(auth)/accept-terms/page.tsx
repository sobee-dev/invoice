"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clearSignupToken, readSignupToken } from "@/lib/termsConsent";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { ROUTES } from "@/lib/routes";

const BLOCKING_CODES = ["suspended", "disabled", "business_suspended"];

export default function AcceptTermsPage() {
  const router = useRouter();
  const { completeGoogleSignup } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSignupToken();
    if (saved) setToken(saved);
    else router.replace(ROUTES.login); // opened directly, nothing to finish
  }, [router]);

  const handleContinue = async () => {
    if (!token || !agreed || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeGoogleSignup(token);
      clearSignupToken();
      // The entry page sends a new owner to onboarding.
      router.replace(ROUTES.entry);
    } catch (err: any) {
      setBusy(false);
      const code = err?.response?.data?.code;
      if (code === "signup_expired") {
        clearSignupToken();
        router.replace(`${ROUTES.login}?error=oauth_failed`);
        return;
      }
      if (BLOCKING_CODES.includes(code)) {
        clearSignupToken();
        router.replace(`${ROUTES.login}?error=${code}`);
        return;
      }
      setError(getApiErrorMessage(err, "Could not create your account. Please try again."));
    }
  };

  if (!token) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">One last step</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">
          Accept our terms to finish creating your account.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
          {error}
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          disabled={busy}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c5c6d0] accent-[#1b2e5e]"
        />
        <span className="text-sm text-[#45464f] leading-snug">
          I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b2e5e] hover:underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b2e5e] hover:underline">Privacy Policy</Link>.
        </span>
      </label>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!agreed || busy}
        className="w-full h-12 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
      </button>

      <p className="text-center text-sm text-[#45464f]">
        <Link href={ROUTES.login} className="font-semibold text-[#1b2e5e] hover:underline">
          Cancel
        </Link>
      </p>
    </div>
  );
}