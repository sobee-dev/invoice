// app/(staff)/staff/profile/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useAuth } from "@/context/AuthContext";
import { useStaffDashboard } from "@/hooks/useStaffDashboard";
import { ROUTES } from "@/lib/routes";

function initialsFrom(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function roleLabel(level?: string): string {
  if (level === "managerial_access") return "Managerial access";
  if (level === "limited_access") return "Limited access";
  return "Staff";
}

export default function StaffProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Shares its cache with the staff dashboard, so this costs no extra request.
  const { data, isLoading: loading, failed, reload: load } = useStaffDashboard();
  const info = data?.staffInfo ?? null;

  const [pwOpen, setPwOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const email = user?.email ?? "";
  const fullName =
    user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || email;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // The local session is cleared even when the request fails.
    }
    router.replace(ROUTES.login);
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (failed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon="cloud_off"
          title="We could not load your profile"
          description="Please check your connection and try again."
          action={
            <button type="button" onClick={load} className={btnNavy}>
              Try again
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="My profile" subtitle="Your account and sign in details." />

      <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-white p-8 text-center shadow-card">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container text-2xl font-extrabold text-white shadow-card">
          {initialsFrom(fullName, email) || "??"}
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-on-surface">{fullName || "Staff member"}</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">{email}</p>
        {info?.department && <p className="mt-1 text-sm text-on-surface-variant">{info.department}</p>}
        <span className="mt-4 rounded-full bg-secondary-container px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-on-secondary-container">
          {roleLabel(info?.permissionLevel)}
        </span>
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
        <h3 className="px-5 pt-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Account</h3>
        <button
          type="button"
          onClick={() => setPwOpen(true)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-container-low/60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary-container">
            <Icon name="lock_reset" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-on-surface">Change password</span>
            <span className="block text-xs text-on-surface-variant">Update your account password</span>
          </span>
          <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
        <h3 className="px-5 pt-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session</h3>
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-container-low/60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-error">
            <Icon name="logout" size={20} />
          </span>
          <span className="flex-1 text-sm font-bold text-error">Log out</span>
          <Icon name="chevron_right" size={20} className="text-error" />
        </button>
      </section>

      <ChangePasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onDone={() => setToast({ tone: "success", text: "Your password has been changed." })}
      />

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will need to sign in again to use BillBuzz."
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onClose={() => setLogoutOpen(false)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}