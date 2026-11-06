// app/(owner)/docs/[id]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AddToInventoryModal } from "@/components/docs/AddToInventoryModal";
import { DocumentSummary } from "@/components/docs/DocumentSummary";
import { InvoicePreview } from "@/components/docs/InvoicePreview";
import { getInvoiceHtml } from "@/components/templates/pdf";
import { Icon } from "@/components/layout/Icon";
import { StockBadge } from "@/components/payments/StockBadge";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnAmber, btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useDeductStock } from "@/hooks/useDeductStock";
import { canDeductStock, DocumentType, fromDocument, TYPE_LABEL } from "@/lib/documents";
import { printHtml } from "@/lib/printHtml";
import { invoicePaymentsRoute, ROUTES } from "@/lib/routes";
import { Document, documentService } from "@/services/documents";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getDisplayName } from "@/utils/displayName";
import { fmtLongDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { useSubscriptionContext } from "@/context/SubscriptionContext";

type LoadState = "loading" | "ready" | "missing" | "error";
type Payment = "paid" | "pending" | "unpaid";
type Confirm = "paid" | "delivered" | "unpaid" | null;

const PAYMENT_TONE: Record<Payment, BadgeTone> = { paid: "green", pending: "orange", unpaid: "red" };
const PAYMENT_LABEL: Record<Payment, string> = { paid: "Paid", pending: "Part paid", unpaid: "Unpaid" };

function issuedLabel(doc: Document): string {
  const raw = doc.documentDate || doc.createdAt;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : fmtLongDate(d);
}

function editBlockedReason(doc: Document): string | null {
  if (doc.status === "deleted") return "Deleted documents can't be edited.";
  if (doc.documentType === "purchase_invoice" && doc.status === "delivered") return "Delivered supplier orders can't be edited.";
  if (doc.documentType === "sales_invoice" && doc.status !== "draft") return "Only draft sales invoices can be edited.";
  if (doc.documentType === "sales_invoice" && (doc.stockStatus === "partial" || doc.stockStatus === "deducted")) {
    return "Stock has already been deducted, so this invoice can't be edited.";
  }
  return null;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { business } = useBusiness();
  const { start: startDeduct, loadingId, overlay: deductOverlay } = useDeductStock();

  const [doc, setDoc] = useState<Document | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const { subscription, isLoading: planLoading } = useSubscriptionContext();

  const load = useCallback(async () => {
    try {
      setDoc(await documentService.get(id));
      setState("ready");
    } catch (err: any) {
      setState(err?.response?.status === 404 ? "missing" : "error");
    }
  }, [id]);

  useEffect(() => {
    setState("loading");
    load();
  }, [load]);

  
  

  // The deduct dialog is owned by useDeductStock. Re-read the document when the
  // user comes back to this tab so the stock badge never shows an old value.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const html = useMemo(() => {
    if (!doc || !business || planLoading) return "";
    return getInvoiceHtml(business.selectedTemplateId, doc.documentType, doc, business, subscription);
  }, [doc, business, subscription, planLoading]);

  if (state === "loading") {
    return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state !== "ready" || !doc) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={state === "missing" ? "find_in_page" : "cloud_off"}
          title={state === "missing" ? "Document not found" : "We could not load this document"}
          description={state === "missing" ? "It may have been removed." : "Please check your connection and try again."}
          action={
            <Link href={ROUTES.docs} className={btnNavy}>
              Back to documents
            </Link>
          }
        />
      </div>
    );
  }

  const type = doc.documentType as DocumentType;
  const isSales = type === "sales_invoice";
  const isPurchase = type === "purchase_invoice";
  const isOwner = user?.role === "owner";
  const payment: Payment = doc.status === "paid" ? "paid" : Number(doc.amountPaid) > 0 ? "pending" : "unpaid";
  const symbol = resolveCurrency(doc.currency || business?.currency || "").symbol;

  const needsDeduction = doc.stockStatus === "pending" || doc.stockStatus === "partial";
  const canMarkPaid = !isPurchase && doc.status !== "paid" && doc.status !== "deleted";
  const canMarkUnpaid = isSales && doc.status === "draft";
  const canMarkDelivered = isPurchase && doc.status !== "delivered" && doc.status !== "deleted";
  const canViewPayments = isOwner && isSales && (doc.status === "unpaid" || doc.status === "paid");
  
  
  const willDeduct = doc.stockStatus === "pending" && !doc.stockDeductedAt;

  const canDeduct = canDeductStock(fromDocument(doc));
    
  const editBlocked = editBlockedReason(doc);
  const editHref = `${isSales ? ROUTES.newSalesInvoice : ROUTES.newDocument}?id=${doc.id}`;

  const handlePrint = async () => {
    if (!html || printing) return;
    setPrinting(true);
    try {
      await printHtml(html, doc.documentNumber);
    } catch (err: any) {
      setToast({ tone: "error", text: err?.message || "Could not open the print dialog." });
    } finally {
      setPrinting(false);
    }
  };

  const markPaid = async () => {
    try {
      const updated = await documentService.markPaid(doc.id);
      setDoc((prev) => (prev ? { ...prev, ...updated } : updated));
      setToast({ tone: "success", text: "Marked as paid." });
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not mark this document as paid.") });
    } finally {
      setConfirm(null);
    }
  };

  const markUnpaid = async () => {
    try {
      const updated = await documentService.markUnpaid(doc.id, { deductStock: willDeduct });
      setDoc((prev) => (prev ? { ...prev, ...updated } : updated));
      setToast({
        tone: "success",
        text:
          updated.stockStatus === "partial"
            ? "Marked as unpaid. Some items had less stock than invoiced, so only what was available was deducted."
            : updated.stockStatus === "pending" && updated.stockDeductedAt
              ? "Marked as unpaid. None of the items were in stock, so nothing was deducted."
              : "Marked as unpaid. It now counts toward what this customer owes.",
      });
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not mark this invoice as unpaid.") });
    } finally {
      setConfirm(null);
    }
  };

    const markDelivered = async () => {
      try {
        const updated = await documentService.markDelivered(doc.id);
        const next = { ...doc, ...updated };
        setDoc(next);
        if ((next.items ?? []).some((i) => i.product)) {
          setInventoryOpen(true);
        } else {
          setToast({ tone: "success", text: "Marked as delivered. There are no product-linked items to add to stock." });
        }
      } catch (err: any) {
        setToast({ tone: "error", text: getApiErrorMessage(err, "Could not mark this order as delivered.") });
      } finally {
        setConfirm(null);
      }
    };



  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <StockBadge status={doc.stockStatus} />
      <StatusChip status={doc.status} />
      {!isPurchase && <Badge tone={PAYMENT_TONE[payment]}>{PAYMENT_LABEL[payment]}</Badge>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.documentNumber}
        subtitle={`${TYPE_LABEL[type]} · Issued ${issuedLabel(doc)}`}
        backHref={ROUTES.docs}
        backLabel="Documents"
        actions={badges}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-xl bg-surface-container-low p-4 sm:p-6">
          {html ? <InvoicePreview html={html} /> : <div className="h-96 animate-pulse rounded-lg bg-white" />}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[94px] xl:self-start">
          <SectionCard title="Actions">
            <div className="space-y-3">
              <button type="button" onClick={handlePrint} disabled={printing || !html} className={`${btnNavy} h-11 w-full`}>
                <Icon name="print" size={18} /> {printing ? "Opening..." : "Print or save as PDF"}
              </button>

              {canViewPayments && (
                <Link href={invoicePaymentsRoute(doc.id)} className={`${btnAmber} h-11 w-full`}>
                  <Icon name="history" size={18} /> View payment history
                </Link>
              )}

              {canMarkUnpaid && (
                <button type="button" onClick={() => setConfirm("unpaid")} className={`${btnAmber} h-11 w-full`}>
                  <Icon name="schedule" size={18} /> Mark as unpaid
                </button>
              )}

              {canMarkPaid && (
                <button type="button" onClick={() => setConfirm("paid")} className={`${canMarkUnpaid ? btnOutline : btnAmber} h-11 w-full`}>
                  <Icon name="payments" size={18} /> {doc.status === "unpaid" ? "Pay remaining balance" : "Mark as paid"}
                </button>
              )}

              {canMarkDelivered && (
                <button type="button" onClick={() => setConfirm("delivered")} className={`${btnAmber} h-11 w-full`}>
                  <Icon name="local_shipping" size={18} /> Mark as delivered
                </button>
              )}

              {isSales && doc.status !== "deleted" && doc.status !== "draft" && (
                <div>
                  {canDeduct && (
                    <button
                      type="button"
                      onClick={() => startDeduct(fromDocument(doc))}
                      disabled={loadingId === doc.id}
                      className={`${btnOutline} h-11 w-full`}
                    >
                      <Icon name="inventory_2" size={18} /> {loadingId === doc.id ? "Loading stock..." : "Deduct stock"}
                    </button>
                  )}
                  {doc.stockStatus === "deducted" && (
                    <p className="text-xs text-on-surface-variant">Every item has been taken out of stock.</p>
                  )}
                  {doc.stockStatus === "partial" && (
                    <p className="text-xs text-on-surface-variant">
                      Some items had less stock than invoiced, so only what was available was deducted. Stock can't be deducted again.
                    </p>
                  )}
                  {doc.stockStatus === "pending" && doc.stockDeductedAt && (
                    <p className="text-xs text-on-surface-variant">
                      Nothing was in stock when this was marked unpaid. Stock can't be deducted again.
                    </p>
                  )}
                </div>
              )}

              {editBlocked ? (
                <div>
                  <button type="button" disabled className={`${btnOutline} h-11 w-full`}>
                    <Icon name="edit" size={18} /> Edit
                  </button>
                  <p className="mt-1.5 text-xs text-on-surface-variant">{editBlocked}</p>
                </div>
              ) : (
                <Link href={editHref} className={`${btnOutline} h-11 w-full`}>
                  <Icon name="edit" size={18} /> Edit
                </Link>
              )}
            </div>
          </SectionCard>

          <DocumentSummary
            doc={doc}
            symbol={symbol}
            creatorName={doc.createdBy ? getDisplayName(doc.createdBy, user) : null}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "paid"}
        title={doc.status === "unpaid" ? "Pay the remaining balance?" : "Mark this document as paid?"}
        description={
          doc.status === "unpaid"
            ? "This records a payment for the full remaining balance. You can void it later from the payment history."
            : "This can't be undone from here."
        }
        confirmLabel={doc.status === "unpaid" ? "Record payment" : "Mark as paid"}
        onConfirm={markPaid}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === "unpaid"}
        title="Mark this invoice as unpaid?"
        description={
          willDeduct
            ? "Stock will be deducted once, up to what is available for each item. Items with no stock are skipped, and this can't be repeated later. The invoice total is then added to what this customer owes."
            : "The invoice total will be added to what this customer owes."
        }
        confirmLabel="Mark as unpaid"
        onConfirm={markUnpaid}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === "delivered"}
        title="Mark this order as delivered?"
        description="You can add the delivered items to your stock next."
        confirmLabel="Mark as delivered"
        onConfirm={markDelivered}
        onClose={() => setConfirm(null)}
      />

      <AddToInventoryModal
        open={inventoryOpen}
        documentId={doc.id}
        items={doc.items ?? []}
        onClose={() => setInventoryOpen(false)}
        onApplied={() => {
          setInventoryOpen(false);
          setToast({ tone: "success", text: "Items have been added to inventory." });
        }}
      />

      {deductOverlay}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}














// // app/(owner)/docs/[id]/page.tsx
// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { AddToInventoryModal } from "@/components/docs/AddToInventoryModal";
// import { DocumentSummary } from "@/components/docs/DocumentSummary";
// import { InvoicePreview } from "@/components/docs/InvoicePreview";
// import { getInvoiceHtml } from "@/components/templates/pdf";
// import { Icon } from "@/components/layout/Icon";
// import { Badge, BadgeTone } from "@/components/ui/Badge";
// import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
// import { EmptyState } from "@/components/ui/EmptyState";
// import { PageHeader } from "@/components/ui/PageHeader";
// import { SectionCard } from "@/components/ui/SectionCard";
// import { StatusChip } from "@/components/ui/StatusChip";
// import { Toast, ToastState } from "@/components/ui/Toast";
// import { btnAmber, btnNavy, btnOutline } from "@/components/ui/buttonStyles";
// import { useAuth } from "@/context/AuthContext";
// import { useBusiness } from "@/context/BusinessContext";
// import { useDeductStock } from "@/hooks/useDeductStock";
// import { DocumentType, fromDocument, TYPE_LABEL } from "@/lib/documents";
// import { printHtml } from "@/lib/printHtml";
// import { ROUTES } from "@/lib/routes";
// import { Document, documentService } from "@/services/documents";
// import { resolveCurrency } from "@/utils/currencySymbol";
// import { getDisplayName } from "@/utils/displayName";
// import { fmtLongDate } from "@/utils/formatDate";
// import { getApiErrorMessage } from "@/utils/getErrorMessage";
// import { editBlockedReason } from "@/lib/documentForm";

// type LoadState = "loading" | "ready" | "missing" | "error";
// type Payment = "paid" | "pending" | "unpaid";

// const PAYMENT_TONE: Record<Payment, BadgeTone> = { paid: "green", pending: "orange", unpaid: "red" };
// const PAYMENT_LABEL: Record<Payment, string> = { paid: "Paid", pending: "Part paid", unpaid: "Unpaid" };

// function issuedLabel(doc: Document): string {
//   const raw = doc.documentDate || doc.createdAt;
//   const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
//   return Number.isNaN(d.getTime()) ? raw : fmtLongDate(d);
// }



// export default function DocumentDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const { user } = useAuth();
//   const { business } = useBusiness();
//   const { start: startDeduct, loadingId, overlay: deductOverlay } = useDeductStock();

//   const [doc, setDoc] = useState<Document | null>(null);
//   const [state, setState] = useState<LoadState>("loading");
//   const [confirm, setConfirm] = useState<"paid" | "delivered" | null>(null);
//   const [inventoryOpen, setInventoryOpen] = useState(false);
//   const [printing, setPrinting] = useState(false);
//   const [toast, setToast] = useState<ToastState | null>(null);
//   const dismissToast = useCallback(() => setToast(null), []);

//   const load = useCallback(async () => {
//     try {
//       setDoc(await documentService.get(id));
//       setState("ready");
//     } catch (err: any) {
//       setState(err?.response?.status === 404 ? "missing" : "error");
//     }
//   }, [id]);

//   useEffect(() => {
//     setState("loading");
//     load();
//   }, [load]);

//   const html = useMemo(
//     () => (doc && business ? getInvoiceHtml(business.selectedTemplateId, doc.documentType, doc, business) : ""),
//     [doc, business],
//   );

//   if (state === "loading") {
//     return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
//   }

//   if (state !== "ready" || !doc) {
//     return (
//       <div className="rounded-xl border border-outline-variant bg-white shadow-card">
//         <EmptyState
//           icon={state === "missing" ? "find_in_page" : "cloud_off"}
//           title={state === "missing" ? "Document not found" : "We could not load this document"}
//           description={state === "missing" ? "It may have been removed." : "Please check your connection and try again."}
//           action={
//             <Link href={ROUTES.docs} className={btnNavy}>
//               Back to documents
//             </Link>
//           }
//         />
//       </div>
//     );
//   }

//   const type = doc.documentType as DocumentType;
//   const isSales = type === "sales_invoice";
//   const isPurchase = type === "purchase_invoice";
//   const payment: Payment = doc.status === "paid" ? "paid" : Number(doc.amountPaid) > 0 ? "pending" : "unpaid";
//   const symbol = resolveCurrency(doc.currency || business?.currency || "").symbol;

//   const canMarkPaid = !isPurchase && doc.status !== "paid" && doc.status !== "deleted";
//   const canMarkDelivered = isPurchase && doc.status !== "delivered" && doc.status !== "deleted";
//   const editBlocked = editBlockedReason(doc);
//   const editHref = `${isSales ? ROUTES.newSalesInvoice : ROUTES.newDocument}?id=${doc.id}`;

//   const handlePrint = async () => {
//     if (!html || printing) return;
//     setPrinting(true);
//     try {
//       await printHtml(html, doc.documentNumber);
//     } catch (err: any) {
//       setToast({ tone: "error", text: err?.message || "Could not open the print dialog." });
//     } finally {
//       setPrinting(false);
//     }
//   };

//   const markPaid = async () => {
//     try {
//       const updated = await documentService.markPaid(doc.id);
//       setDoc((prev) => (prev ? { ...prev, ...updated } : updated));
//       setToast({ tone: "success", text: "Marked as paid." });
//     } catch (err: any) {
//       setToast({ tone: "error", text: getApiErrorMessage(err, "Could not mark this document as paid.") });
//     } finally {
//       setConfirm(null);
//     }
//   };

//   const markDelivered = async () => {
//     try {
//       const updated = await documentService.markDelivered(doc.id);
//       const next = { ...doc, ...updated };
//       setDoc(next);
//       if ((next.items ?? []).some((i) => i.product)) {
//         setInventoryOpen(true);
//       } else {
//         setToast({ tone: "success", text: "Marked as delivered. There are no product-linked items to add to stock." });
//       }
//     } catch (err: any) {
//       setToast({ tone: "error", text: getApiErrorMessage(err, "Could not mark this order as delivered.") });
//     } finally {
//       setConfirm(null);
//     }
//   };

//   const badges = (
//     <div className="flex items-center gap-2">
//       <StatusChip status={doc.status} />
//       {!isPurchase && <Badge tone={PAYMENT_TONE[payment]}>{PAYMENT_LABEL[payment]}</Badge>}
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={doc.documentNumber}
//         subtitle={`${TYPE_LABEL[type]} · Issued ${issuedLabel(doc)}`}
//         backHref={ROUTES.docs}
//         backLabel="Documents"
//         actions={badges}
//       />

//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
//         <div className="min-w-0 rounded-xl bg-surface-container-low p-4 sm:p-6">
//           {html ? <InvoicePreview html={html} /> : <div className="h-96 animate-pulse rounded-lg bg-white" />}
//         </div>

//         <aside className="space-y-6 xl:sticky xl:top-[94px] xl:self-start">
//           <SectionCard title="Actions">
//             <div className="space-y-3">
//               <button type="button" onClick={handlePrint} disabled={printing || !html} className={`${btnNavy} h-11 w-full`}>
//                 <Icon name="print" size={18} /> {printing ? "Opening..." : "Print or save as PDF"}
//               </button>

//               {canMarkPaid && (
//                 <button type="button" onClick={() => setConfirm("paid")} className={`${btnAmber} h-11 w-full`}>
//                   <Icon name="payments" size={18} /> Mark as paid
//                 </button>
//               )}

//               {canMarkDelivered && (
//                 <button type="button" onClick={() => setConfirm("delivered")} className={`${btnAmber} h-11 w-full`}>
//                   <Icon name="local_shipping" size={18} /> Mark as delivered
//                 </button>
//               )}

//               {isSales && doc.status !== "deleted" && (
//                 <button
//                   type="button"
//                   onClick={() => startDeduct(fromDocument(doc))}
//                   disabled={loadingId === doc.id}
//                   className={`${btnOutline} h-11 w-full`}
//                 >
//                   <Icon name="inventory_2" size={18} /> {loadingId === doc.id ? "Loading stock..." : "Deduct stock"}
//                 </button>
//               )}

//               {editBlocked ? (
//                 <div>
//                   <button type="button" disabled className={`${btnOutline} h-11 w-full`}>
//                     <Icon name="edit" size={18} /> Edit
//                   </button>
//                   <p className="mt-1.5 text-xs text-on-surface-variant">{editBlocked}</p>
//                 </div>
//               ) : (
//                 <Link href={editHref} className={`${btnOutline} h-11 w-full`}>
//                   <Icon name="edit" size={18} /> Edit
//                 </Link>
//               )}
//             </div>
//           </SectionCard>

//           <DocumentSummary
//             doc={doc}
//             symbol={symbol}
//             creatorName={doc.createdBy ? getDisplayName(doc.createdBy, user) : null}
//           />
//         </aside>
//       </div>

//       <ConfirmDialog
//         open={confirm === "paid"}
//         title="Mark this document as paid?"
//         description="This can't be undone from here."
//         confirmLabel="Mark as paid"
//         onConfirm={markPaid}
//         onClose={() => setConfirm(null)}
//       />

//       <ConfirmDialog
//         open={confirm === "delivered"}
//         title="Mark this order as delivered?"
//         description="You can add the delivered items to your stock next."
//         confirmLabel="Mark as delivered"
//         onConfirm={markDelivered}
//         onClose={() => setConfirm(null)}
//       />

//       <AddToInventoryModal
//         open={inventoryOpen}
//         documentId={doc.id}
//         items={doc.items ?? []}
//         onClose={() => setInventoryOpen(false)}
//         onApplied={() => {
//           setInventoryOpen(false);
//           setToast({ tone: "success", text: "Items have been added to inventory." });
//         }}
//       />

//       {deductOverlay}
//       <Toast toast={toast} onDismiss={dismissToast} />
//     </div>
//   );
// }