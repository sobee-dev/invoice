// app/(owner)/new-document/page.tsx
"use client";

import { DocumentEditorPage } from "@/components/docs/DocumentEditorPage";

export default function NewDocumentPage() {
  return <DocumentEditorPage kinds={["proforma_invoice", "purchase_invoice"]} />;
}