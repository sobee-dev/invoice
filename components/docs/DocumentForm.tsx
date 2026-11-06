// components/docs/DocumentForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyField } from "@/components/docs/form/CurrencyField";
import { CustomerField } from "@/components/docs/form/CustomerField";
import { LineItemsEditor } from "@/components/docs/form/LineItemsEditor";
import { SavedDialog } from "@/components/docs/form/SavedDialog";
import { TotalsPanel } from "@/components/docs/form/TotalsPanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { Switch } from "@/components/ui/Switch";
import { inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { DEFAULT_CURRENCY } from "@/data/constants";
import { useDeductStock } from "@/hooks/useDeductStock";
import { CurrencyValue, displaySymbol, storedCurrency, toCurrencyValue } from "@/lib/currency";
import {
  DocumentKind,
  FormLineItem,
  isBlankItem,
  itemsFromDocument,
  parseDecimal,
  roundMoney,
  todayIso,
} from "@/lib/documentForm";
import { fromDocument } from "@/lib/documents";
import { ROUTES, staffDocRoute } from "@/lib/routes";
import { Document, DocumentItemPayload, documentService } from "@/services/documents";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

export interface DocumentPrefill {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface DocumentFormProps {
  kind: DocumentKind;
  document?: Document;          // set when editing
  prefill?: DocumentPrefill;    // from a client page, new documents only
  onCreateAnother?: () => void;
  area?: "owner" | "staff";
}

interface Problem {
  message: string;
  rows?: string[];
}

interface SaveResult {
  doc: Document;
  paidFailed: boolean;
}

export function DocumentForm({ kind, document, prefill, onCreateAnother, area = "owner" }: DocumentFormProps) {
  const router = useRouter();
  const { business } = useBusiness();
  const { start: startDeduct, loadingId, overlay: deductOverlay } = useDeductStock();

  const isStaff = area === "staff";
  const docsHref = isStaff ? ROUTES.staffDocs : ROUTES.docs;
  const docHref = (id: string) => (isStaff ? staffDocRoute(id) : `${ROUTES.docs}/${id}`);

  const isEdit = Boolean(document);
  const isSales = kind === "sales_invoice";
  const isPurchase = kind === "purchase_invoice";
  const alreadyPaid = document?.status === "paid";

  const [documentDate, setDocumentDate] = useState(document?.documentDate?.slice(0, 10) || todayIso());
  const [currency, setCurrency] = useState<CurrencyValue>(() =>
    toCurrencyValue(document?.currency || business?.currency || DEFAULT_CURRENCY.code),
  );
  const [customerId, setCustomerId] = useState<string | undefined>(document?.customer ?? prefill?.customerId);
  const [customerName, setCustomerName] = useState(document?.customerName ?? prefill?.customerName ?? "");
  const [phone, setPhone] = useState(document?.customerPhone ?? prefill?.customerPhone ?? "");
  const [email, setEmail] = useState(document?.customerEmail ?? prefill?.customerEmail ?? "");
  const [supplierName, setSupplierName] = useState(document?.supplierName ?? "");
  const [items, setItems] = useState<FormLineItem[]>(() => itemsFromDocument(document));
  const [discount, setDiscount] = useState(document ? String(Number(document.discount) || 0) : "0");
  const [taxPct, setTaxPct] = useState(() =>
    document ? String(+((Number(document.taxRate) || 0) * 100).toFixed(2)) : String(business?.taxRate ?? 0),
  );
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [markPaid, setMarkPaid] = useState(alreadyPaid);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invalidRows, setInvalidRows] = useState<Set<string>>(new Set());
  const [invalidParty, setInvalidParty] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const symbol = displaySymbol(currency);

  // Preview figures. The server recalculates them, so these are for the person filling the form.
  const subtotal = roundMoney(
    items.reduce((sum, i) => sum + roundMoney(parseDecimal(i.qtyStr) * parseDecimal(i.priceStr)), 0),
  );
  const taxRate = parseDecimal(taxPct);
  const taxAmount = roundMoney((subtotal * taxRate) / 100);
  const discountAmount = isSales ? roundMoney(parseDecimal(discount)) : 0;
  const grandTotal = roundMoney(subtotal + taxAmount - discountAmount);

  // Warn before the tab closes with unsaved changes.
  const snapshot = JSON.stringify([
    documentDate, storedCurrency(currency), customerId, customerName, phone, email, supplierName,
    discount, taxPct, notes, markPaid, items.map((i) => [i.productId, i.name, i.qtyStr, i.priceStr]),
  ]);
  const baseline = useRef<string | null>(null);
  if (baseline.current === null) baseline.current = snapshot;
  const savedRef = useRef(false);

  useEffect(() => {
    if (snapshot === baseline.current || savedRef.current) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [snapshot, result]);

  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const validate = (): Problem | null => {
    if (!isPurchase && !customerName.trim()) return { message: "Enter the customer's name." };
    if (isPurchase && !supplierName.trim()) return { message: "Enter the supplier's name." };
    if (currency.custom && !currency.symbol.trim()) return { message: "Enter a currency symbol." };

    const filled = items.filter((i) => !isBlankItem(i));
    if (filled.length === 0) return { message: "Add at least one item." };

    const bad = filled
      .filter((i) => !i.name.trim() || parseDecimal(i.qtyStr) <= 0 || Number.isNaN(Number.parseFloat(i.priceStr)))
      .map((i) => i.id);
    if (bad.length > 0) return { message: "Each item needs a name, a quantity above zero and a unit price.", rows: bad };

    if (taxRate < 0 || taxRate > 100) return { message: "Enter a tax rate between 0 and 100." };
    if (isSales && discountAmount > roundMoney(subtotal + taxAmount)) {
      return { message: "The discount can't be more than the invoice total." };
    }
    return null;
  };

  const buildItems = (): DocumentItemPayload[] =>
    items
      .filter((i) => !isBlankItem(i))
      .map((i) => ({
        product: i.productId,
        productName: i.productId ? undefined : i.name.trim(),
        description: i.name.trim(),
        quantity: parseDecimal(i.qtyStr),
        unitPrice: parseDecimal(i.priceStr),
      }));

  const handleSave = async () => {
    if (saving) return;

    const problem = validate();
    if (problem) {
      setError(problem.message);
      setInvalidRows(new Set(problem.rows ?? []));
      setInvalidParty(problem.message.startsWith("Enter the customer") || problem.message.startsWith("Enter the supplier"));
      return;
    }

    setSaving(true);
    setError("");
    setInvalidRows(new Set());
    setInvalidParty(false);

    const party = isPurchase
      ? { supplierName: supplierName.trim() }
      : { customer: customerId, customerName: customerName.trim(), customerEmail: email.trim(), customerPhone: phone.trim() };

    const common = {
      currency: storedCurrency(currency),
      notes: notes.trim(),
      discount: discountAmount,
      taxRate: taxRate / 100,
      items: buildItems(),
      ...party,
    };

    try {
      let saved: Document = document
        ? await documentService.update(document.id, common)
        : await documentService.create({ documentType: kind, documentDate, ...common });

      const id = saved?.id ?? document?.id;
      let paidFailed = false;
      if (isSales && markPaid && !alreadyPaid && id) {
        try {
          saved = { ...saved, ...(await documentService.markPaid(id)) };
        } catch {
          paidFailed = true;
        }
      }

      savedRef.current = true;
      setResult({ doc: saved, paidFailed });
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not save this document. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      noValidate
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="min-w-0 space-y-6">
        {error && (
          <div ref={errorRef} role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-4 text-body-md text-error">
            {error}
          </div>
        )}

        <SectionCard title="Details">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className={labelClasses}>Number</p>
              <div className="flex h-11 items-center rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md font-semibold text-on-surface">
                {document?.documentNumber ?? "Assigned when you save"}
              </div>
            </div>
            <div>
              <label htmlFor="doc-date" className={labelClasses}>
                Date
              </label>
              <input
                id="doc-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                disabled={isEdit || saving}
                className={`${inputClasses} h-11`}
              />
              {isEdit && <p className="mt-1.5 text-xs text-on-surface-variant">The date can't change after the document is created.</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="doc-currency" className={labelClasses}>
                Currency
              </label>
              <CurrencyField id="doc-currency" value={currency} onChange={setCurrency} disabled={saving} />
            </div>
          </div>

          {isSales && (
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-outline-variant pt-5">
              <div>
                <p className="font-bold text-on-surface">Mark as paid</p>
                <p className="text-xs text-on-surface-variant">
                  {alreadyPaid ? "This invoice is already paid and can't be changed back here." : "Leave off to save as a draft invoice."}
                </p>
              </div>
              <Switch checked={markPaid} onChange={setMarkPaid} disabled={alreadyPaid || saving} label="Mark as paid" />
            </div>
          )}
        </SectionCard>

        <SectionCard title={isPurchase ? "Supplier" : "Customer"}>
          {isPurchase ? (
            <div>
              <label htmlFor="doc-supplier" className={labelClasses}>
                Supplier name
              </label>
              <input
                id="doc-supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={saving}
                placeholder="Supplier or vendor name"
                aria-invalid={invalidParty || undefined}
                className={`${inputClasses} h-11 ${invalidParty ? "border-error" : ""}`}
              />
            </div>
          ) : (
            <CustomerField
              name={customerName}
              onName={setCustomerName}
              customerId={customerId}
              onCustomerId={setCustomerId}
              phone={phone}
              onPhone={setPhone}
              email={email}
              onEmail={setEmail}
              invalid={invalidParty}
              disabled={saving}
            />
          )}
        </SectionCard>

        <SectionCard title="Items">
          <LineItemsEditor items={items} onChange={setItems} symbol={symbol} invalidIds={invalidRows} disabled={saving} />
        </SectionCard>

        <SectionCard title="Notes">
          <label htmlFor="doc-notes" className={labelClasses}>
            Payment terms, delivery instructions or anything else for this document
          </label>
          <textarea
            id="doc-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
            className={`${inputClasses} py-3`}
          />
        </SectionCard>
      </div>

      <aside className="xl:sticky xl:top-[94px] xl:self-start">
        <TotalsPanel
          symbol={symbol}
          subtotal={subtotal}
          taxPct={taxPct}
          onTaxPct={setTaxPct}
          taxAmount={taxAmount}
          showDiscount={isSales}
          discount={discount}
          onDiscount={setDiscount}
          grandTotal={grandTotal}
          saving={saving}
          saveLabel={isEdit ? "Save changes" : isSales ? "Save invoice" : "Save document"}
          onSave={handleSave}
        />
      </aside>

      <SavedDialog
        open={result !== null}
        documentNumber={result?.doc.documentNumber ?? ""}
        kind={kind}
        mode={isEdit ? "updated" : "created"}
        paidFailed={result?.paidFailed ?? false}
        onView={() => result && router.push(docHref(result.doc.id))}
        onBack={() => router.push(docsHref)}
        onCreateAnother={!isEdit ? onCreateAnother : undefined}
        onDeduct={
          !isStaff && isSales && result && result.doc.status !== "draft"
            ? () => startDeduct(fromDocument(result.doc))
            : undefined
        }
        deductBusy={result !== null && loadingId === result.doc.id}
      />

      {!isStaff && deductOverlay}
    </form>
  );
}