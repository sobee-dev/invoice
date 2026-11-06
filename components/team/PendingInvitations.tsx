// components/team/PendingInvitations.tsx
"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import type { Invitation } from "@/services/staff";
import { fmtShortDate } from "@/utils/formatDate";

interface PendingInvitationsProps {
  invitations: Invitation[] | null; // null when they could not be loaded
  busyId: string | null;
  onResend: (invitation: Invitation) => void;
  onCancel: (invitation: Invitation) => void;
  onRetry: () => void;
}

export function PendingInvitations({ invitations, busyId, onResend, onCancel, onRetry }: PendingInvitationsProps) {
  return (
    <SectionCard title="Pending invitations" subtitle="People you invited who have not joined yet.">
      {invitations === null ? (
        <p className="text-body-md text-on-surface-variant">
          We could not load invitations.{" "}
          <button type="button" onClick={onRetry} className="font-semibold text-primary-container hover:underline">
            Try again
          </button>
        </p>
      ) : invitations.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No pending invitations.</p>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-on-surface">{inv.email}</p>
                <p className="text-xs text-on-surface-variant">Sent {fmtShortDate(inv.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onResend(inv)}
                  disabled={busyId === inv.id}
                  className="h-9 rounded-lg border border-primary-container px-3 text-sm font-semibold text-primary hover:bg-surface-container-low disabled:opacity-50"
                >
                  {busyId === inv.id ? "Sending..." : "Resend"}
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(inv)}
                  disabled={busyId === inv.id}
                  className="h-9 rounded-lg px-3 text-sm font-semibold text-error hover:bg-error-container disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}