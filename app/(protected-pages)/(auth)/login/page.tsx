"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Loader from "@/components/Loader";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { AUTH_LAST_EMAIL_KEY, consumeAuthNotice, storage } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { isValidPasscode, sanitizePasscode, PASSCODE_LENGTH } from "@/lib/passcode";
import { errorCodeOf, STAFF_OVER_LIMIT_CODE, STAFF_OVER_LIMIT_NOTICE } from "@/lib/planLimit";
import { ROUTES } from "@/lib/routes";

// Messages for the codes /oauth/callback sends back as /login?error=...
const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelled: "Google sign-in was cancelled.",
  oauth_state_mismatch: "We could not verify that Google sign-in. Please try again.",
  oauth_failed: "Google sign-in failed. Please try again.",
  suspended: "This account has been suspended. Contact support.",
  business_suspended: "This business account has been suspended. Contact the business owner or support.",
  disabled: "This account is disabled.",
  staff_google_login_not_allowed: "Staff accounts cannot sign in with Google. Use your email and password.",
  staff_over_plan_limit: STAFF_OVER_LIMIT_NOTICE,
};

// Messages for /login?notice=... after something finished successfully.
const NOTICES: Record<string, string> = {
  deletion_scheduled:
    "Your account is scheduled for deletion and you have been signed out. Sign in again before the grace period ends if you change your mind.",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The one place that redirects a signed in user. It covers a fresh login
  // and someone opening /login while already signed in. The entry page then
  // decides between password change, onboarding and the right dashboard.
  useEffect(() => {
    if (!authLoading && user) router.replace(ROUTES.entry);
  }, [authLoading, user, router]);

  useEffect(() => {
    // Prefill the last email used, so returning users only type the password.
    storage.getItem(AUTH_LAST_EMAIL_KEY).then((saved) => {
      if (saved) setEmail(saved);
    });

    // A staff member signed out by the plan cap sees why, once.
    const authNotice = consumeAuthNotice();
    if (authNotice) setNotice(authNotice);

    // Only known codes are ever shown, never text taken from the URL.
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const noticeKey = params.get("notice");

    if (oauthError) setError(OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.oauth_failed);
    if (noticeKey && NOTICES[noticeKey]) setNotice(NOTICES[noticeKey]);

    if (oauthError || noticeKey) {
      window.history.replaceState(null, "", ROUTES.login);
    }
  }, []);

  // The button only waits for something to be typed. The exact rule is checked
  // on submit, so a short passcode gets a message instead of a dead button.
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const validateForm = (): boolean => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // authService.login already remembers the email, and the effect above
      // redirects once the user is set.
      await login({ email: normalizedEmail, password });
    } catch (err: any) {
      setIsSubmitting(false);

      const body = err?.response?.data;
      if (body?.code === "pending_deletion") {
        const params = new URLSearchParams({
          email: normalizedEmail,
          scheduledFor: body.deletionScheduledFor ?? "",
        });
        router.push(`${ROUTES.reactivateAccount}?${params.toString()}`);
        return;
      }

      // A staff member over the plan cap is refused at sign in.
      if (errorCodeOf(err) === STAFF_OVER_LIMIT_CODE) {
        setError(STAFF_OVER_LIMIT_NOTICE);
        return;
      }

      setError(getApiErrorMessage(err, "Login failed. Please check your credentials."));
    }
  };

  // Restoring a session, or signed in and about to be redirected.
  if (authLoading || user) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Welcome Back</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">Enter your details to sign in</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        {notice && (
          <div role="status" className="p-3 text-sm text-[#1b2e5e] bg-[#f5f3f8] rounded-lg border border-[#c5c6d0]">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Email
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
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#1b2e5e] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type={showPassword ? "text" : "password"}
              inputMode="numeric"
              required
              autoComplete="current-password"
              maxLength={PASSCODE_LENGTH}
              disabled={isSubmitting}
              value={password}
              onChange={(e) => { setPassword(sanitizePasscode(e.target.value)); setError(""); }}
              className="pl-10 pr-10 w-full h-12 px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors"
              placeholder="6-digit passcode"
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

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-12 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log In"}
        </button>
      </form>

      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#c5c6d0]"></span>
        </div>
        <span className="relative px-3 bg-white text-xs text-[#757680]">Or continue with Google</span>
      </div>

      <GoogleAuthButton label="Continue with Google" />
      <p className="-mt-3 text-center text-xs text-[#757680]">
        New accounts are asked to accept our{" "}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-[#45464f]">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.register} className="font-semibold text-[#1b2e5e] hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}