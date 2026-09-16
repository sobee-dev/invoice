"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import type { Business, Receipt, ReceiptItem, ReceiptDraft, DraftItem } from "@/lib/types";
import { calculateReceiptTotals } from "@/lib/types";
import { getBusiness } from "@/lib/repositories/businessRepo";
import { getReceiptWithItems, saveReceipt } from "@/lib/repositories/receiptRepo";
import { ReceiptRenderer } from "@/components/templates";
import Loader from "@/components/Loader";
import PostReceiptInstallPrompt from "@/components/PostReceiptInstallPrompt";


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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);


  // ── Mount guard — ensures nothing runs during SSR/prerender ─────
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Force desktop viewport ────────────────────────────────────────
  // useEffect(() => {
  //   if (!isMounted) return;
  //   let viewport = document.querySelector('meta[name="viewport"]');
  //   const original = viewport?.getAttribute('content');

  //   if (!viewport) {
  //     viewport = document.createElement('meta');
  //     viewport.setAttribute('name', 'viewport');
  //     document.head.appendChild(viewport);
  //   }

  //   viewport.setAttribute('content', 'width=1024, initial-scale=0.5, maximum-scale=1');

  //   return () => {
  //     if (original) viewport?.setAttribute('content', original);
  //     else viewport?.remove();
  //   };
  // }, [isMounted]);

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

    setShowInstallPrompt(true);
  };

  const handlePrepareAll = async () => {
    const element = document.getElementById("receipt-capture-area");
    if (!element) return;

    setIsPreparing(true);
    try {
      // ── Convert all images to base64 before sending to Puppeteer ────
      const images = Array.from(element.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          if (!img.src || img.src.startsWith("data:")) return;
          try {
            const res = await fetch(img.src);
            const blob = await res.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            img.src = base64;
          } catch (e) {
            console.warn("Failed to convert image:", img.src, e);
          }
        })
      );

      // ── Now grab innerHTML — all imgs are already base64 ────────────
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
  if (!isMounted || loading || !business || !receipt || saving || isPreparing) {   // ← NEW !isMounted
    return <Loader />;
  }

  {showInstallPrompt && (
  <PostReceiptInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
  )}

  return (
    <div className="min-h-screen bg-[#efedf2]">
      {/* Header */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b border-[#c5c6d0] bg-white/90 p-4 backdrop-blur-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#45464f] hover:text-[#1b1b1f] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-[#1b1b1f]">
          {isDraft ? "Preview" : `${receipt.receiptNumber}`}
        </h2>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="mb-30 py-8 px-4" id="receipt-capture-area">
        <div className="
          w-full overflow-x-hidden
          [&>*]:origin-top-left
          [&>*]:scale-[0.55]
          [&>*]:w-[182%]
          sm:[&>*]:scale-100
          sm:[&>*]:w-full
        "> 
          <ReceiptRenderer
            templateId={business.selectedTemplateId}
            business={business}
            receipt={receipt}
            items={items}
          />
        </div> 
      </div>

      {/* Footer Actions */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 p-4 backdrop-blur-sm bg-white/90 border-t border-[#c5c6d0]">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex gap-3">
            {isDraft ? (
              <>
                <button
                  onClick={() => router.back()}
                  className="flex-1 h-12 rounded-lg border border-[#c5c6d0] text-[#1b1b1f] text-sm font-semibold hover:bg-[#f5f3f8] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 h-12 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-semibold disabled:opacity-50 transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
                >
                  {saving ? "Saving..." : "Save Receipt"}
                </button>
              </>
            ) : (
              <>
                {!preparedFiles ? (
                  <>
                    <button
                      onClick={handlePrepareAll}
                      disabled={isPreparing}
                      className="flex-1 h-12 rounded-lg border border-[#c5c6d0] text-[#1b1b1f] text-sm font-semibold hover:bg-[#f5f3f8] transition-colors flex items-center justify-center gap-2"
                    >
                      {isPreparing ? <Loader /> : "Share / Download"}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 h-12 rounded-lg border border-[#c5c6d0] text-[#1b1b1f] text-sm font-semibold hover:bg-[#f5f3f8] transition-colors"
                    >
                      Print
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col w-full gap-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleExecuteShare(preparedFiles.image)}
                        className="flex-1 h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors"
                      >
                        🚀 Send as Image
                      </button>
                      <button
                        onClick={() => handleExecuteShare(preparedFiles.pdf)}
                        className="flex-1 h-12 rounded-lg bg-[#1b2e5e] hover:bg-[#011848] text-white text-sm font-bold shadow-md transition-colors"
                      >
                        🚀 Send as PDF
                      </button>
                    </div>
                    <button
                      onClick={() => setPreparedFiles(null)}
                      className="text-xs text-[#757680] underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {!isDraft && (
            <button
              onClick={() => router.replace("/dashboard")}
              className="w-full h-10 text-xs text-[#757680] hover:text-[#45464f] transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}