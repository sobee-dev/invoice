// components/DeleteAccountPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { GOOGLE_OAUTH_KEYS } from "@/lib/googleOAuth";
import { ROUTES } from "@/lib/routes";
import { isValidPasscode, sanitizePasscode, PASSCODE_LENGTH } from "@/lib/passcode";


const inputClasses =
  "w-full px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors";

export default function DeleteAccountPanel() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // When Google confirmation fails, the callback brings the user back here
  // and leaves a one time message behind.
  useEffect(() => {
    const flash = sessionStorage.getItem(GOOGLE_OAUTH_KEYS.flash);
    if (flash) {
      sessionStorage.removeItem(GOOGLE_OAUTH_KEYS.flash);
      setError(flash);
      setOpen(true);
    }
  }, []);

  if (!user) return null;

  const handlePasswordDelete = async (e: React.FormEvent) => {
    e.preventDefault();
        if (!isValidPasscode(password) || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await authService.requestAccountDeletion(password, reason.trim());
      await logout();
      router.replace(`${ROUTES.login}?notice=deletion_scheduled`);
    } catch (err: any) {
      setSubmitting(false);
      setError(getApiErrorMessage(err, "Could not schedule account deletion."));
    }
  };

  return (
    <section className="card space-y-4">
      <div>
        <h3 className="text-base font-bold text-[#1b1b1f]">Delete account</h3>
        <p className="mt-1 text-sm text-[#45464f]">
          Your account will be scheduled for deletion and you will be signed out on every device.
          Signing in again before the grace period ends restores it.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-12 px-6 border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg font-semibold transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-4">
          {error && (
            <div role="alert" className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
              Reason (optional)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              disabled={submitting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClasses} py-3`}
              placeholder="Tell us why you are leaving"
            />
          </div>

          {user.hasPassword ? (
            <form className="space-y-4" onSubmit={handlePasswordDelete}>
              <div>
                <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
                  Confirm with your password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
                                    <input
                    type="password"
                    inputMode="numeric"
                    required
                    autoComplete="current-password"
                    maxLength={PASSCODE_LENGTH}
                    disabled={submitting}
                    value={password}
                    onChange={(e) => { setPassword(sanitizePasscode(e.target.value)); setError(""); }}
                    className={`${inputClasses} pl-10 h-12`}
                    placeholder="6-digit passcode"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setOpen(false); setPassword(""); setError(""); }}
                  className="h-12 px-6 border border-[#c5c6d0] text-[#1b1b1f] hover:bg-[#f5f3f8] rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!password || submitting}
                  className="flex-1 h-12 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete my account"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#45464f]">
                Your account uses Google to sign in, so Google will ask you to confirm it is you.
              </p>
              <GoogleAuthButton
                purpose="delete_account"
                reason={reason.trim()}
                tone="danger"
                label="Confirm with Google and delete my account"
              />
              <button
                type="button"
                onClick={() => { setOpen(false); setError(""); }}
                className="w-full h-12 border border-[#c5c6d0] text-[#1b1b1f] hover:bg-[#f5f3f8] rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}