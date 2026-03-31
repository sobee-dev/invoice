"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, ReceiptText, Search, ChevronDown, ArrowUpDown, Calendar, User } from "lucide-react";
import { getReceipts } from "@/lib/repositories/receiptRepo";
import { useDashboardData } from "@/context/DashboardContext";
import type { Receipt } from "@/lib/types";
import Loader from "@/components/Loader";

type SortKey = "date" | "customerName";
type SortOrder = "asc" | "desc";

export default function ReceiptsPage() {
  const router = useRouter();
  const { business } = useDashboardData();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const data = await getReceipts();
      setReceipts(data);

      // Auto-open the most recent month
      if (data.length > 0) {
        const mostRecent = data.reduce((a, b) =>
          a.receiptDate > b.receiptDate ? a : b
        );
        const monthKey = mostRecent.receiptDate?.slice(0, 7); // "YYYY-MM"
        if (monthKey) setOpenMonths(new Set([monthKey]));
      }

      setLoading(false);
    }
    load();
  }, []);

  const formatAmount = (amount: number) =>
    `${business?.currency || "$"} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const toggleMonth = (monthKey: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // ── Filter + Sort + Group ───────────────────────────────────────────

  const grouped = useMemo(() => {
    const filtered = receipts.filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.customerName?.toLowerCase().includes(q) ||
        r.receiptNumber?.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: string, valB: string;
      if (sortKey === "date") {
        valA = a.receiptDate ?? "";
        valB = b.receiptDate ?? "";
      } else {
        valA = a.customerName?.toLowerCase() ?? "";
        valB = b.customerName?.toLowerCase() ?? "";
      }
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    // Group by "YYYY-MM"
    const map = new Map<string, Receipt[]>();
    for (const r of sorted) {
      const key = r.receiptDate?.slice(0, 7) ?? "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    // Sort month keys descending (most recent first)
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1));
  }, [receipts, search, sortKey, sortOrder]);

  // ───────────────────────────────────────────────────────────────────

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Invoices</h1>
          <p className="text-sm text-slate-500">{receipts.length} total receipts</p>
        </div>
      </div>

      {/* Search + Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort("date")}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-colors ${
              sortKey === "date"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            <Calendar size={14} />
            Date
            {sortKey === "date" && (
              <ArrowUpDown size={12} className="opacity-70" />
            )}
          </button>

          <button
            onClick={() => toggleSort("customerName")}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-colors ${
              sortKey === "customerName"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            <User size={14} />
            Name
            {sortKey === "customerName" && (
              <ArrowUpDown size={12} className="opacity-70" />
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <ReceiptText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No invoices found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      )}

      {/* Monthly Groups */}
      <div className="space-y-4">
        {grouped.map(([monthKey, monthReceipts]) => {
          const isOpen = openMonths.has(monthKey);
          const monthTotal = monthReceipts.reduce((s, r) => s + r.grandTotal, 0);

          return (
            <div
              key={monthKey}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Month Header — clickable to collapse */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatMonthLabel(monthKey)}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {monthReceipts.length} invoice{monthReceipts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {formatAmount(monthTotal)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {/* Receipt Rows */}
              {isOpen && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                  {monthReceipts.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <ReceiptText size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {r.customerName || "Walk-in"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.receiptNumber} · {r.receiptDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {formatAmount(r.grandTotal)}
                          </p>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wide ${
                              r.isPaid
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            {r.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push(`/preview/${r.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                          title="View Receipt"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}