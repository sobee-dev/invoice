// lib/searchPages.ts
import { ROUTES } from "@/lib/routes";

export interface PageEntry {
  title: string;
  href: string;
  icon: string;
  keywords: string[];
}

// Only pages that exist. Add new ones here as you build them.
export const PAGE_ENTRIES: PageEntry[] = [
  { title: "Create sales invoice", href: ROUTES.newSalesInvoice, icon: "receipt_long", keywords: ["new invoice", "add invoice", "bill", "sell"] },
  { title: "Documents", href: ROUTES.docs, icon: "description", keywords: ["invoices", "proforma", "receipts", "docs"] },
  { title: "Dashboard", href: ROUTES.ownerHome, icon: "dashboard", keywords: ["home", "overview"] },
  { title: "Products", href: ROUTES.products, icon: "inventory_2", keywords: ["stock", "items", "inventory"] },
  { title: "Clients", href: ROUTES.clients, icon: "group", keywords: ["customers"] },
  { title: "Team", href: ROUTES.team, icon: "badge", keywords: ["staff", "members", "invite"] },
  { title: "Reports", href: ROUTES.reports, icon: "analytics", keywords: ["analytics", "revenue", "performance"] },
  { title: "Create proforma or supplier order", href: ROUTES.newDocument, icon: "post_add", keywords: ["quote", "purchase order", "new document"] },
  { title: "Add product", href: "/products/new", icon: "add_box", keywords: ["new product"] },
  { title: "Add client", href: "/clients/new", icon: "person_add", keywords: ["new client", "new customer"] },
  { title: "Stock report", href: ROUTES.reportsStock, icon: "inventory", keywords: ["inventory levels", "low stock"] },
  { title: "Subscription and billing", href: ROUTES.billing, icon: "credit_card", keywords: ["plan", "payment", "renew"] },
];

export function matchPages(query: string, limit = 5): PageEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return PAGE_ENTRIES.map((entry) => {
    const title = entry.title.toLowerCase();
    let score = 0;
    if (title.startsWith(q)) score = 3;
    else if (title.includes(q)) score = 2;
    else if (entry.keywords.some((k) => k.includes(q))) score = 1;
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);
}

export function quickPages(): PageEntry[] {
  return PAGE_ENTRIES.slice(0, 6);
}