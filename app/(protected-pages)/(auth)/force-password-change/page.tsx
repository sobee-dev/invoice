"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { authService } from "@/services/auth";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { ROUTES } from "@/lib/routes";

const inputCls = "h-12 w-full pl-10 pr-4 rounded-lg border border-[#dee2e6] bg-white text-[#1b1b1f] placeholder:text-[#c5c6d0] focus:border-[#1b2e5e] focus:outline-none transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.requestPasswordReset(normalizedEmail);
      setSubmittedEmail(normalizedEmail);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Something went wrong. Please try again later."));
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-emerald-50 p-3 rounded-full">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Check your email</h2>
        <p className="text-sm text-[#45464f] leading-relaxed">
          If an account exists for <br />
          <span className="font-semibold text-[#1b1b1f]">{submittedEmail}</span>
          <br />
          we have sent a password reset link. It opens a page where you can choose a new
          6-digit passcode. If nothing arrives in a few minutes, check your spam folder.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => { setSubmittedEmail(null); setEmail(""); }}
            className="text-sm font-semibold text-[#45464f] hover:text-[#1b1b1f] hover:underline"
          >
            Use a different email
          </button>
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1b2e5e] hover:text-[#011848] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Forgot Password?</h2>
        <p className="mt-2 text-sm text-[#45464f]">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleResetRequest}>
        {error && (
          <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || email.trim().length === 0}
          className="w-full h-12 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold text-sm transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
        </button>
      </form>

      <div className="text-center">
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1b2e5e] hover:text-[#011848] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}