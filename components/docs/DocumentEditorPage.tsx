// components/docs/DocumentEditorPage.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentForm } from "@/components/docs/DocumentForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { useInitialQuery } from "@/hooks/useInitialQuery";
import { DocumentKind, editBlockedReason } from "@/lib/documentForm";
import { TYPE_LABEL } from "@/lib/documents";
import { ROUTES, staffDocRoute } from "@/lib/routes";
import { Document, documentService } from "@/services/documents";

type Phase = "waiting" | "new" | "loading" | "ready" | "missing" | "error";
type Area = "owner" | "staff";

const AREA_ROUTES = {
  owner: {
    docs: ROUTES.docs,
    doc: (id: string) => `${ROUTES.docs}/${id}`,
    sales: ROUTES.newSalesInvoice,
    other: ROUTES.newDocument,
  },
  staff: {
    docs: ROUTES.staffDocs,
    doc: (id: string) => staffDocRoute(id),
    sales: ROUTES.staffNewSalesInvoice,
    other: ROUTES.staffNewDocument,
  },
} as const;

export function DocumentEditorPage({ kinds, area = "owner" }: { kinds: DocumentKind[]; area?: Area }) {
  const routes = AREA_ROUTES[area];
  const editorRoute = (kind: DocumentKind) => (kind === "sales_invoice" ? routes.sales : routes.other);

  const query = useInitialQuery();
  const editId = query?.get("id") ?? null;

  const [phase, setPhase] = useState<Phase>("waiting");
  const [doc, setDoc] = useState<Document | null>(null);
  const [newKind, setNewKind] = useState<DocumentKind>(kinds[0]);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!query) return;
    if (!editId) {
      setPhase("new");
      return;
    }

    let cancelled = false;
    setPhase("loading");
    documentService
      .get(editId)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setPhase("ready");
      })
      .catch((err: any) => {
        if (!cancelled) setPhase(err?.response?.status === 404 ? "missing" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [query, editId]);

  if (phase === "waiting" || phase === "loading") {
    return <div className="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (phase === "missing" || phase === "error") {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={phase === "missing" ? "find_in_page" : "cloud_off"}
          title={phase === "missing" ? "Document not found" : "We could not load this document"}
          description={phase === "missing" ? "It may have been removed." : "Please check your connection and try again."}
          action={
            <Link href={routes.docs} className={btnNavy}>
              Back to documents
            </Link>
          }
        />
      </div>
    );
  }

  // Editing a document that belongs on the other form, or one that can no longer be edited.
  if (doc) {
    const docKind = doc.documentType as DocumentKind;
    const blocked = editBlockedReason(doc);

    if (!kinds.includes(docKind)) {
      return (
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="swap_horiz"
            title={`This is a ${TYPE_LABEL[docKind].toLowerCase()}`}
            description="It is edited on a different form."
            action={
              <Link href={`${editorRoute(docKind)}?id=${doc.id}`} className={btnNavy}>
                Open the right form
              </Link>
            }
          />
        </div>
      );
    }

    if (blocked) {
      return (
        <div className="rounded-xl border border-outline-variant bg-white shadow-card">
          <EmptyState
            icon="lock"
            title="This document can't be edited"
            description={blocked}
            action={
              <Link href={routes.doc(doc.id)} className={btnNavy}>
                Back to the document
              </Link>
            }
          />
        </div>
      );
    }
  }

  const kind: DocumentKind = doc ? (doc.documentType as DocumentKind) : newKind;
  const isSalesPage = kinds.length === 1 && kinds[0] === "sales_invoice";
  const isProformaOnly = kinds.length === 1 && kinds[0] === "proforma_invoice";
  const title = doc
    ? `Edit ${doc.documentNumber}`
    : isSalesPage
      ? "New sales invoice"
      : isProformaOnly
        ? "New proforma invoice"
        : "New document";
  const subtitle = isSalesPage
    ? "Bill a customer for what you sold."
    : isProformaOnly
      ? "A quote or proforma invoice for a customer."
      : "A proforma invoice for a customer, or an order to a supplier.";

  const prefill = query
    ? {
        customerId: query.get("customerId") ?? undefined,
        customerName: query.get("customerName") ?? undefined,
        customerPhone: query.get("customerPhone") ?? undefined,
        customerEmail: query.get("customerEmail") ?? undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        backHref={doc ? routes.doc(doc.id) : routes.docs}
        backLabel={doc ? "Document" : "Documents"}
      />

      {!doc && kinds.length > 1 && (
        <div className="inline-flex rounded-xl bg-surface-container p-1" role="group" aria-label="Document type">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={newKind === k}
              onClick={() => setNewKind(k)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                newKind === k ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {k === "proforma_invoice" ? "Proforma" : "Supplier order"}
            </button>
          ))}
        </div>
      )}

      <DocumentForm
        key={formKey}
        kind={kind}
        document={doc ?? undefined}
        prefill={doc ? undefined : prefill}
        onCreateAnother={() => setFormKey((k) => k + 1)}
        area={area}
      />
    </div>
  );
}