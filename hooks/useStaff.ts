// hooks/useStaff.ts
"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Invitation, StaffMember, staffService } from "@/services/staff";

interface StaffData {
  members: StaffMember[];
  // null means the invitations could not be loaded, which is different from having none.
  invitations: Invitation[] | null;
}

const staffKey = ["staff"] as const;

async function fetchStaff(): Promise<StaffData> {
  // Each call fails on its own, so a bad invitations call never hides the team.
  const [m, i] = await Promise.allSettled([staffService.list(), staffService.listInvitations()]);
  if (m.status === "rejected") throw m.reason;
  return { members: m.value, invitations: i.status === "fulfilled" ? i.value : null };
}

export function useStaff() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: staffKey, queryFn: fetchStaff });

  const patchMember = useCallback(
    (id: string, patch: Partial<StaffMember>) =>
      queryClient.setQueryData<StaffData>(staffKey, (old) =>
        old ? { ...old, members: old.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) } : old,
      ),
    [queryClient],
  );

  const setInvitations = useCallback(
    (next: Invitation[] | null | ((prev: Invitation[] | null) => Invitation[] | null)) =>
      queryClient.setQueryData<StaffData>(staffKey, (old) => {
        if (!old) return old;
        return { ...old, invitations: typeof next === "function" ? next(old.invitations) : next };
      }),
    [queryClient],
  );

  return {
    members: query.data?.members ?? [],
    invitations: query.data ? query.data.invitations : [],
    setInvitations,
    isLoading: query.isPending,
    error: query.isError,
    reload: () => {
      query.refetch();
    },
    patchMember,
  };
}