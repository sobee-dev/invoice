"use client";

import { useDashboardData } from "@/context/DashboardContext";
import { Plus, ReceiptText, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getReceipts } from "@/lib/repositories/receiptRepo";
import type { Receipt } from "@/lib/types";
import StatCard from "@/components/cards/StatCard";

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

  const totalRevenue = receipts.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalInvoices = receipts.length;

  if (contextLoading || statsLoading) return <div className="p-8">Loading stats...</div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hello, {user?.email.split('@')[0]} 👋
          </h1>
          <p className="text-slate-500">Here is what is happening with {business?.name} today.</p>
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
        <StatCard 
          title="Total Revenue" 
          value={`${business?.currency || 'USD'} ${totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-600" />}
          trend="+12.5% from last month"
        />
        <StatCard 
          title="Invoices Issued" 
          value={totalInvoices.toString()} 
          icon={<ReceiptText className="text-blue-600" />}
          trend={`${receipts.filter(r => r.syncStatus === 'pending').length} pending sync`}
        />
        <StatCard 
          title="Avg. Invoice Value" 
          value={`${business?.currency || 'USD'} ${(totalRevenue / (totalInvoices || 1)).toFixed(2)}`} 
          icon={<Users className="text-purple-600" />}
        />
      </div>

      {/* Recent Activity Table (Preview) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
          <button onClick={() => router.push("/receipts")} className="text-sm text-blue-600 font-medium hover:underline">
            View All
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {receipts.slice(0, 5).map((r) => (
            <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <ReceiptText size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{r.customerName || "Walk-in"}</p>
                  <p className="text-xs text-slate-500">{r.receiptDate}</p>
                </div>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {business?.currency} {r.grandTotal}
              </p>
            </div>
          ))}
          {receipts.length === 0 && <p className="p-8 text-center text-slate-400">No invoices yet. Create your first one!</p>}
        </div>
      </div>
    </div>
  );
}

