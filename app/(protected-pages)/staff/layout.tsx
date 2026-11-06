// app/staff/layout.tsx
// import { RoleGuard } from "@/components/guards";

// export default function StaffLayout({ children }: { children: React.ReactNode }) {
//   return <RoleGuard role="staff">{children}</RoleGuard>;
// }


// app/(staff)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { ROUTES, entryRoute } from "@/lib/routes";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { business, isLoading: businessLoading, loadFailed, refreshBusiness } = useBusiness();

  const waiting = authLoading || (!!user && businessLoading);
  const failed = !waiting && !!user && loadFailed && !business;

  // Anything but the staff home means this person belongs somewhere else,
  // for example an owner who typed a staff URL.
  const target = waiting || failed ? null : entryRoute(user, business);
  const misplaced = target !== null && target !== ROUTES.staffHome;

  useEffect(() => {
    if (misplaced && target) router.replace(target);
  }, [misplaced, target, router]);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-on-surface-variant">
          We could not load your business. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => refreshBusiness()}
          className="h-12 rounded-lg bg-primary-container px-6 font-semibold text-white transition-colors hover:bg-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  if (waiting || misplaced) return <Loader />;

  return <AppShell variant="staff">{children}</AppShell>;
}