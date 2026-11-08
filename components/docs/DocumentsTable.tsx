// components/docs/DocumentsTable.tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { StockBadge } from "@/components/payments/StockBadge";
import { RowMenu, RowMenuItem } from "@/components/ui/RowMenu";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAuth } from "@/context/AuthContext";

import { DocumentRowData, TYPE_LABEL } from "@/lib/documents";
import { ROUTES } from "@/lib/routes";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getDisplayName } from "@/utils/displayName";
import { fmtShortDate } from "@/utils/formatDate";
import { fmtMoney } from "@/utils/money";

const DOT_COLORS = ["bg-blue-500", "bg-amber-400", "bg-slate-400", "bg-red-400", "bg-emerald-500"];

function dotFor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return DOT_COLORS[sum % DOT_COLORS.length];
}

const th = "px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant";
const bar = "animate-pulse rounded bg-surface-container";

function Skeleton({ count }: { count: number }) {
  return (
    <>
      <div className="hidden md:block">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-outline-variant px-6 py-6 last:border-b-0">
            <div className={`${bar} h-4 w-24`} />
            <div className={`${bar} h-4 w-24`} />
            <div className={`${bar} h-4 flex-1`} />
            <div className={`${bar} h-4 w-20`} />
            <div className={`${bar} h-4 w-20`} />
            <div className={`${bar} h-6 w-24 rounded-full`} />
            <div className={`${bar} h-6 w-16 rounded-full`} />
          </div>
        ))}
      </div>
      <ul className="space-y-3 p-4 md:hidden">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="rounded-xl border border-outline-variant p-4">
            <div className={`${bar} h-4 w-1/3`} />
            <div className={`${bar} mt-3 h-5 w-2/3`} />
            <div className={`${bar} mt-3 h-4 w-1/2`} />
          </li>
        ))}
      </ul>
    </>
  );
}

interface DocumentsTableProps {
  rows: DocumentRowData[];
  fallbackCurrency: string;
  isLoading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  rowActions?: (row: DocumentRowData) => RowMenuItem[];
  /** Where a row links to. Defaults to the owner document page. */
  hrefFor?: (row: DocumentRowData) => string;
}

export function DocumentsTable({
  rows,
  fallbackCurrency,
  isLoading = false,
  skeletonRows = 5,
  empty,
  rowActions,
  hrefFor,
}: DocumentsTableProps) {
  const { user } = useAuth();

  if (isLoading) return <Skeleton count={skeletonRows} />;
  if (rows.length === 0) return <>{empty ?? null}</>;

  const prepare = (row: DocumentRowData) => {
    const detailHref = hrefFor ? hrefFor(row) : `${ROUTES.docs}/${row.id}`;
    const menu: RowMenuItem[] = [
      { label: "View document", icon: "visibility", href: detailHref },
      {
        label: "Copy number",
        icon: "content_copy",
        onClick: () => navigator.clipboard?.writeText(row.documentNumber),
      },
      ...(rowActions?.(row) ?? []),
    ];
    return {
      detailHref,
      menu,
      number: row.documentNumber.startsWith("#") ? row.documentNumber : `#${row.documentNumber}`,
      amount: fmtMoney(row.amount, resolveCurrency(row.currency || fallbackCurrency).symbol, 2),
      creator: row.createdBy ? getDisplayName(row.createdBy, user) : null,
    };
  };

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-body-md">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={th}>Type</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>Stock</th>
              <th className={th}>Status</th>
              <th className={`${th} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((row) => {
              const v = prepare(row);
              return (
                <tr key={row.id} className="hover:bg-surface-container-low/60">
                  <td className="whitespace-nowrap px-6 py-5">
                    <Link href={v.detailHref} className="font-bold text-primary hover:underline">
                      {v.number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-on-surface">
                    {fmtShortDate(row.createdAt)}
                    {v.creator && <span className="block text-xs text-on-surface-variant">by {v.creator}</span>}
                  </td>
                  <td className="px-6 py-5">
                    {row.counterparty ? (
                      <span className="flex items-center gap-2 text-on-surface">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotFor(row.counterparty)}`} />
                        <span className="truncate">{row.counterparty}</span>
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-on-surface">{TYPE_LABEL[row.documentType] ?? row.documentType}</td>
                  <td className="whitespace-nowrap px-6 py-5 text-right font-bold text-primary">{v.amount}</td>
                  <td className="whitespace-nowrap px-6 py-5">
                    {row.stockStatus && row.stockStatus !== "not_applicable" ? (
                      <StockBadge status={row.stockStatus} />
                    ) : (
                      <span className="text-on-surface-variant">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-6 py-5 text-center">
                    <RowMenu items={v.menu} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 p-4 max-sm:space-y-2 max-sm:p-3 md:hidden">
        {rows.map((row) => {
          const v = prepare(row);
          return (
            <li key={row.id} className="rounded-xl border border-outline-variant/50 bg-white p-4 shadow-card max-sm:p-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={v.detailHref} className="text-xs font-bold uppercase tracking-wide text-primary-container hover:underline max-sm:text-[11px]">
                  {v.number}
                </Link>
                <p className="text-lg font-extrabold text-on-surface max-sm:text-base">{v.amount}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="font-bold text-on-surface max-sm:text-sm">{row.counterparty || "-"}</p>
                <span className="rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white max-sm:px-1.5 max-sm:text-[9px]">
                  {TYPE_LABEL[row.documentType] ?? row.documentType}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-on-surface-variant max-sm:text-[10px]">
                  {fmtShortDate(row.createdAt)}
                  {v.creator ? ` • ${v.creator}` : ""}
                </p>
                <div className="flex items-center gap-1.5 max-sm:gap-1">
                  <StockBadge status={row.stockStatus} />
                  <StatusChip status={row.status} />
                  <RowMenu items={v.menu} openUp />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}