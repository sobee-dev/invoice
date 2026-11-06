// app/(owner)/clients/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClientForm } from "@/components/clients/ClientForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { Customer, customerService } from "@/services/customers";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Customer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    customerService
      .get(id)
      .then((c) => {
        if (cancelled) return;
        setClient(c);
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === "loading") {
    return <div className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state === "failed" || !client) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon="cloud_off"
          title="We could not load this client"
          action={
            <Link href="/clients" className={btnNavy}>
              Back to clients
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit client" subtitle={client.fullName} backHref={`/clients/${client.id}`} backLabel="Client" />
      <ClientForm key={client.id} client={client} />
    </div>
  );
}