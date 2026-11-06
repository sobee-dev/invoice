// app/(staff)/staff/docs/[id]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { DocumentType, TYPE_LABEL } from "@/lib/documents";
import { printHtml } from "@/lib/printHtml";
import { ROUTES } from "@/lib/routes";
import { Document, documentService } from "@/services/documents";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getDisplayName } from "@/utils/displayName";
import { fmtLongDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

type LoadState = "loading" | "ready" | "missing" | "error";
type Payment = "paid" | "pending" | "unpaid";
type Confirm = "paid" | "unpaid" | null;

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

export default function StaffDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { business } = useBusiness();
  const { subscription, isLoading: planLoading } = useSubscriptionContext();

  const [doc, setDoc] = useState<Document | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

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
            <Link href={ROUTES.staffDocs} className={btnNavy}>
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
  const payment: Payment = doc.status === "paid" ? "paid" : Number(doc.amountPaid) > 0 ? "pending" : "unpaid";
  const symbol = resolveCurrency(doc.currency || business?.currency || "").symbol;

  const canMarkPaid = !isPurchase && doc.status !== "paid" && doc.status !== "deleted";
  const canMarkUnpaid = isSales && doc.status === "draft";
  const willDeduct = doc.stockStatus === "pending" && !doc.stockDeductedAt;

  const editBlocked = editBlockedReason(doc);
  const editHref = `${isSales ? ROUTES.staffNewSalesInvoice : ROUTES.staffNewDocument}?id=${doc.id}`;

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
        backHref={ROUTES.staffDocs}
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
            ? "This records a payment for the full remaining balance."
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

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}