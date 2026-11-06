// components/team/TeamTable.tsx
"use client";

import { RoleChip } from "@/components/team/RoleChip";
import { Avatar } from "@/components/ui/Avatar";
import { RowMenu } from "@/components/ui/RowMenu";
import { Switch } from "@/components/ui/Switch";
import type { StaffMember } from "@/services/staff";
import { fmtShortDate } from "@/utils/formatDate";

const th = "px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant";

interface TeamTableProps {
  members: StaffMember[];
  busyId: string | null;
  onToggle: (member: StaffMember, next: boolean) => void;
  onEdit: (member: StaffMember) => void;
}

function TempPasswordTag() {
  return (
    <span className="mt-0.5 inline-block rounded bg-status-warn-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-warn-fg">
      Temporary password
    </span>
  );
}

export function TeamTable({ members, busyId, onToggle, onEdit }: TeamTableProps) {
  const menuFor = (m: StaffMember) => [
    { label: "Edit details", icon: "edit", onClick: () => onEdit(m) },
    {
      label: m.status === "active" ? "Deactivate" : "Activate",
      icon: m.status === "active" ? "person_off" : "person",
      onClick: () => onToggle(m, m.status !== "active"),
    },
  ];

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-body-md">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Email address</th>
              <th className={th}>Role</th>
              <th className={th}>Department</th>
              <th className={th}>Status</th>
              <th className={th}>Added</th>
              <th className={`${th} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {members.map((m, index) => {
              const active = m.status === "active";
              return (
                <tr key={m.id} className="hover:bg-surface-container-low/60">
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => onEdit(m)} className="flex items-center gap-3 text-left">
                      <Avatar name={m.fullName || m.email} size={40} />
                      <span>
                        <span className={`block font-bold hover:underline ${active ? "text-primary" : "text-on-surface-variant"}`}>
                          {m.fullName || m.email}
                        </span>
                        {m.requiresPasswordChange && <TempPasswordTag />}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-on-surface">{m.email}</td>
                  <td className="px-6 py-4">
                    <RoleChip level={m.permissionLevel} />
                  </td>
                  <td className="px-6 py-4 text-on-surface">{m.department || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-3">
                      <Switch
                        checked={active}
                        disabled={busyId === m.id}
                        label={`${active ? "Deactivate" : "Activate"} ${m.fullName || m.email}`}
                        onChange={(next) => onToggle(m, next)}
                      />
                      <span className="text-on-surface">{active ? "Active" : "Inactive"}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-on-surface">{fmtShortDate(m.createdAt)}</td>
                  <td className="px-6 py-4 text-center">
                    <RowMenu items={menuFor(m)} label={`Actions for ${m.fullName || m.email}`} openUp={members.length > 2 && index >= members.length - 2} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 p-4 md:hidden">
        {members.map((m) => {
          const active = m.status === "active";
          return (
            <li key={m.id} className="rounded-xl border border-outline-variant bg-white p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar name={m.fullName || m.email} size={44} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-bold ${active ? "text-primary" : "text-on-surface-variant"}`}>{m.fullName || m.email}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {m.email}
                    {m.department ? ` · ${m.department}` : ""}
                  </p>
                  {m.requiresPasswordChange && <TempPasswordTag />}
                </div>
                <RowMenu items={menuFor(m)} label={`Actions for ${m.fullName || m.email}`} openUp />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <RoleChip level={m.permissionLevel} />
                <span className="flex items-center gap-2 text-sm text-on-surface">
                  {active ? "Active" : "Inactive"}
                  <Switch
                    checked={active}
                    disabled={busyId === m.id}
                    label={`${active ? "Deactivate" : "Activate"} ${m.fullName || m.email}`}
                    onChange={(next) => onToggle(m, next)}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}