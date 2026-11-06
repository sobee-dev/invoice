// utils/exportCsv.ts
import { DocumentRowData, TYPE_LABEL } from "@/lib/documents";

// A cell starting with = + - or @ can run as a formula in Excel. A leading
// quote keeps it as plain text.
const guard = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function exportDocumentsCsv(rows: DocumentRowData[]) {
  const header = ["Number", "Type", "Customer / Supplier", "Amount", "Currency", "Status", "Created"];
  const lines = rows.map((r) => [
    guard(r.documentNumber),
    TYPE_LABEL[r.documentType],
    guard(r.counterparty),
    r.amount.toFixed(2),
    r.currency,
    r.status,
    r.createdAt,
  ]);

  const csv = [header, ...lines].map((cols) => cols.map((c) => quote(String(c ?? ""))).join(",")).join("\r\n");

  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `billbuzz-documents-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}