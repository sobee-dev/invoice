"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import type { Business, Receipt, ReceiptItem, ReceiptDraft, DraftItem } from "@/lib/types";
import { calculateReceiptTotals } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getReceiptWithItems, saveReceipt } from "@/lib/repositories/receiptRepo";
import { ReceiptRenderer } from "@/components/templates";

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [draftData, setDraftData] = useState<ReceiptDraft | null>(null);

  useEffect(() => {
    async function load() {
      const biz = await getBusiness();
      if (!biz) {
        router.replace("/onboarding");
        return;
      }
      setBusiness(biz);

      // Check if this is a draft preview
      if (id === "draft") {
        const draftJson = sessionStorage.getItem("receiptDraft");
        if (!draftJson) {
          router.replace("/new-receipt");
          return;
        }

        const draft: ReceiptDraft = JSON.parse(draftJson);
        setDraftData(draft);
        setIsDraft(true);

        // Convert draft to receipt format for preview
        const { subtotal, taxAmount, grandTotal } = calculateReceiptTotals(
          draft.items,
          draft.taxEnabled,
          draft.taxRate,
          draft.discount
        );

        const previewReceipt: Receipt = {
          id: "draft",
          businessId: biz.id,
          templateId: biz.selectedTemplateId,
          receiptNumber: draft.receiptNumber,
          receiptDate: draft.receiptDate,
          customerName: draft.customerName,
          customerPhone: draft.customerPhone || undefined,
          customerEmail: draft.customerEmail || undefined,
          subtotal,
          taxRate: draft.taxRate,
          taxAmount,
          discount: draft.discount,
          grandTotal,
          notes: draft.notes || undefined,
          syncStatus: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const previewItems: ReceiptItem[] = draft.items.map((item: DraftItem) => ({
          id: item.id,
          receiptId: "draft",
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }));

        setReceipt(previewReceipt);
        setItems(previewItems);
      } else {
        // Load saved receipt
        const data = await getReceiptWithItems(id);
        if (!data) {
          router.replace("/dashboard");
          return;
        }
        setReceipt(data.receipt);
        setItems(data.items);
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  const handleSaveDraft = async () => {
    if (!draftData) return;

    setSaving(true);
    try {
      const saved = await saveReceipt(draftData);
      sessionStorage.removeItem("receiptDraft");
      router.replace(`/preview/${saved.id}`);
    } catch (error) {
      console.error("Failed to save receipt:", error);
      alert("Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !business || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isDraft ? "Preview" : `Receipt ${receipt.receiptNumber}`}
        </h2>
        <div className="w-10" />
      </div>

      {/* Receipt Content */}
      <div className="py-8 px-4">
        <ReceiptRenderer
          templateId={receipt.templateId}
          business={business}
          receipt={receipt}
          items={items}
        />
      </div>

      {/* Action Buttons - hidden when printing */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex gap-4">
          {isDraft ? (
            <>
              <button
                onClick={() => router.back()}
                className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Receipt"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
