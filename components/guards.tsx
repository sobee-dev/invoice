// components/guards.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { entryRoute, homeForRole } from "@/lib/routes";

export function RoleGuard({
  role,
  children,
}: {
  role: "owner" | "staff";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { business, isLoading: businessLoading } = useBusiness();

  const loading = authLoading || (!!user && businessLoading);

  // Anyone who is not where they belong goes to their own entry route.
  // There is no subscription lock any more, so nothing else redirects.
  let redirectTo: string | null = null;
  if (!loading) {
    const entry = entryRoute(user, business);
    if (entry !== homeForRole(role)) redirectTo = entry;
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (loading || redirectTo) return <Loader />;
  return <>{children}</>;
}