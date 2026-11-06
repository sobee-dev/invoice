"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Loader from "@/components/Loader";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { isValidPasscode, sanitizePasscode, PASSCODE_LENGTH } from "@/lib/passcode";
import { ROUTES } from "@/lib/routes";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  // Same rule as the login page. Once register() sets the user, or when a
  // signed in person opens this page, the entry page decides where they go.
  // A new owner has no business yet, so that lands on onboarding.
  useEffect(() => {
    if (!authLoading && user) router.replace(ROUTES.entry);
  }, [authLoading, user, router]);

  useEffect(() => {
    // Earlier versions of the web app kept tokens in localStorage. They are
    // no longer used, so clear any that are still sitting in the browser.
    ["token", "refreshToken", "refresh_token"].forEach((key) =>
      window.localStorage.removeItem(key)
    );
  }, []);

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && agreed && !isSubmitting;

  const validateForm = (): boolean => {
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!isValidPasscode(password)) {
      setError(`Password must be exactly ${PASSCODE_LENGTH} digits.`);
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      // AuthContext starts the session: the access token goes in memory and
      // Django sets the httpOnly refresh cookie on this response. The effect
      // above handles the redirect once the user is set.
      await register({
        email: email.trim().toLowerCase(),
        password,
        acceptedTerms: true, // the server rejects registration without it
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setError(getApiErrorMessage(err, "Registration failed. Please try again."));
    }
  };

  // Restoring a session, or signed in and about to be redirected.
  if (authLoading || user) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Create Account</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">
          Start managing your business finances with ease and efficiency.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        {error && (
          <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="pl-10 w-full h-12 px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type={showPassword ? "text" : "password"}
              inputMode="numeric"
              required
              autoComplete="new-password"
              maxLength={PASSCODE_LENGTH}
              disabled={isSubmitting}
              value={password}
              onChange={(e) => { setPassword(sanitizePasscode(e.target.value)); setError(""); }}
              className="pl-10 pr-10 w-full h-12 px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors"
              placeholder="Enter a 6-digit passcode"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757680] hover:text-[#45464f]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            disabled={isSubmitting}
            onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c5c6d0] accent-[#1b2e5e]"
          />
          <span className="text-sm text-[#45464f] leading-snug">
            I agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b2e5e] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b2e5e] hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-12 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#c5c6d0]"></span>
        </div>
        <span className="relative px-3 bg-white text-xs text-[#757680]">Or sign up with Google</span>
      </div>

      <GoogleAuthButton label="Continue with Google" />
      <p className="-mt-3 text-center text-xs text-[#757680]">
        Google sign-up asks you to accept the terms on the next screen.
      </p>

      <p className="text-center text-sm text-[#45464f]">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-semibold text-[#1b2e5e] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}