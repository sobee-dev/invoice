// hooks/useDeductStock.tsx
"use client";

import { useCallback, useState } from "react";
import { AppliedDeduction, DeductItem, DeductStockModal } from "@/components/docs/DeductStockModal";
import type { RowMenuItem } from "@/components/ui/RowMenu";
import { Toast, ToastState } from "@/components/ui/Toast";
import { canDeductStock, type DocumentRowData } from "@/lib/documents";
import { documentService } from "@/services/documents";
import { productService } from "@/services/products";

const STOCK_LOOKUP_CHUNK = 5;

interface Target {
  documentId: string;
  documentNumber: string;
  items: DeductItem[];
}

// Returns the menu item to add to a document row, and an overlay to render once
// on the page (the modal and its toast).
export function useDeductStock() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const start = useCallback(async (row: DocumentRowData) => {
    setLoadingId(row.id);
    try {
      // List rows carry no line items, so fetch the whole document.
      const full = await documentService.get(row.id);
      const tracked = (full.items ?? []).filter((li) => li.product);

      if (tracked.length === 0) {
        setToast({ tone: "error", text: "This invoice has no product-linked items, so there is no stock to deduct." });
        return;
      }

      // A few products at a time, so a long invoice never fires dozens of requests at once.
      const productIds = [...new Set(tracked.map((li) => li.product!))];
      const stock = new Map<string, { sku: string | null; qty: number }>();
      for (let i = 0; i < productIds.length; i += STOCK_LOOKUP_CHUNK) {
        const settled = await Promise.allSettled(productIds.slice(i, i + STOCK_LOOKUP_CHUNK).map((id) => productService.get(id)));
        settled.forEach((r) => {
          if (r.status === "fulfilled") stock.set(r.value.id, { sku: r.value.sku, qty: Number(r.value.quantityOnHand) });
        });
      }

      setTarget({
        documentId: row.id,
        documentNumber: row.documentNumber,
        items: tracked.map((li) => {
          const s = stock.get(li.product!);
          return {
            itemId: li.id,
            productId: li.product!,
            name: li.description,
            sku: s?.sku ?? "—",
            invoicedQty: Math.round(li.quantity),
            currentStock: s ? Math.round(s.qty) : 0,
          };
        }),
      });
    } catch {
      setToast({ tone: "error", text: "Could not load this invoice for stock deduction. Please try again." });
    } finally {
      setLoadingId(null);
    }
  }, []);

  const actionsFor = useCallback(
    (row: DocumentRowData): RowMenuItem[] =>
      canDeductStock(row)
        ? [
            {
              label: loadingId === row.id ? "Loading stock..." : "Deduct stock",
              icon: "inventory_2",
              onClick: () => {
                if (loadingId === null) start(row);
              },
            },
          ]
        : [],
    [loadingId, start],
  );

  const handleApplied = (deductions: AppliedDeduction[]) => {
    setTarget(null);
    const lines = deductions.map((d) => `${d.name}: -${d.deductQty}`).join("\n");
    setToast({ tone: "success", text: `Stock updated.\n${lines}` });
  };

  const overlay = (
    <>
      <DeductStockModal
        open={target !== null}
        documentId={target?.documentId ?? ""}
        documentNumber={target?.documentNumber ?? ""}
        items={target?.items ?? []}
        onClose={() => setTarget(null)}
        onApplied={handleApplied}
      />
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );

    return { actionsFor, overlay, start, loadingId };
}