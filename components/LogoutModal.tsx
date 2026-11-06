// components/LogoutModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/routes";

export default function LogoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Blacklists the refresh token, clears the cookie and local session,
      // then sets the user to null.
      await logout();
    } catch (err) {
      // Local state is cleared even when the request fails, so the person
      // is still signed out on this device.
      console.warn("Logout request failed", err);
    }

    try {
      sessionStorage.clear();
    } catch {
      // Storage can be blocked in private modes. Nothing to do.
    }

    onClose();
    router.replace(ROUTES.login);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={isLoggingOut ? undefined : onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-[#c5c6d0] bg-white p-6 shadow-[0px_8px_16px_rgba(27,46,94,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="logout-title" className="mb-1 text-lg font-bold text-[#1b1b1f]">
          Confirm Logout
        </h2>
        <p className="mb-6 text-sm text-[#45464f]">
          Are you sure you want to log out of BillBuzz?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 rounded-lg border border-[#c5c6d0] px-4 py-2.5 text-sm font-semibold text-[#1b1b1f] transition-colors hover:bg-[#f5f3f8] disabled:opacity-50"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#ba1a1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#93000a] disabled:opacity-60"
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}