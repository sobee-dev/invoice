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

  // All-time
  const totalRevenue = receipts.reduce((sum, r) => sum + r.grandTotal, 0);

  // Today only
  const todaysReceipts = receipts.filter(r => r.receiptDate === today);
  const todaysRevenue = todaysReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
  const todaysInvoiceCount = todaysReceipts.length;

  // Unique customers by name across all receipts — excludes walk-ins
 // All customer names from receipts before today
  const existingCustomers = new Set(
    receipts
      .filter(r => r.receiptDate?.split('T')[0] !== today)
      .map(r => r.customerName?.trim().toLowerCase())
      .filter(Boolean)
  );

  // Today's customers who are NOT in the historical set
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

  if (contextLoading || statsLoading) {return <Loader/>};

  return (
    <div className="space-y-8">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hello, {user?.email.split('@')[0]} 👋
          </h1>
          <p className="text-slate-500">
            Here is what is happening with {business?.name} today.
          </p>
        </div>

        <button
          onClick={() => router.push("/new-receipt")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Today's revenue — matches the "today" framing of the header */}
        <StatCard
          title="Today's Revenue"
          value={formatAmount(todaysRevenue)}
          icon={<TrendingUp className="text-emerald-600" />}
          trend={`${formatAmount(totalRevenue)} all time`}
        />

        {/* Invoices issued today — now actually filtered by today */}
        <StatCard
          title="Invoices Issued Today"
          value={todaysInvoiceCount.toLocaleString()}
          icon={<ReceiptText className="text-blue-600" />}
          trend={`${receipts.filter(r => r.syncStatus === 'pending').length} pending sync`}
        />

        {/* Unique customers — derived from real data, not a division */}
        <StatCard
          title="New Customers"
          value={uniqueNewCustomers.toLocaleString()}
          icon={<Users className="text-purple-600" />}
          trend={`${existingCustomers.size} total customers`}
        />

      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
          <button
            onClick={() => router.push("/dashboard/receipts")}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {receipts.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <ReceiptText size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {r.customerName || "Walk-in"}
                  </p>
                  <p className="text-xs text-slate-500">{r.receiptDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="font-bold text-slate-900 dark:text-white">
                  {formatAmount(r.grandTotal)}
                </p>
                <button
                  onClick={() => router.push(`/preview/${r.id}`)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                  title="View Receipt"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <p className="p-8 text-center text-slate-400">
              No invoices yet. Create your first one!
            </p>
          )}
        </div>
      </div>

    </div>
  );
}