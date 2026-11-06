// app/(owner)/reports/outstanding/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { Icon } from "@/components/layout/Icon";
import { StockBadge } from "@/components/payments/StockBadge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { clientPaymentsRoute, invoicePaymentsRoute, ROUTES } from "@/lib/routes";
import { OutstandingInvoice, OutstandingResponse, paymentService } from "@/services/payments";
import { OutstandingOverview, reportService } from "@/services/reports";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtShortDate } from "@/utils/formatDate";
import { fmtMoney } from "@/utils/money";
import { toNumber } from "@/utils/paymentFormat";

const PAGE_SIZE = 20;

export default function OutstandingReportPage() {
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const money = (v: string | number) => fmtMoney(toNumber(v), symbol, 2);

  const [overview, setOverview] = useState<OutstandingOverview | null>(null);
  const [summary, setSummary] = useState<OutstandingResponse["summary"] | null>(null);
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [o, page] = await Promise.all([
        reportService.getOutstanding(),
        paymentService.outstanding({ limit: PAGE_SIZE, offset: 0 }),
      ]);
      setOverview(o);
      setSummary(page.summary);
      setInvoices(page.results);
      setHasMore(!!page.next);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await paymentService.outstanding({ limit: PAGE_SIZE, offset: invoices.length });
      setInvoices((prev) => [...prev, ...page.results]);
      setHasMore(!!page.next);
    } finally {
      setLoadingMore(false);
    }
  };

  const back = (
    <PageHeader
      title="Outstanding invoices"
      subtitle="Unpaid money across all your customers."
      backHref={ROUTES.reports}
      backLabel="Reports"
    />
  );

  if (state === "error") {
    return (
      <div className="space-y-6">
        {back}
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="cloud_off"
            title="We could not load outstanding invoices"
            description="Please check your connection and try again."
            action={
              <button type="button" onClick={load} className={btnNavy}>
                Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const loading = state === "loading" || !overview || !summary;
  const dash = "...";
  const maxBucket = Math.max(1, ...(overview?.ageing ?? []).map((b) => toNumber(b.amount)));

  return (
    <div className="space-y-6">
      {back}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="account_balance_wallet" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
          label="Total outstanding"
          value={loading ? dash : money(summary!.totalOutstanding)}
          sub="Still owed to you right now"
        />
        <StatCard
          icon="receipt_long" iconBg="bg-primary-fixed" iconColor="text-light-blue"
          label="Unpaid invoices"
          value={loading ? dash : String(summary!.invoiceCount)}
          sub="With a balance above zero"
        />
        <StatCard
          icon="groups" iconBg="bg-secondary-fixed" iconColor="text-secondary"
          label="Customers owing"
          value={loading ? dash : String(summary!.customerCount)}
          sub="Distinct customers"
        />
      </div>

      {!loading && overview && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="How old is the debt">
            <ul className="space-y-4">
              {overview.ageing.map((b, i) => {
                const amt = toNumber(b.amount);
                return (
                  <li key={b.label}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-semibold text-on-surface">{b.label}</span>
                      <span className={`font-bold ${i >= 2 && amt > 0 ? "text-error" : "text-on-surface"}`}>{money(amt)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className={`h-full rounded-full ${i >= 2 ? "bg-error" : "bg-primary-container"}`}
                        style={{ width: `${Math.round((amt / maxBucket) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Who owes the most" bodyClassName="p-0">
            {overview.topDebtors.length === 0 ? (
              <EmptyState icon="task_alt" title="Nobody owes you anything" />
            ) : (
              <ul className="divide-y divide-outline-variant/60">
                {overview.topDebtors.slice(0, 6).map((d) => (
                  <li key={d.customerId}>
                    <Link
                      href={clientPaymentsRoute(d.customerId)}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-low/60"
                    >
                      <Avatar name={d.fullName} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-on-surface">{d.fullName}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {d.invoiceCount} unpaid invoice{d.invoiceCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-error">{money(d.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      <SectionCard title="Unpaid invoices, oldest first" bodyClassName="p-0">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface-container-low" />
        ) : invoices.length === 0 ? (
          <EmptyState icon="task_alt" title="Nothing outstanding" description="Unpaid invoices will appear here as soon as you mark one as unpaid." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Issued</th>
                  <th className="px-3 py-3 text-right font-semibold">Age</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-low/60">
                    <td className="px-5 py-3 font-bold">
                      <Link href={invoicePaymentsRoute(inv.id)} className="text-primary hover:underline">
                        {inv.documentNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {inv.customer ? (
                        <Link href={clientPaymentsRoute(inv.customer)} className="text-on-surface hover:underline">
                          {inv.customerName}
                        </Link>
                      ) : (
                        inv.customerName
                      )}
                    </td>
                    <td className="px-3 py-3 text-on-surface-variant">{fmtShortDate(inv.documentDate)}</td>
                    <td className={`px-3 py-3 text-right ${inv.daysOutstanding > 60 ? "font-semibold text-error" : "text-on-surface-variant"}`}>
                      {inv.daysOutstanding} day{inv.daysOutstanding === 1 ? "" : "s"}
                    </td>
                    <td className="px-3 py-3">
                      <StockBadge status={inv.stockStatus} compact />
                    </td>
                    <td className="px-5 py-3 text-right font-extrabold text-error">{money(inv.balanceDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasMore && (
          <div className="border-t border-outline-variant p-4 text-center">
            <button type="button" onClick={loadMore} disabled={loadingMore} className={btnOutline}>
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}