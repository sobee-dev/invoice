"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DraftItem, ReceiptDraft, Business } from "@/lib/types";
import { calculateReceiptTotals } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getNextReceiptNumber, saveReceipt } from "@/lib/repositories/receiptRepo";
import { useSync } from "@/lib/syncToServer";
import Loader from "@/components/Loader";

/* Shared classes */
const inputCls = "w-full h-12 px-4 rounded-lg border border-[#dee2e6] bg-white text-[#1b1b1f] focus:border-[#1b2e5e] focus:outline-none transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5";

export default function NewReceiptPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { syncOutbox } = useSync();

  const [draft, setDraft] = useState<ReceiptDraft>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    receiptDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    notes: "",
    items: [],
    taxEnabled: false,
    taxRate: 0.0,
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
        items: prev.items.map((item) => (item.id === editingItemId ? newItem : item)),
      }));
      setEditingItemId(null);
    } else {
      setDraft((prev) => ({ ...prev, items: [...prev.items, newItem] }));
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
      sessionStorage.removeItem("receiptDraft");
      if (navigator.onLine) {
        syncOutbox().catch(err => console.warn("Background sync failed:", err));
      }
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
    const currencyCode = business?.currency || "NGN";
    const formattedAmount = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencyCode} ${formattedAmount}`;
  };

  if (loading || saving) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fbf8fd] pb-32">

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#c5c6d0] bg-white/90 backdrop-blur-sm px-4 py-3.5">
        <button
          onClick={() => router.replace("/dashboard")}
          className="p-2 -ml-2 text-[#45464f] hover:text-[#1b1b1f] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-[#1b1b1f]">New Receipt</h2>
        <div className="w-9" />
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 space-y-4">

        {/* Customer & Receipt Info */}
        <div className="bg-white rounded-xl p-5 shadow-[0px_2px_4px_rgba(27,46,94,0.05)] border border-[#c5c6d0]">
          <h3 className="text-sm font-semibold text-[#1b1b1f] mb-4">
            Customer &amp; Receipt Info
          </h3>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Customer Name</label>
              <input
                value={draft.customerName}
                onChange={(e) => handleDraftChange("customerName", e.target.value)}
                className={inputCls}
                placeholder="Enter customer name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  value={draft.customerPhone}
                  onChange={(e) => handleDraftChange("customerPhone", e.target.value)}
                  className={inputCls}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={draft.customerEmail}
                  onChange={(e) => handleDraftChange("customerEmail", e.target.value)}
                  className={inputCls}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Receipt Date</label>
                <input
                  type="date"
                  value={draft.receiptDate}
                  onChange={(e) => handleDraftChange("receiptDate", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Receipt No.</label>
                <div className="h-12 px-4 rounded-lg border border-[#c5c6d0] bg-[#f5f3f8] flex items-center">
                  <span className="font-semibold text-[#1b1b1f] text-sm">
                    {draft.receiptNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Item */}
        <div className="bg-white rounded-xl p-5 shadow-[0px_2px_4px_rgba(27,46,94,0.05)] border border-[#c5c6d0]">
          <h3 className="text-sm font-semibold text-[#1b1b1f] mb-4">
            {editingItemId ? "Edit Item" : "Add Item"}
          </h3>

          <div className="flex flex-col sm:flex-row items-end gap-2 mb-4">
            <div className="flex-1 w-full">
              <input
                value={currentItem.description}
                onChange={(e) => setCurrentItem((prev) => ({ ...prev, description: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className={inputCls}
                placeholder="Item description"
              />
            </div>
            <div className="w-full sm:w-24">
              <input
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                }
                className={`${inputCls} text-center`}
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
                  setCurrentItem((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className={`${inputCls} text-right`}
                placeholder="Price"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="h-12 w-full sm:w-auto px-5 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-semibold transition-colors"
            >
              {editingItemId ? "Update" : "Add"}
            </button>
          </div>

          {/* Items Table */}
          {draft.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#c5c6d0]">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#757680] uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-[#757680] uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-[#757680] uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-[#757680] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((item) => (
                    <tr key={item.id} className="border-b border-[#e9ecef] min-h-14">
                      <td className="py-3.5 px-2 text-sm text-[#1b1b1f]">{item.description}</td>
                      <td className="py-3.5 px-2 text-center text-sm text-[#1b1b1f]">{item.quantity}</td>
                      <td className="py-3.5 px-2 text-right text-sm text-[#1b1b1f]">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3.5 px-2 text-right text-sm font-medium text-[#1b1b1f]">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded-lg bg-[#eef0f8] text-[#1b2e5e] hover:bg-[#1b2e5e] hover:text-white transition-colors"
                            title="Edit item"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-colors"
                            title="Delete item"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="bg-white rounded-xl p-5 shadow-[0px_2px_4px_rgba(27,46,94,0.05)] border border-[#c5c6d0]">
          <div className="mb-4">
            <label className={labelCls}>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => handleDraftChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#dee2e6] bg-white p-4 text-sm text-[#1b1b1f] focus:border-[#1b2e5e] focus:outline-none transition-colors resize-none"
              placeholder="Add any special instructions or remarks..."
            />
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-[#c5c6d0] bg-[#f5f3f8] p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#45464f]">Subtotal</span>
                <span className="font-medium text-[#1b1b1f]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => handleDraftChange("taxEnabled", !draft.taxEnabled)}
                  className="text-[#45464f] hover:text-[#1b1b1f] transition-colors flex items-center gap-1"
                >
                  Tax ({(draft.taxRate * 100).toFixed(0)}%){" "}
                  <span className={`text-xs font-semibold ${draft.taxEnabled ? "text-emerald-600" : "text-[#757680]"}`}>
                    {draft.taxEnabled ? "ON" : "OFF"}
                  </span>
                </button>
                <span className="font-medium text-[#1b1b1f]">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="border-t border-dashed border-[#c5c6d0] my-1" />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1b1b1f]">Grand Total</span>
                <span className="text-base font-bold text-[#1b2e5e]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="flex-1 h-13 rounded-lg border border-[#1b2e5e] text-[#1b2e5e] text-sm font-semibold hover:bg-[#eef0f8] transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-13 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-semibold disabled:opacity-50 transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
          >
            {saving ? "Saving..." : "Save Receipt"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-[0px_8px_16px_rgba(27,46,94,0.12)] border border-[#c5c6d0] max-w-sm mx-4">
            <h3 className="text-base font-bold text-[#1b1b1f] mb-1">Delete Item?</h3>
            <p className="text-sm text-[#45464f] mb-5">
              Are you sure you want to delete this item?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, itemId: null })}
                className="flex-1 h-11 rounded-lg border border-[#c5c6d0] text-[#1b1b1f] text-sm font-semibold hover:bg-[#f5f3f8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-sm font-semibold transition-colors"
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
