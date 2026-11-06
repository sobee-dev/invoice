// hooks/useStaff.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { Invitation, StaffMember, staffService } from "@/services/staff";

export function useStaff() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  // null means the invitations could not be loaded, which is different from having none.
  const [invitations, setInvitations] = useState<Invitation[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);

    // Each call fails on its own, so a bad invitations call never hides the team.
    const [m, i] = await Promise.allSettled([staffService.list(), staffService.listInvitations()]);

    if (m.status === "fulfilled") {
      setMembers(m.value);
    } else {
      setMembers([]);
      setError(true);
    }
    setInvitations(i.status === "fulfilled" ? i.value : null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchMember = useCallback(
    (id: string, patch: Partial<StaffMember>) =>
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))),
    [],
  );

  return { members, invitations, setInvitations, isLoading, error, reload: load, patchMember };
}