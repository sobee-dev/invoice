// app/(staff)/staff/new-sales-invoice/page.tsx
"use client";

import { DocumentEditorPage } from "@/components/docs/DocumentEditorPage";

export default function StaffNewSalesInvoicePage() {
  return <DocumentEditorPage kinds={["sales_invoice"]} area="staff" />;
}