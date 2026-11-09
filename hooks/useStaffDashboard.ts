// hooks/useStaffDashboard.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { staffService } from "@/services/staff";

// One cached copy of the staff member's own dashboard payload. The dashboard
// page reads the figures from it and the profile page reads staffInfo from it,
// so moving between the two costs no request.
export function useStaffDashboard() {
  const query = useQuery({
    queryKey: ["staff", "dashboard"],
    queryFn: () => staffService.getMyDashboard(),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    failed: query.isError && !query.data,
    reload: () => {
      query.refetch();
    },
  };
}