// app/(owner)/new-sales-invoice/page.tsx
"use client";

import { DocumentEditorPage } from "@/components/docs/DocumentEditorPage";

export default function NewSalesInvoicePage() {
  return <DocumentEditorPage kinds={["sales_invoice"]} />;
}