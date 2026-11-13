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
  const { summary, report, customers, unpaidCount, isLoading, reload } = useDashboardData();

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

  const greetingName = user?.firstName || user?.email?.split("@")[0] || "Administrator";

  return (
    // Mobile (<640px): flex column so sections can be reordered with `order-*`.
    // sm and up: plain block, exactly like the original desktop layout.
    <div className="flex flex-col sm:block">
      {/* Header.
          Mobile: business name, then the welcome line, then the New Document button below.
          sm and up: the original heading with the button on the right. */}
      <div className="flex flex-wrap items-end justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        {/* Mobile title block */}
        <div className="sm:hidden">
          <h1 className="text-lg font-bold text-primary">{business?.name || "..."}</h1>
          <p className="mt-0.5 text-xs text-on-surface-variant">Welcome back, {greetingName}</p>
        </div>

        {/* Desktop title block (original) */}
        <div className="hidden sm:block">
          <h1 className="text-headline-lg font-bold text-primary">Welcome back, {greetingName}</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant" suppressHydrationWarning>
            Overview for <span className="font-semibold text-xl text-primary">{business?.name || "..."} </span>, Today is{" "}
            {fmtLongDate()}
          </p>
        </div>

        {/* `zoom` shrinks the button's text, padding and icon together on mobile only.
            On mobile the button sits at the left edge, so the menu opens rightwards from it. */}
        <div className="flex gap-3 max-sm:[zoom:0.9]">
          <NewDocumentMenu mobileAlign="left" />
        </div>
      </div>

      {/* Plan card: scaled down on mobile. `contents` = no wrapper at all on desktop. */}
      <div className="contents max-sm:block max-sm:[zoom:0.85]">
        <UsageBanner />
      </div>

      {/* Stats: untouched */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
          icon={lowStock > 0 ? "warning" : "check_circle"}
          iconBg={lowStock > 0 ? "bg-error-container" : "bg-[#e8f5e9]"}
          iconColor={lowStock > 0 ? "text-error" : "text-[#2e7d32]"}
          tone={summary ? (lowStock > 0 ? "alert" : "success") : "default"}
          label="Stock Alerts"
          value={summary ? `${lowStock} ${lowStock === 1 ? "Item" : "Items"}` : dash}
          sub={lowStock === 0 && summary ? "All items above threshold" : "Below safety threshold"}
          badge={summary ? { text: lowStock > 0 ? "Urgent" : "All clear", tone: lowStock > 0 ? "red" : "green" } : undefined}
        />
      </div>

      {/* Chart + side cards. On mobile this comes after Recent Documents (order-2). */}
      <div className="order-2 mt-6 grid grid-cols-1 gap-4 max-sm:gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Not scaled here: chart sizing needs a change inside RevenueChart (see notes) */}
          <RevenueChart points={toRevenuePoints(series)} symbol={symbol} />
        </div>
        <div className="flex flex-col gap-4 max-sm:gap-3">
          <div className="contents max-sm:block max-sm:[zoom:0.9]">
            <InventorySyncCard
              title="Inventory Health"
              description={
                summary && lowStock > 0
                  ? `${lowStock} ${lowStock === 1 ? "product is" : "products are"} below the safety threshold. Restock before you run out.`
                  : "Track stock levels and reorder before you run out."
              }
              ctaLabel="Manage Stock"
              href={ROUTES.products}
            />
          </div>
          <div className="contents max-sm:block max-sm:[zoom:0.9]">
            <TopCustomers customers={toTopCustomers(customers?.topClients ?? [])} symbol={symbol} />
          </div>
        </div>
      </div>

      {/* On mobile this moves up above the chart (order-1), like the app. */}
      <div className="order-1 mt-6">
        <div className="contents max-sm:block max-sm:[zoom:0.9]">
          <RecentDocuments
            docs={recentDocs}
            fallbackCurrency={business?.currency ?? "USD"}
            isLoading={isLoading}
            failed={summaryFailed}
            onRetry={reload}
          />
        </div>
      </div>

      <AdBanner placement="dashboard-footer" className="order-3 mt-6" />
    </div>
  );
}