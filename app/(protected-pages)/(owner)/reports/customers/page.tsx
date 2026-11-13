// app/(owner)/reports/customers/page.tsx
"use client";


import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { ROUTES } from "@/lib/routes";

import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";
import { useCustomerAnalytics } from "@/hooks/useReports";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  card: "Card",
  check: "Check",
};

const paymentLabel = (pref: string) => PAYMENT_LABELS[pref] ?? pref;
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

function Panel({
  title,
  icon,
  tone = "default",
  children,
}: {
  title: string;
  icon: string;
  tone?: "default" | "alert";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border bg-white shadow-card ${
        tone === "alert" ? "border-error-container" : "border-outline-variant"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <Icon name={icon} size={20} className={tone === "alert" ? "text-error" : "text-on-surface-variant"} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function PersonRow({
  rank,
  name,
  sub,
  amount,
  amountClass,
  href,
}: {
  rank?: number;
  name: string;
  sub?: string;
  amount: string;
  amountClass: string;
  href?: string;
}) {
  const rowClass = "flex items-center gap-3 px-5 py-3";

  const content = (
    <>
      {rank !== undefined && (
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
            rank === 1 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {rank}
        </span>
      )}
      <Avatar name={name} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-on-surface">{name}</span>
        {sub && <span className="block truncate text-xs text-on-surface-variant">{sub}</span>}
      </span>
      <span className={`text-sm font-bold ${amountClass}`}>{amount}</span>
      {href && <Icon name="chevron_right" size={18} className="shrink-0 text-on-surface-variant" />}
    </>
  );

  return (
    <li className="border-b border-outline-variant/60 last:border-b-0">
      {href ? (
        <Link href={href} className={`${rowClass} transition-colors hover:bg-surface-container-low/60`}>
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}

export default function CustomerAnalyticsPage() {
  const { business } = useBusiness();
  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";

  const { data, state, reload: load } = useCustomerAnalytics();

  const back = (
    <Link
      href={ROUTES.reports}
      className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-container hover:underline"
    >
      <Icon name="arrow_back" size={16} /> Reports
    </Link>
  );

  if (state === "error") {
    return (
      <div className="space-y-6">
        <div>
          {back}
          <PageHeader title="Customer analytics" subtitle="Client performance overview." />
        </div>
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="cloud_off"
            title="We could not load customer analytics"
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

  const d = data;
  const dash = "...";
  const topClients = d?.topClients ?? [];
  const balanceDue = d?.balanceDueClients ?? [];
  const breakdown = d?.paymentBreakdown ?? [];
  const total = d?.totalCustomers ?? 0;

  return (
    <div className="space-y-6">
      <div>
        {back}
        <PageHeader title="Customer analytics" subtitle="Client performance overview." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="groups" iconBg="bg-primary-fixed" iconColor="text-light-blue"
          label="Total clients"
          value={d ? String(d.totalCustomers) : dash}
          sub="All customers on record"
        />
        <StatCard
          icon="check_circle" iconBg="bg-status-paid-bg" iconColor="text-status-paid-fg"
          label="Active"
          value={d ? String(d.activeCount) : dash}
          sub={d ? `${d.inactiveCount} inactive` : " "}
        />
        <StatCard
          icon="pending_actions" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
          label="Balance due"
          value={d ? String(d.balanceDueCount) : dash}
          sub={d ? (d.balanceDueCount > 0 ? `${fmtMoney(d.totalOutstanding, symbol, 2)} total` : "All settled") : " "}
          badge={d && d.balanceDueCount > 0 ? { text: "Follow up", tone: "orange" } : undefined}
        />
        <StatCard
          icon="trending_up" iconBg="bg-secondary-fixed" iconColor="text-secondary"
          label="Average lifetime value"
          value={d ? fmtMoney(d.avgLtv, symbol, 2) : dash}
          sub="Per customer"
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary-container p-6 max-sm:gap-3 max-sm:p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-secondary-container/70 max-sm:text-[10px]">
            Total lifetime revenue
          </p>
          <p className="mt-1 truncate text-3xl font-extrabold text-on-secondary-container max-sm:text-xl">
            {d ? fmtMoney(d.totalLtv, symbol, 2) : dash}
          </p>
        </div>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/10 text-on-secondary-container max-sm:h-10 max-sm:w-10 max-sm:rounded-xl">
          <Icon name="groups" size={28} mobileSize={20} />
        </span>
      </div>

      {state === "loading" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Top clients by lifetime value" icon="emoji_events">
              {topClients.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-on-surface-variant">
                  Paid invoices will rank your best clients here.
                </p>
              ) : (
                <ul>
                  {topClients.map((c, i) => (
                    <PersonRow
                      key={c.id}
                      rank={i + 1}
                      name={c.fullName}
                      sub={c.email}
                      amount={fmtMoney(c.lifetimeValue, symbol, 2)}
                      amountClass="text-primary-container"
                      href={`/clients/${c.id}`}
                    />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Customers with balance due" icon="warning" tone="alert">
              {balanceDue.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-on-surface-variant">
                  Nobody owes you anything right now.
                </p>
              ) : (
                <ul>
                  {balanceDue.map((c) => (
                    <PersonRow
                      key={c.id}
                      name={c.fullName}
                      sub={c.phone}
                      amount={fmtMoney(c.outstandingBalance, symbol, 2)}
                      amountClass="text-error"
                      href={`/clients/${c.id}`}
                    />
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Payment preferences" icon="credit_card">
              {breakdown.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-on-surface-variant">No payment data yet.</p>
              ) : (
                <ul>
                  {breakdown.map((p) => (
                    <li key={p.preference} className="border-b border-outline-variant/60 px-5 py-4 last:border-b-0">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-semibold text-on-surface">{paymentLabel(p.preference)}</span>
                        <span className="text-on-surface-variant">
                          {p.count} client{p.count === 1 ? "" : "s"} · {pct(p.count, total)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-primary-container"
                          style={{ width: `${pct(p.count, total)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Status breakdown" icon="donut_large">
              <div className="grid grid-cols-2 gap-4 p-5">
                {([
                  { key: "Active", count: d?.activeCount ?? 0, cls: "text-status-paid-fg" },
                  { key: "Inactive", count: d?.inactiveCount ?? 0, cls: "text-on-surface-variant" },
                ] as const).map((s) => (
                  <div key={s.key} className="rounded-xl bg-surface-container-low p-4 text-center">
                    <p className={`text-3xl font-extrabold ${s.cls}`}>{s.count}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.key}</p>
                    <p className="text-xs text-on-surface-variant">{pct(s.count, total)}%</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}