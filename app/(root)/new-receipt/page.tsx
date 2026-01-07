"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DraftItem, ReceiptDraft, Business } from "@/lib/types";
import { calculateReceiptTotals } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getNextReceiptNumber, saveReceipt } from "@/lib/repositories/receiptRepo";

export default function NewReceiptPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<ReceiptDraft>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    receiptDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    notes: "",
    items: [],
    taxEnabled: false,
    taxRate: 0.1,
    discount: 0,
  });

  const [currentItem, setCurrentItem] = useState<Omit<DraftItem, "id">>({
    description: "",
    quantity: 1,
    unitPrice: 0,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; itemId: string | null }>({
    show: false,
    itemId: null,
  });

  useEffect(() => {
    async function init() {
      const biz = await getBusiness();
      if (!biz || !biz.onboardingComplete) {
        router.replace("/onboarding");
        return;
      }
      setBusiness(biz);

      const nextNo = await getNextReceiptNumber();
      setDraft((prev) => ({
        ...prev,
        receiptNumber: nextNo,
        taxEnabled: biz.taxEnabled,
        taxRate: biz.taxRate,
      }));
      setLoading(false);
    }
    init();
  }, [router]);

  const { subtotal, taxAmount, grandTotal } = calculateReceiptTotals(
    draft.items,
    draft.taxEnabled,
    draft.taxRate,
    draft.discount
  );

  const handleDraftChange = (field: keyof ReceiptDraft, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (!currentItem.description.trim() || currentItem.unitPrice <= 0) {
      alert("Please enter item description and price");
      return;
    }

    const newItem: DraftItem = {
      id: editingItemId || crypto.randomUUID(),
      description: currentItem.description.trim(),
      quantity: currentItem.quantity || 1,
      unitPrice: currentItem.unitPrice,
    };

    if (editingItemId) {
      setDraft((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === editingItemId ? newItem : item
        ),
      }));
      setEditingItemId(null);
    } else {
      setDraft((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }

    setCurrentItem({ description: "", quantity: 1, unitPrice: 0 });
  };

  const handleEditItem = (item: DraftItem) => {
    setEditingItemId(item.id);
    setCurrentItem({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  };

  const handleDeleteItem = (id: string) => {
    setDeleteModal({ show: true, itemId: id });
  };

  const confirmDelete = () => {
    if (deleteModal.itemId) {
      setDraft((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== deleteModal.itemId),
      }));
    }
    setDeleteModal({ show: false, itemId: null });
  };

  const handleSave = async () => {
    if (draft.items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const receipt = await saveReceipt(draft);
      router.push(`/preview/${receipt.id}`);
    } catch (error) {
      console.error("Failed to save receipt:", error);
      alert("Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (draft.items.length === 0) {
      alert("Please add at least one item to preview");
      return;
    }
    sessionStorage.setItem("receiptDraft", JSON.stringify(draft));
    router.push("/preview/draft");
  };

  const formatCurrency = (amount: number) => {
    return `${business?.currency || "USD"} ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Receipt</h2>
        <div className="w-10" />
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* Customer Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            Customer & Receipt Info
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                value={draft.customerName}
                onChange={(e) => handleDraftChange("customerName", e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter customer name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  value={draft.customerPhone}
                  onChange={(e) => handleDraftChange("customerPhone", e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={draft.customerEmail}
                  onChange={(e) => handleDraftChange("customerEmail", e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Date
                </label>
                <input
                  type="date"
                  value={draft.receiptDate}
                  onChange={(e) => handleDraftChange("receiptDate", e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Receipt No.
                </label>
                <div className="h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 flex items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {draft.receiptNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Item Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            {editingItemId ? "Edit Item" : "Add Item"}
          </h3>

          <div className="flex flex-col sm:flex-row items-end gap-2 mb-4">
            <div className="flex-1 w-full">
              <input
                value={currentItem.description}
                onChange={(e) =>
                  setCurrentItem((prev) => ({ ...prev, description: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                placeholder="Item description"
              />
            </div>
            <div className="w-full sm:w-24">
              <input
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
                className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-center text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                placeholder="Qty"
              />
            </div>
            <div className="w-full sm:w-32">
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentItem.unitPrice || ""}
                onChange={(e) =>
                  setCurrentItem((prev) => ({
                    ...prev,
                    unitPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="h-12 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-right text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                placeholder="Price"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="h-12 w-full sm:w-auto px-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {editingItemId ? "Update" : "Add"}
            </button>
          </div>

          {/* Items Table */}
          {draft.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Description
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Qty
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Total
                    </th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-3 px-2 text-slate-900 dark:text-white">
                        {item.description}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900 dark:text-white">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400"
                            title="Edit item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400"
                            title="Delete item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes & Totals */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => handleDraftChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              placeholder="Add any special instructions or remarks..."
            />
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleDraftChange("taxEnabled", !draft.taxEnabled)}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Tax ({(draft.taxRate * 100).toFixed(0)}%){" "}
                  {draft.taxEnabled ? "✓" : "○"}
                </button>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            className="flex-1 h-14 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-14 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Receipt"}
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Delete Item?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this item?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, itemId: null })}
                className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
