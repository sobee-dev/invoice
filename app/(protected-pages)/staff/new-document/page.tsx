// app/(staff)/staff/new-document/page.tsx
"use client";

import { DocumentEditorPage } from "@/components/docs/DocumentEditorPage";

// Staff do not create supplier orders, so only proformas are offered here.
export default function StaffNewDocumentPage() {
  return <DocumentEditorPage kinds={["proforma_invoice"]} area="staff" />;
}