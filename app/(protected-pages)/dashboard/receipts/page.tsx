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

      if (data.length > 0) {
        const mostRecent = data.reduce((a, b) =>
          a.receiptDate > b.receiptDate ? a : b
        );
        const monthKey = mostRecent.receiptDate?.slice(0, 7);
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

    const map = new Map<string, Receipt[]>();
    for (const r of sorted) {
      const key = r.receiptDate?.slice(0, 7) ?? "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1));
  }, [receipts, search, sortKey, sortOrder]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">All Invoices</h1>
          <p className="text-xs text-[#757680] mt-0.5">
            {receipts.length} total receipt{receipts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757680]" />
          <input
            type="text"
            placeholder="Search by customer or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-11 rounded-lg border border-[#dee2e6] bg-white text-sm text-[#1b1b1f] placeholder:text-[#757680] focus:outline-none focus:border-[#1b2e5e] transition-colors"
          />
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort("date")}
            className={`flex items-center gap-1.5 px-3 h-11 rounded-lg border text-sm font-medium transition-colors ${
              sortKey === "date"
                ? "bg-[#1b2e5e] text-white border-[#1b2e5e]"
                : "bg-white border-[#c5c6d0] text-[#45464f] hover:border-[#1b2e5e]/40"
            }`}
          >
            <Calendar size={14} />
            Date
            {sortKey === "date" && <ArrowUpDown size={12} className="opacity-70" />}
          </button>

          <button
            onClick={() => toggleSort("customerName")}
            className={`flex items-center gap-1.5 px-3 h-11 rounded-lg border text-sm font-medium transition-colors ${
              sortKey === "customerName"
                ? "bg-[#1b2e5e] text-white border-[#1b2e5e]"
                : "bg-white border-[#c5c6d0] text-[#45464f] hover:border-[#1b2e5e]/40"
            }`}
          >
            <User size={14} />
            Name
            {sortKey === "customerName" && <ArrowUpDown size={12} className="opacity-70" />}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="py-20 text-center text-[#757680]">
          <ReceiptText size={36} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium text-sm">No invoices found</p>
          {search && <p className="text-xs mt-1">Try a different search term</p>}
        </div>
      )}

      {/* Monthly Groups */}
      <div className="space-y-3">
        {grouped.map(([monthKey, monthReceipts]) => {
          const isOpen = openMonths.has(monthKey);
          const monthTotal = monthReceipts.reduce((s, r) => s + r.grandTotal, 0);

          return (
            <div
              key={monthKey}
              className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] overflow-hidden"
            >
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f3f8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#1b1b1f] text-sm">
                    {formatMonthLabel(monthKey)}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#efedf2] text-[#45464f]">
                    {monthReceipts.length} invoice{monthReceipts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#1b1b1f]">
                    {formatAmount(monthTotal)}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-[#757680] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {/* Receipt Rows */}
              {isOpen && (
                <div className="divide-y divide-[#e9ecef] border-t border-[#c5c6d0]">
                  {monthReceipts.map((r) => (
                    <div
                      key={r.id}
                      className="px-5 py-4 flex justify-between items-center min-h-14 hover:bg-[#f5f3f8] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#efedf2] rounded-lg">
                          <ReceiptText size={15} className="text-[#45464f]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1b1b1f] text-sm">
                            {r.customerName || "Walk-in"}
                          </p>
                          <p className="text-xs text-[#757680]">
                            {r.receiptNumber} · {r.receiptDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#1b1b1f]">
                            {formatAmount(r.grandTotal)}
                          </p>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              r.isPaid
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {r.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push(`/preview/${r.id}`)}
                          className="p-2 text-[#757680] hover:text-[#1b2e5e] hover:bg-[#eef0f8] rounded-lg transition-colors"
                          title="View Receipt"
                        >
                          <Eye size={15} />
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
