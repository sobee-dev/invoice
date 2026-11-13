// app/(owner)/reports/page.tsx
"use client";


import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { ROUTES } from "@/lib/routes";
import { useReportsDashboard } from "@/hooks/useReports";
import { resolveCurrency } from "@/utils/currencySymbol";
import { toRevenuePoints } from "@/utils/dashboardAdapters";
import { fmtMoney } from "@/utils/money";

const LINKS = [
  { href: ROUTES.reportsStock, icon: "inventory", tile: "bg-status-paid-bg text-status-paid-fg", title: "Stock report", sub: "Inventory levels and reorder alerts" },
  { href: ROUTES.reportsCustomers, icon: "groups", tile: "bg-secondary-container text-on-secondary-container", title: "Customer analytics", sub: "Lifetime value, payment trends and balances due" },
  { href: "/reports/outstanding", icon: "pending_actions", tile: "bg-tertiary-fixed text-on-tertiary-fixed-variant", title: "Outstanding invoices", sub: "Unpaid money, how old it is and who owes the most" },
  { href: ROUTES.docs, icon: "receipt_long", tile: "bg-primary-fixed text-primary-container", title: "All documents", sub: "Browse your complete document history" },
] as const;

export default function ReportsPage() {
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";

  const { report, state, reload: load } = useReportsDashboard();

  const growth = report?.revenueGrowth ?? "—";
  const hasGrowth = growth !== "—";
  const growthIsPositive = hasGrowth && !growth.startsWith("-");

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="How your business is performing." />

      {state === "error" ? (
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="cloud_off"
            title="We could not load your reports"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={load} className={btnNavy}>
                Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="payments" iconBg="bg-primary-fixed" iconColor="text-light-blue"
              label="Revenue this month"
              value={report ? fmtMoney(report.revenueTotal, symbol, 2) : "..."}
              sub={hasGrowth ? `${growth} compared to last month` : "No comparison yet"}
              badge={hasGrowth ? { text: growth, tone: growthIsPositive ? "green" : "red" } : undefined}
            />
            <StatCard
              icon="pending_actions" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
              label="Outstanding"
              value={report ? fmtMoney(report.outstandingTotal, symbol, 2) : "..."}
              sub="Money still owed to you"
            />
            <StatCard
              icon="task_alt" iconBg="bg-secondary-fixed" iconColor="text-secondary"
              label="Collection rate"
              value={report ? report.collectionRate : "..."}
              sub="Share of invoiced money collected"
            />
            <StatCard
              icon="receipt_long" iconBg="bg-primary-fixed" iconColor="text-light-blue"
              label="Average invoice"
              value={report ? fmtMoney(report.avgInvoiceValue, symbol, 2) : "..."}
              sub="This month"
            />
          </div>

          <RevenueChart points={toRevenuePoints(report?.monthlyRevenue ?? [])} symbol={symbol} />

          <section>
            <h2 className="mb-3 text-xl font-bold text-primary">Business insights</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-4 rounded-xl border border-outline-variant bg-white p-5 shadow-card transition-colors hover:bg-surface-container-low/60"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${l.tile}`}>
                    <Icon name={l.icon} size={24} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-on-surface">{l.title}</span>
                    <span className="block text-xs text-on-surface-variant">{l.sub}</span>
                  </span>
                  <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
                </Link>
              ))}
            </div>
          </section>

          {report && (
            <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-card">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-container">
                <Icon name="lightbulb" size={16} /> Owner advisory
              </p>
              <h2 className="mt-3 text-2xl font-extrabold">
                {hasGrowth
                  ? `Revenue is ${growthIsPositive ? "up" : "down"} ${growth.replace("+", "").replace("-", "")} this month`
                  : "No revenue recorded yet"}
              </h2>
              <p className="mt-2 max-w-xl text-body-md text-primary-fixed">
                {!hasGrowth
                  ? "Once you have paid invoices, monthly trends will show up here."
                  : growthIsPositive
                    ? "Strong invoicing is driving growth compared to last month."
                    : "Revenue has slowed compared to last month. It is worth a closer look at outstanding invoices."}
              </p>
              <Link
                href={ROUTES.docs}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25"
              >
                See your documents <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          )}
        </>
      )}

      {state === "loading" && <span className="sr-only">Loading reports</span>}
    </div>
  );
}