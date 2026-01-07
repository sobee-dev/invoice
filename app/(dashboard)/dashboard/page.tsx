"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Receipt, Business } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getReceipts, deleteReceipt } from "@/lib/repositories/receiptRepo";

export default function DashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; receiptId: string | null }>({
    show: false,
    receiptId: null,
  });

  useEffect(() => {
    async function load() {
      const biz = await getBusiness();
      if (!biz || !biz.onboardingComplete) {
        router.replace("/onboarding");
        return;
      }
      setBusiness(biz);

      const allReceipts = await getReceipts();
      setReceipts(allReceipts);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleDelete = async () => {
    if (!deleteModal.receiptId) return;
    await deleteReceipt(deleteModal.receiptId);
    setReceipts((prev) => prev.filter((r) => r.id !== deleteModal.receiptId));
    setDeleteModal({ show: false, receiptId: null });
  };

  const formatCurrency = (amount: number) => {
    return `${business?.currency || "USD"} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {business?.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard</p>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Receipts</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{receipts.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(receipts.reduce((sum, r) => sum + r.grandTotal, 0))}
            </p>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Receipts</h2>
          </div>

          {receipts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">No receipts yet</p>
              <button
                onClick={() => router.push("/new-receipt")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Receipt
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/preview/${receipt.id}`)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {receipt.receiptNumber.replace("#", "")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {receipt.customerName || "Walk-in Customer"}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(receipt.receiptDate)}
                          </p>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(receipt.grandTotal)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            receipt.syncStatus === "synced"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                          }`}
                        >
                          {receipt.syncStatus === "synced" ? "Synced" : "Pending"}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteModal({ show: true, receiptId: receipt.id })}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - New Receipt */}
      <button
        onClick={() => router.push("/new-receipt")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Delete Receipt?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, receiptId: null })}
                className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-12 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
