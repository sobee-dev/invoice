"use client";

import { useDashboardData } from "@/context/DashboardContext";
import { Eye, Plus, ReceiptText, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getReceipts } from "@/lib/repositories/receiptRepo";
import type { Receipt } from "@/lib/types";
import StatCard from "@/components/cards/StatCard";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const router = useRouter();
  const { business, user, loading: contextLoading } = useDashboardData();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getReceipts();
      setReceipts(data);
      setStatsLoading(false);
    }
    loadStats();
  }, []);

  // ── Derived stats ────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const totalRevenue = receipts.reduce((sum, r) => sum + r.grandTotal, 0);

  const todaysReceipts = receipts.filter(r => r.receiptDate === today);
  const todaysRevenue = todaysReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
  const todaysInvoiceCount = todaysReceipts.length;

  const existingCustomers = new Set(
    receipts
      .filter(r => r.receiptDate?.split('T')[0] !== today)
      .map(r => r.customerName?.trim().toLowerCase())
      .filter(Boolean)
  );

  const newCustomersToday = new Set(
    todaysReceipts
      .map(r => r.customerName?.trim().toLowerCase())
      .filter(Boolean)
  );

  const uniqueNewCustomers = [...newCustomersToday].filter(
    name => !existingCustomers.has(name)
  ).length;

  const formatAmount = (amount: number) =>
    `${business?.currency || '$'} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ─────────────────────────────────────────────────────────────────

  if (contextLoading || statsLoading) return <Loader />;

  return (
    <div className="space-y-6">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">
            Hello, {user?.email.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-[#45464f] mt-0.5">
            Here&apos;s what&apos;s happening with {business?.name} today.
          </p>
        </div>

        <button
          onClick={() => router.push("/new-receipt")}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)] text-sm"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatAmount(todaysRevenue)}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          trend={`${formatAmount(totalRevenue)} all time`}
        />
        <StatCard
          title="Invoices Issued Today"
          value={todaysInvoiceCount.toLocaleString()}
          icon={<ReceiptText size={18} className="text-[#1b2e5e]" />}
          trend={`${receipts.filter(r => r.syncStatus === 'pending').length} pending sync`}
        />
        <StatCard
          title="New Customers"
          value={uniqueNewCustomers.toLocaleString()}
          icon={<Users size={18} className="text-[#795900]" />}
          trend={`${existingCustomers.size} total customers`}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#c5c6d0] flex justify-between items-center">
          <h3 className="font-semibold text-[#1b1b1f] text-sm">Recent Invoices</h3>
          <button
            onClick={() => router.push("/dashboard/receipts")}
            className="text-xs text-[#1b2e5e] font-semibold hover:underline"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-[#e9ecef]">
          {receipts.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="px-5 py-4 flex justify-between items-center min-h-14 hover:bg-[#f5f3f8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#efedf2] rounded-lg">
                  <ReceiptText size={16} className="text-[#45464f]" />
                </div>
                <div>
                  <p className="font-medium text-[#1b1b1f] text-sm">
                    {r.customerName || "Walk-in"}
                  </p>
                  <p className="text-xs text-[#757680]">{r.receiptDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="font-semibold text-[#1b1b1f] text-sm">
                  {formatAmount(r.grandTotal)}
                </p>
                <button
                  onClick={() => router.push(`/preview/${r.id}`)}
                  className="p-2 text-[#757680] hover:text-[#1b2e5e] hover:bg-[#eef0f8] rounded-lg transition-colors"
                  title="View Receipt"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-[#757680]">
              No invoices yet. Create your first one!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
