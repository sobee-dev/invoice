"use client";

import { useMemo } from "react";
import { AdBanner } from "@/components/ads/AdBanner";
import { UsageBanner } from "@/components/billing/PlanBanners";
import { InventorySyncCard } from "@/components/dashboard/InventorySyncCard";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { TopCustomers } from "@/components/dashboard/TopCustomers";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ROUTES } from "@/lib/routes";
import { resolveCurrency } from "@/utils/currencySymbol";
import { toRevenuePoints, toTopCustomers } from "@/utils/dashboardAdapters";
import { fmtLongDate } from "@/utils/formatDate";
import { fmtMoney } from "@/utils/money";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { summary, report, customers, inventory, unpaidCount, isLoading, reload } = useDashboardData();

  const symbol = resolveCurrency(business?.currency ?? "USD").symbol;
  const dash = isLoading ? "..." : "—";
  const lowStock = summary?.lowStockCount ?? 0;
  const recentDocs = useMemo(() => summary?.recentDocuments?.slice(0, 4) ?? [], [summary]);
  const summaryFailed = !isLoading && summary === null;

  const newClientsWeek = summary?.newClientsThisWeek ?? 0;
  const newClientsMonth = summary?.newClientsThisMonth ?? 0;
  const totalClients = summary?.totalClientCount ?? 0;

  const series = report?.monthlyRevenue ?? [];
  const prev = series.length >= 2 ? Number(series[series.length - 2].value) : NaN;
  const growth = report?.revenueGrowth;
  const hasGrowth = !!growth && growth !== "—";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-primary">
            Welcome back, {user?.firstName || user?.email?.split("@")[0] || "Administrator"}
          </h1>
          <p className="mt-1 text-body-lg text-on-surface-variant" suppressHydrationWarning>
            Overview for <span className="font-semibold text-xl text-primary">{business?.name || "..."} </span>, Today is{" "}
            {fmtLongDate()}
          </p>
        </div>

        <div className="flex gap-3">
          <NewDocumentMenu />
        </div>
      </div>

      <UsageBanner />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="payments" iconBg="bg-primary-fixed" iconColor="text-light-blue"
          label="Monthly Revenue"
          value={summary ? fmtMoney(summary.monthlyRevenue, symbol) : dash}
          sub={Number.isFinite(prev) ? `vs. ${fmtMoney(prev, symbol)} last month` : "This month so far"}
          badge={hasGrowth ? { text: growth!, tone: growth!.startsWith("-") ? "red" : "green" } : undefined}
        />
        <StatCard
          icon="pending_actions" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
          label="Outstanding"
          value={report ? fmtMoney(report.outstandingTotal, symbol) : dash}
          sub={report ? `Collection rate: ${report.collectionRate}` : " "}
          badge={unpaidCount !== null ? { text: `${unpaidCount} Invoice${unpaidCount === 1 ? "" : "s"}`, tone: "orange" } : undefined}
        />
        <StatCard
          icon="group_add" iconBg="bg-secondary-fixed" iconColor="text-secondary"
          label="New Clients This Week"
          value={summary ? String(newClientsWeek) : dash}
          sub={summary ? `${totalClients.toLocaleString()} clients in total` : " "}
          badge={summary ? { text: `${newClientsMonth} this month`, tone: "blue" } : undefined}
        />
        <StatCard
          icon="error" iconBg="bg-error-container" iconColor="text-error"
          label="Stock Alerts"
          value={summary ? `${lowStock} ${lowStock === 1 ? "Item" : "Items"}` : dash}
          sub={lowStock === 0 && summary ? "All items above threshold" : "Below safety threshold"}
          badge={summary ? { text: lowStock > 0 ? "Urgent" : "All clear", tone: lowStock > 0 ? "red" : "green" } : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart points={toRevenuePoints(series)} symbol={symbol} />
        </div>
        <div className="flex flex-col gap-4">
          <InventorySyncCard
            title="Inventory Health"
            description={
              inventory
                ? `${inventory.skuCount.toLocaleString()} products tracked, ${lowStock} below their safety threshold.`
                : "Track stock levels and reorder before you run out."
            }
            ctaLabel="Manage Stock"
            href={ROUTES.products}
          />
          <TopCustomers customers={toTopCustomers(customers?.topClients ?? [])} symbol={symbol} />
        </div>
      </div>

      <div className="mt-6">
        <RecentDocuments
          docs={recentDocs}
          fallbackCurrency={business?.currency ?? "USD"}
          isLoading={isLoading}
          failed={summaryFailed}
          onRetry={reload}
        />
      </div>

      <AdBanner placement="dashboard-footer" className="mt-6" />
    </div>
  );
}