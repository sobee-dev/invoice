// app/(owner)/settings/page.tsx  (place wherever your other owner pages live)
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { Banner, errMsg, Section, Toggle } from "@/components/settings/ui";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { ROUTES } from "@/lib/routes";
import { authService } from "@/services/auth";

import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";

function LinkRow({ href, icon, label, sub, external }: { href: string; icon: string; label: string; sub?: string; external?: boolean }) {
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-on-surface">{label}</span>
        {sub && <span className="block text-xs text-on-surface-variant">{sub}</span>}
      </span>
      <Icon name={external ? "open_in_new" : "chevron_right"} size={18} className="text-on-surface-variant" />
    </>
  );
  const cls = "flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-container-low";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
  ) : (
    <Link href={href} className={cls}>{content}</Link>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { subscription } = useSubscriptionContext();

  const [emailAlerts, setEmailAlerts] = useState(user?.emailNotifications ?? true);
  const [pushAlerts, setPushAlerts] = useState(user?.pushNotifications ?? true);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (user) {
      setEmailAlerts(user.emailNotifications ?? true);
      setPushAlerts(user.pushNotifications ?? true);
    }
  }, [user]);

  const displayName = user?.fullName || user?.email || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function toggleNotification(key: "email" | "push", value: boolean) {
    const next = { email: emailAlerts, push: pushAlerts, [key]: value };
    // Optimistic, reverted if the request fails.
    if (key === "email") setEmailAlerts(value);
    else setPushAlerts(value);
    try {
      await authService.updateNotifications(next.email, next.push);
      await refreshUser();
    } catch {
      if (key === "email") setEmailAlerts(!value);
      else setPushAlerts(!value);
      setNotice({ kind: "error", text: "Could not update notification preferences." });
    }
  }

  // Google-only accounts have no password to change, so email them a set-password link instead.
  async function sendSetPasswordLink() {
    if (!user) return;
    setResetBusy(true);
    setNotice(null);
    try {
      await authService.requestPasswordReset(user.email);
      setNotice({ kind: "success", text: `We sent a link to ${user.email} so you can set a password.` });
    } catch (err) {
      setNotice({ kind: "error", text: errMsg(err, "Could not send the link. Please try again.") });
    } finally {
      setResetBusy(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // The context clears the local user either way, so still leave the page.
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div>
      <h1 className="text-headline-lg font-bold text-primary">Settings</h1>
      <p className="mt-1 text-body-lg text-on-surface-variant">Manage your business profile, invoices and account.</p>

      {notice && (
        <div className="mt-5 max-w-3xl">
          <Banner kind={notice.kind}>{notice.text}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BusinessSettingsForm />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Profile */}
          <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-white p-5 shadow-card">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-lg font-extrabold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-on-surface">{displayName}</p>
              <p className="truncate text-sm text-on-surface-variant">{user?.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] font-bold capitalize text-on-secondary-container">
                {user?.role ?? "owner"}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <Section title="Notifications">
            <ul className="space-y-4">
              <li className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Email alerts</p>
                  <p className="text-xs text-on-surface-variant">Invoices, payments and reminders</p>
                </div>
                <Toggle checked={emailAlerts} onChange={(v) => toggleNotification("email", v)} label="Email alerts" />
              </li>
              <li className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Push notifications</p>
                  <p className="text-xs text-on-surface-variant">Real-time alerts on your phone</p>
                </div>
                <Toggle checked={pushAlerts} onChange={(v) => toggleNotification("push", v)} label="Push notifications" />
              </li>
            </ul>
          </Section>

          {/* Account */}
          <Section title="Account">
            <div className="-mx-2 space-y-0.5">
              <LinkRow
                href={ROUTES.billing}
                icon="workspace_premium"
                label="Billing and subscription"
                sub={subscription ? `Plan: ${subscription.planName}` : "Manage your plan"}
              />
              <LinkRow href="/team" icon="badge" label="Staff" sub="Manage team members and roles" />
              {user?.hasPassword === false ? (
                <button
                  type="button"
                  onClick={sendSetPasswordLink}
                  disabled={resetBusy}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-surface-container-low disabled:opacity-60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                    <Icon name="lock" size={20} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-on-surface">{resetBusy ? "Sending..." : "Set a password"}</span>
                    <span className="block text-xs text-on-surface-variant">You signed in with Google. We will email you a link.</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPwOpen(true)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-surface-container-low"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                    <Icon name="lock" size={20} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-on-surface">Change password</span>
                  <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
                </button>
              )}
              <LinkRow href="https://www.billbuzz.ng/#contact" icon="help" label="Help and support" sub="www.billbuzz.ng" external />
              <button
                type="button"
                onClick={() => setSignOutOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-error-container"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container text-error">
                  <Icon name="logout" size={20} />
                </span>
                <span className="text-sm font-bold text-error">Sign out</span>
              </button>
            </div>
          </Section>

          {/* Danger zone — collapsed until opened */}
          <div className="rounded-xl border border-outline-variant bg-white">
            <button
              type="button"
              onClick={() => setDangerOpen((o) => !o)}
              aria-expanded={dangerOpen}
              aria-controls="danger-zone"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-on-surface-variant">Advanced</span>
              <Icon
                name="expand_more"
                size={22}
                className={`text-on-surface-variant transition-transform ${dangerOpen ? "rotate-180" : ""}`}
              />
            </button>
            {dangerOpen && (
              <div id="danger-zone" className="border-t border-error/40 p-5">
                <h2 className="text-base font-bold text-error">Delete account</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Permanently close your account and business. You can cancel during the grace period.
                </p>
                <Link
                  href="/delete-account"
                  className="mt-4 inline-flex h-10 items-center rounded-lg border border-error px-4 text-sm font-semibold text-error hover:bg-error-container"
                >
                  Delete account
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ChangePasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onDone={() => setNotice({ kind: "success", text: "Password changed successfully." })}
      />

      <Modal
        open={signOutOpen}
        title="Sign out?"
        onClose={() => { if (!signingOut) setSignOutOpen(false); }}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSignOutOpen(false)}
              disabled={signingOut}
              className={`${btnOutline} !h-12 flex-1`}
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className={`${btnNavy} !h-12 flex-1`}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          You will need to sign in again to use BillBuzz on this device.
        </p>
      </Modal>
    </div>
  );
}