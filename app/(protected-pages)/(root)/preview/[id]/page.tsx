"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import type { Business, Receipt, ReceiptItem, ReceiptDraft, DraftItem } from "@/lib/types";
import { calculateReceiptTotals } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getReceiptWithItems, saveReceipt } from "@/lib/repositories/receiptRepo";
import { ReceiptRenderer } from "@/components/templates";
import Loader from "@/components/Loader";

// ── Removed top-level require — moved into useEffect ──────────────

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ← unwrap the promise here
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);               // ← NEW
  const [business, setBusiness] = useState<Business | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [draftData, setDraftData] = useState<ReceiptDraft | null>(null);
  const [preparedFiles, setPreparedFiles] = useState<{ pdf: File; image: File } | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  // ── Mount guard — ensures nothing runs during SSR/prerender ─────
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Force desktop viewport ────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;
    let viewport = document.querySelector('meta[name="viewport"]');
    const original = viewport?.getAttribute('content');

    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }

    viewport.setAttribute('content', 'width=1024, initial-scale=0.5, maximum-scale=1');

    return () => {
      if (original) viewport?.setAttribute('content', original);
      else viewport?.remove();
    };
  }, [isMounted]);

  // ── Data loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;                                          // ← NEW guard

    async function load() {
      const biz = await getBusiness();
      if (!biz) {
        router.replace("/onboarding");
        return;
      }
      setBusiness(biz);

      if (id === "draft") {
        const draftJson = sessionStorage.getItem("receiptDraft");
        if (!draftJson) {
          router.replace("/new-receipt");
          return;
        }

        const draft: ReceiptDraft = JSON.parse(draftJson);
        setDraftData(draft);
        setIsDraft(true);

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
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          isPaid: true,
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
  }, [isMounted, id, router]);                                       // ← isMounted in deps

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

  const handlePrepareAll = async () => {
    const element = document.getElementById("receipt-capture-area");
    if (!element) return;

    setIsPreparing(true);
    try {
      const htmlContent = `<div id="receipt-capture-area">${element.innerHTML}</div>`;
      const [pdfRes, imgRes] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: htmlContent, type: 'pdf', fileName: `${receipt?.receiptNumber}.pdf` }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: htmlContent, type: 'image', fileName: `${receipt?.receiptNumber}.png` }),
        }),
      ]);

      if (!pdfRes.ok || !imgRes.ok) throw new Error('Generation failed');
      const [pdfBlob, imgBlob] = await Promise.all([pdfRes.blob(), imgRes.blob()]);

      setPreparedFiles({
        pdf: new File([pdfBlob], `Invoice-${receipt?.receiptNumber}.pdf`, { type: 'application/pdf' }),
        image: new File([imgBlob], `Invoice-${receipt?.receiptNumber}.png`, { type: 'image/png' }),
      });
    } catch (error) {
      alert("Preparation failed. Please try again.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleExecuteShare = async (file: File) => {
    if (!preparedFiles) return;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Receipt ${receipt?.receiptNumber}` });
        setPreparedFiles(null);
      } catch (shareError: any) {
        if (shareError.name !== 'AbortError') {
          triggerDownload(file, file.name);
          setPreparedFiles(null);
        }
      }
    } else {
      triggerDownload(file, file.name);
      setPreparedFiles(null);
    }
  };

  const handlePrint = () => window.print();

  // ── Block render until mounted AND data is ready ─────────────────
  if (!isMounted || loading || !business || !receipt || saving) {   // ← NEW !isMounted
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isDraft ? "Preview" : `${receipt.receiptNumber}`}
        </h2>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="mb-30 py-8 px-4" id="receipt-capture-area">
        <ReceiptRenderer
          templateId={business.selectedTemplateId}
          business={business}
          receipt={receipt}
          items={items}
        />
      </div>

      {/* Footer Actions */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 p-4 mt-12 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex gap-4">
            {isDraft ? (
              <>
                <button onClick={() => router.back()} className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:white font-semibold">Edit</button>
                <button onClick={handleSaveDraft} disabled={saving} className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50">
                  {saving ? "Saving..." : "Save Receipt"}
                </button>
              </>
            ) : (
              <>
                {!preparedFiles ? (
                  <>
                    <button onClick={handlePrepareAll} disabled={isPreparing} className="flex-2 h-12 rounded-lg text-black font-bold flex items-center justify-center gap-2">
                      {isPreparing ? <Loader /> : "Share"}
                    </button>
                    <button onClick={handlePrint} className="flex-1 h-12 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold">Print</button>
                  </>
                ) : (
                  <div className="flex flex-col w-full gap-3">
                    <div className="flex gap-3">
                      <button onClick={() => handleExecuteShare(preparedFiles.image)} className="flex-1 h-12 rounded-lg bg-green-600 text-white font-bold shadow-lg animate-pulse">🚀 Send As Image</button>
                      <button onClick={() => handleExecuteShare(preparedFiles.pdf)} className="flex-1 h-12 rounded-lg bg-slate-900 text-white font-bold shadow-lg animate-pulse">🚀 Send As PDF</button>
                    </div>
                    <button onClick={() => setPreparedFiles(null)} className="text-xs text-slate-500 underline">Cancel</button>
                  </div>
                )}
              </>
            )}
          </div>
          {!isDraft && (
            <button onClick={() => router.replace("/dashboard")} className="w-full h-10 text-sm text-slate-500">Back to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
}