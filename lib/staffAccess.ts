// lib/staffAccess.ts
import type { AuthUser } from "@/services/auth";

/** Staff with managerial access can view and add products. Owners use their own pages. */
export function canManageProducts(user: AuthUser | null): boolean {
  return user?.role === "staff" && user.permissionLevel === "managerial_access";
}