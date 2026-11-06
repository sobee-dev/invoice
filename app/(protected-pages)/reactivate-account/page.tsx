"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Loader from "@/components/Loader";
import ReactivateWithGoogle from "@/components/ReactivateWithGoogle";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { isValidPasscode, sanitizePasscode, PASSCODE_LENGTH } from "@/lib/passcode";
import { ROUTES } from "@/lib/routes";

export default function ReactivateAccountPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState<"password" | "google">("password");
  const [email, setEmail] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const scheduledParam = params.get("scheduledFor");
    if (emailParam) setEmail(emailParam);
    if (scheduledParam) setScheduledFor(scheduledParam);
    if (params.get("method") === "google") setMethod("google");
    setReady(true);
  }, []);

  const formattedDate =
    scheduledFor && !Number.isNaN(Date.parse(scheduledFor))
      ? new Date(scheduledFor).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleReactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidPasscode(password)) {
      setError(`Password must be exactly ${PASSCODE_LENGTH} digits.`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // The backend logs the user straight back in, so this starts a normal
      // session. refreshUser loads the profile into AuthContext, and the entry
      // page then picks password change, onboarding or the right dashboard.
      await authService.cancelAccountDeletion(normalizedEmail, password);
      await refreshUser();
      router.replace(ROUTES.entry);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(getApiErrorMessage(err, "Could not reactivate your account. Please try again."));
    }
  };

  if (!ready) return <Loader />;

  if (method === "google") {
    return (
      <div className="space-y-6">
        <ReactivateWithGoogle scheduledFor={scheduledFor ?? undefined} />
        <p className="text-center text-sm text-[#45464f]">
          <Link href={ROUTES.login} className="font-semibold text-[#1b2e5e] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Restore Your Account</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">
          {formattedDate
            ? `Your account is scheduled for deletion on ${formattedDate}. Enter your password to keep it.`
            : "Your account is scheduled for deletion. Enter your password to keep it."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleReactivate}>
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
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Password
          </label>
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
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Restore My Account"}
        </button>
      </form>

      <p className="text-center text-sm text-[#45464f]">
        <Link href={ROUTES.login} className="font-semibold text-[#1b2e5e] hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}