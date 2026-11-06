// components/team/TeamContent.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { AddMemberModal } from "@/components/team/AddMemberModal";
import { EditMemberModal } from "@/components/team/EditMemberModal";
import { PendingInvitations } from "@/components/team/PendingInvitations";
import { TeamTable } from "@/components/team/TeamTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useStaff } from "@/hooks/useStaff";
import { Invitation, PermissionLevel, StaffMember, staffService } from "@/services/staff";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

const PAGE_SIZE = 8;

type RoleFilter = PermissionLevel | "all";
type StatusFilter = "all" | "active" | "inactive";

const selectClasses =
  "h-11 rounded-lg border border-outline-variant bg-white px-3 text-sm font-medium text-on-surface focus:border-primary-container focus:outline-none";

function Stat({ label, value, icon, tile }: { label: string; value: string; icon: string; tile: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-6 shadow-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
        <p className="mt-2 text-4xl font-extrabold text-primary">{value}</p>
      </div>
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${tile}`}>
        <Icon name={icon} size={26} />
      </span>
    </div>
  );
}

export function TeamContent() {
  const { members, invitations, setInvitations, isLoading, error, reload, patchMember } = useStaff();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [confirmMember, setConfirmMember] = useState<StaffMember | null>(null);
  const [confirmInvite, setConfirmInvite] = useState<Invitation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          (role === "all" || m.permissionLevel === role) &&
          (status === "all" || m.status === status) &&
          (!q ||
            (m.fullName ?? "").toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            (m.department ?? "").toLowerCase().includes(q)),
      ),
    [members, role, status, q],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const activeCount = members.filter((m) => m.status === "active").length;
  const hasFilters = q.length > 0 || role !== "all" || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  // The row flips at once and goes back if the request fails.
  const applyStatus = async (member: StaffMember, active: boolean) => {
    const before = member.status;
    setBusyId(member.id);
    patchMember(member.id, { status: active ? "active" : "inactive" });
    try {
      if (active) await staffService.activate(member.id);
      else await staffService.deactivate(member.id);
      setToast({ tone: "success", text: `${member.fullName || member.email} is now ${active ? "active" : "inactive"}.` });
    } catch (err: any) {
      patchMember(member.id, { status: before });
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not change this member's status. Please try again.") });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = (member: StaffMember, next: boolean) => {
    if (next) applyStatus(member, true);
    else setConfirmMember(member);
  };

  const handleResend = async (inv: Invitation) => {
    setInviteBusyId(inv.id);
    try {
      const res = await staffService.resendInvitation(inv.id);
      setToast(
        res.emailSent
          ? { tone: "success", text: `Invitation sent again to ${inv.email}.` }
          : { tone: "error", text: "The email could not be sent. Please try again." },
      );
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not resend this invitation.") });
    } finally {
      setInviteBusyId(null);
    }
  };

  const handleCancelInvite = async (inv: Invitation) => {
    setInviteBusyId(inv.id);
    try {
      await staffService.cancelInvitation(inv.id);
      setInvitations((prev) => (prev ? prev.filter((i) => i.id !== inv.id) : prev));
      setToast({ tone: "success", text: `Invitation to ${inv.email} cancelled.` });
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not cancel this invitation.") });
    } finally {
      setInviteBusyId(null);
      setConfirmInvite(null);
    }
  };

  const addButton = (
    <button type="button" onClick={() => setAddOpen(true)} className={btnNavy}>
      <Icon name="person_add" size={18} /> Add member
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Team management" subtitle="Manage your staff members and what they can access." actions={addButton} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Team members" value={isLoading ? "..." : String(members.length)} icon="groups" tile="bg-primary-fixed text-light-blue" />
        <Stat label="Active members" value={isLoading ? "..." : String(activeCount)} icon="how_to_reg" tile="bg-secondary-container text-on-secondary-container" />
        <Stat
          label="Pending invitations"
          value={isLoading ? "..." : invitations === null ? "—" : String(invitations.length)}
          icon="mail"
          tile="bg-surface-container text-on-surface-variant"
        />
      </div>

      <section className="rounded-xl border border-outline-variant bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant p-5">
          <div className="relative min-w-[220px] flex-1">
            <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email or department..."
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-11 pr-4 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
            />
          </div>

          <select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value as RoleFilter); setPage(1); }} className={selectClasses}>
            <option value="all">All roles</option>
            <option value="managerial_access">Managerial</option>
            <option value="limited_access">Limited</option>
          </select>

          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }} className={selectClasses}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {!isLoading && !error && members.length > 0 && (
            <p className="ml-auto text-body-md text-on-surface-variant">
              Showing {filtered.length === 0 ? 0 : `${start + 1}-${start + visible.length}`} of {filtered.length} members
            </p>
          )}
        </div>

        {error ? (
          <EmptyState
            icon="cloud_off"
            title="We could not load your team"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={reload} className={btnNavy}>
                Try again
              </button>
            }
          />
        ) : isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-container-low" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon="groups"
            title="No team members yet"
            description="Add the people who help you run the business. Each one gets their own sign in."
            action={addButton}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="person_search"
            title="No members match"
            description="Try a different search or filter."
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 rounded-lg border border-primary-container px-4 text-sm font-semibold text-primary hover:bg-surface-container-low"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <TeamTable members={visible} busyId={busyId} onToggle={handleToggle} onEdit={setEditing} />
            {pageCount > 1 && (
              <div className="border-t border-outline-variant p-5">
                <Pagination page={current} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </section>

      <PendingInvitations
        invitations={invitations}
        busyId={inviteBusyId}
        onResend={handleResend}
        onCancel={setConfirmInvite}
        onRetry={reload}
      />

      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onDone={reload} />

      <EditMemberModal
        member={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, patch) => {
          patchMember(id, patch);
          setToast({ tone: "success", text: "Member updated." });
        }}
      />

      <ConfirmDialog
        open={confirmMember !== null}
        title={`Deactivate ${confirmMember?.fullName || confirmMember?.email || "this member"}?`}
        description="You can reactivate them at any time."
        confirmLabel="Deactivate"
        tone="danger"
        onConfirm={async () => {
          if (confirmMember) await applyStatus(confirmMember, false);
          setConfirmMember(null);
        }}
        onClose={() => setConfirmMember(null)}
      />

      <ConfirmDialog
        open={confirmInvite !== null}
        title="Cancel this invitation?"
        description={`${confirmInvite?.email ?? "They"} will no longer be able to join with the link they were sent.`}
        confirmLabel="Cancel invitation"
        tone="danger"
        onConfirm={async () => {
          if (confirmInvite) await handleCancelInvite(confirmInvite);
        }}
        onClose={() => setConfirmInvite(null)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}