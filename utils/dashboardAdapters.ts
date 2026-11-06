// utils/dashboardAdapters.ts
import type { RevenuePoint } from "@/components/dashboard/RevenueChart";
import type { TopCustomerItem } from "@/components/dashboard/TopCustomers";
import type { Customer } from "@/services/customers";
import type { MonthlyRevenuePoint } from "@/services/reports";

// "2026-05", "May" and "October" all become a short month such as "May".
export function shortMonth(raw: string): string {
  const iso = /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : raw;
  const d = new Date(iso);
  if (/\d/.test(raw) && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return raw.slice(0, 3);
}

export function toRevenuePoints(series: MonthlyRevenuePoint[]): RevenuePoint[] {
  return series.map((p) => ({ label: shortMonth(p.month), value: Number(p.value) || 0 }));
}

export function toTopCustomers(clients: Customer[]): TopCustomerItem[] {
  return clients.map((c) => ({ id: c.id, name: c.fullName, total: Number(c.lifetimeValue) || 0 }));
}