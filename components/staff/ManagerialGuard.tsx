// components/staff/ManagerialGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canManageProducts } from "@/lib/staffAccess";
import { ROUTES } from "@/lib/routes";

export function ManagerialGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const allowed = canManageProducts(user);

  useEffect(() => {
    if (user && !allowed) router.replace(ROUTES.staffHome);
  }, [user, allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}