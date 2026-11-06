// app/(owner)/clients/new/page.tsx
"use client";

import { ClientForm } from "@/components/clients/ClientForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add client" subtitle="Someone you invoice." backHref="/clients" backLabel="Clients" />
      <ClientForm />
    </div>
  );
}