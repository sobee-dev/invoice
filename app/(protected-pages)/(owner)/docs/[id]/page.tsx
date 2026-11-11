// app/(owner)/docs/[id]/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AddToInventoryModal } from "@/components/docs/AddToInventoryModal";
import { DocumentSummary } from "@/components/docs/DocumentSummary";
import { InvoicePreview } from "@/components/docs/InvoicePreview";
import { getInvoiceHtml } from "@/components/templates/pdf";

import { StockBadge } from "@/components/payments/StockBadge";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnNavy,  } from "@/components/ui/buttonStyles";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { useDeductStock } from "@/hooks/useDeductStock";
import { useDetailQuery } from "@/hooks/useDetailQuery";
import { canDeductStock, DocumentType, fromDocument, TYPE_LABEL } from "@/lib/documents";
import { printHtml } from "@/lib/printHtml";
import { invoicePaymentsRoute, ROUTES } from "@/lib/routes";
import { Document, documentService } from "@/services/documents";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getDisplayName } from "@/utils/displayName";
import { fmtLongDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

import { ShareKind, useInvoiceShare } from "@/hooks/useInvoiceShare";
import { invoiceFileBase } from "@/lib/invoiceFileName";
import { DocumentActionsBar, DocumentActionsCard, DocumentActionsProps, StatusAction } from "@/components/docs/DocumentActions";

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
  const queryClient = useQueryClient();
  const { start: startDeduct, loadingId, overlay: deductOverlay } = useDeductStock();

  const docKey = ["documents", "detail", id] as const;
  const { data: doc, state } = useDetailQuery<Document>(docKey, () => documentService.get(id));

  const [confirm, setConfirm] = useState<Confirm>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const { subscription, isLoading: planLoading } = useSubscriptionContext();

  // Writes refresh the cache by themselves. This only shows the server's reply
  // straight away, so the page never flashes the old status.
  const patchDoc = (changes: Document) =>
    queryClient.setQueryData<Document>(docKey, (prev) => (prev ? { ...prev, ...changes } : changes));

  const html = useMemo(() => {
    if (!doc || !business || planLoading) return "";
    return getInvoiceHtml(business.selectedTemplateId, doc.documentType, doc, business, subscription);
  }, [doc, business, subscription, planLoading]);

  const fileBase = useMemo(
    () => (doc ? invoiceFileBase(doc, business?.name) : undefined),
    [doc, business?.name],
  );
  const share = useInvoiceShare(html, fileBase);

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
      await printHtml(html, fileBase ?? doc.documentNumber);
    } catch (err: any) {
      setToast({ tone: "error", text: err?.message || "Could not open the print dialog." });
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async (kind: ShareKind) => {
    const outcome = await share.run(kind, `${TYPE_LABEL[type]} ${doc.documentNumber}`);
    if (outcome === "downloaded") setToast({ tone: "success", text: "Saved to your device." });
  };

  const statusActions: StatusAction[] = [];
  if (canMarkUnpaid) {
    statusActions.push({
      id: "unpaid",
      label: "Mark as unpaid",
      shortLabel: "Mark unpaid",
      icon: "schedule",
      onClick: () => setConfirm("unpaid"),
    });
  }
  if (canMarkPaid) {
    const settling = doc.status === "unpaid";
    statusActions.push({
      id: "paid",
      label: settling ? "Pay remaining balance" : "Mark as paid",
      shortLabel: settling ? "Pay balance" : "Mark paid",
      icon: "payments",
      onClick: () => setConfirm("paid"),
    });
  }
  if (canMarkDelivered) {
    statusActions.push({
      id: "delivered",
      label: "Mark as delivered",
      shortLabel: "Mark delivered",
      icon: "local_shipping",
      onClick: () => setConfirm("delivered"),
    });
  }

  const showStock = isSales && doc.status !== "deleted" && doc.status !== "draft";
  const stockNote = !showStock
    ? null
    : doc.stockStatus === "deducted"
      ? "Every item has been taken out of stock."
      : doc.stockStatus === "partial"
        ? "Some items had less stock than invoiced, so only what was available was deducted. Stock can't be deducted again."
        : doc.stockStatus === "pending" && doc.stockDeductedAt
          ? "Nothing was in stock when this was marked unpaid. Stock can't be deducted again."
          : null;

  const actionProps: DocumentActionsProps = {
    statusActions,
    slots: share.slots,
    onShare: handleShare,
    shareDisabled: !html,
    onPrint: handlePrint,
    printing,
    printDisabled: printing || !html,
    editHref,
    editBlocked,
    paymentsHref: canViewPayments ? invoicePaymentsRoute(doc.id) : null,
    deduct: showStock
      ? {
          canDeduct,
          loading: loadingId === doc.id,
          onClick: () => startDeduct(fromDocument(doc)),
          note: stockNote,
        }
      : null,
  };

  const markPaid = async () => {
    try {
      const updated = await documentService.markPaid(doc.id);
      patchDoc(updated);
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
      patchDoc(updated);
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
      patchDoc(updated);
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
    <div className="space-y-6 pb-24 lg:pb-0">
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
            <DocumentActionsCard {...actionProps} />
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
      <DocumentActionsBar {...actionProps} />
      <Toast toast={toast} onDismiss={dismissToast} raised />
    </div>
  );
}