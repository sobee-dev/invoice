// lib/routes.ts
import type { AuthUser } from "@/services/auth";
import type { BusinessProfile } from "@/services/business";

export const ROUTES = {
  // Login and register send everyone here, and the entry page decides where
  // they belong. Keeping it off "/" avoids clashing with a marketing page.
  entry: "/enter",
  login: "/login",
  register: "/register",
  onboarding: "/onboarding",
  ownerHome: "/dashboard",
  staffHome: "/staff/dashboard",
  forcePasswordChange: "/force-password-change",
  reactivateAccount: "/reactivate-account",
  newDocument: "/new-document",
  team: "/team",
  // Owner area
  docs: "/docs",
  products: "/products",
  clients: "/clients",
  reports: "/reports",
  settings: "/settings",
  newSalesInvoice: "/new-sales-invoice",
  billing: "/billing",
  reportsStock: "/reports/stock",
  reportsCustomers: "/reports/customers",
  reportsOutstanding: "/reports/outstanding",
  // Staff area
  staffDocs: "/staff/docs",
  staffProfile: "/staff/profile",
  staffNewSalesInvoice: "/staff/new-sales-invoice",
  staffNewDocument: "/staff/new-document",
} as const;

/** Payment history for one invoice: items, payments and returns. */
export const invoicePaymentsRoute = (documentId: string) => `/docs/${documentId}/payments`;

/** Payment history and outstanding balance for one client. */
export const clientPaymentsRoute = (customerId: string) => `/clients/${customerId}/payments`;

/** A single document inside the staff area. */
export const staffDocRoute = (documentId: string) => `/staff/docs/${documentId}`;

export function homeForRole(role?: string | null): string {
  return role === "owner" ? ROUTES.ownerHome : ROUTES.staffHome;
}

// Only call this once auth and business have both finished loading.
export function entryRoute(
  user: AuthUser | null,
  business: BusinessProfile | null,
): string {
  if (!user) return ROUTES.login;
  if (user.requiresPasswordChange) return ROUTES.forcePasswordChange;
  // Onboarding is an owner flow. Staff never create a business.
  if (user.role === "owner" && !business) return ROUTES.onboarding;
  return homeForRole(user.role);
}