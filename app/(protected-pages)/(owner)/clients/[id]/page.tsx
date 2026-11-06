// app/(owner)/clients/[id]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClientActivityFeed } from "@/components/clients/ClientActivityFeed";
import { ClientProfileCard } from "@/components/clients/ClientProfileCard";
import { ClientRecentDocuments } from "@/components/clients/ClientRecentDocuments";
import { RevenueTimeline } from "@/components/clients/RevenueTimeline";
import { StatCard } from "@/components/dashboard/StatCard";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { Icon } from "@/components/layout/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { Toast, ToastState } from "@/components/ui/Toast";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { useBusiness } from "@/context/BusinessContext";
import { useCustomerDocuments } from "@/hooks/useCustomerDocuments";
import { buildActivity } from "@/lib/customerStats";
import { Customer, customerService } from "@/services/customers";
import { resolveCurrency } from "@/utils/currencySymbol";
import { getApiErrorMessage } from "@/utils/getErrorMessage";
import { fmtMoney } from "@/utils/money";

type LoadState = "loading" | "ready" | "missing" | "error";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useBusiness();
  const currency = resolveCurrency(business?.currency ?? "");
  const symbol = business?.currency ? currency.symbol : "";

  const [client, setClient] = useState<Customer | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const { docs, isLoading: docsLoading, error: docsError, partial, reload: reloadDocs } = useCustomerDocuments(id);

  const loadClient = useCallback(async () => {
    try {
      setClient(await customerService.get(id));
      setState("ready");
    } catch (err: any) {
      setState(err?.response?.status === 404 ? "missing" : "error");
    }
  }, [id]);

  useEffect(() => {
    setState("loading");
    loadClient();
  }, [loadClient]);

  // Deleted documents stay out of every figure and list on this page.
  const live = useMemo(() => docs.filter((d) => d.status !== "deleted"), [docs]);
  const events = useMemo(() => buildActivity(live), [live]);
  const salesInvoices = useMemo(() => live.filter((d) => d.documentType === "sales_invoice"), [live]);
  const paidCount = salesInvoices.filter((d) => d.status === "paid").length;
  const unpaidCount = salesInvoices.filter((d) => d.status === "unpaid").length;

  const copyContact = async () => {
    if (!client) return;
    const lines = [
      client.fullName,
      client.phone ? `Phone: ${client.phone}` : null,
      client.email ? `Email: ${client.email}` : null,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setToast({ tone: "success", text: "Contact details copied." });
    } catch {
      setToast({ tone: "error", text: "Could not copy. Your browser blocked clipboard access." });
    }
  };

  const changeStatus = async (next: "active" | "inactive") => {
    if (!client) return;
    setStatusBusy(true);
    try {
      const updated = next === "inactive" ? await customerService.deactivate(client.id) : await customerService.reactivate(client.id);
      setClient((prev) => (prev ? { ...prev, ...updated } : updated));
      setToast({ tone: "success", text: next === "inactive" ? "Client deactivated." : "Client reactivated." });
    } catch (err: any) {
      setToast({ tone: "error", text: getApiErrorMessage(err, "Could not update this client. Please try again.") });
    } finally {
      setStatusBusy(false);
    }
  };

  if (state === "loading") {
    return <div className="h-72 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state !== "ready" || !client) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon={state === "missing" ? "person_search" : "cloud_off"}
          title={state === "missing" ? "Client not found" : "We could not load this client"}
          description={state === "missing" ? "They may have been removed." : "Please check your connection and try again."}
          action={
            <Link href="/clients" className={btnNavy}>
              Back to clients
            </Link>
          }
        />
      </div>
    );
  }

  const isActive = client.status === "active";

  const statusButton = isActive ? (
    <button
      type="button"
      onClick={() => setConfirmDeactivate(true)}
      disabled={statusBusy}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-error text-sm font-semibold text-error hover:bg-error-container disabled:opacity-50"
    >
      <Icon name="person_off" size={18} /> Deactivate client
    </button>
  ) : (
    <button type="button" onClick={() => changeStatus("active")} disabled={statusBusy} className={`${btnOutline} h-11 w-full`}>
      <Icon name="person" size={18} /> {statusBusy ? "Reactivating..." : "Reactivate client"}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.fullName}
        subtitle="Billing history, balance and activity for this client."
        backHref="/clients"
        backLabel="Clients"
        actions={
          <>
            <button type="button" onClick={copyContact} className={btnOutline}>
              <Icon name="content_copy" size={16} /> Copy contact
            </button>
            <Link href={`/clients/${client.id}/edit`} className={btnOutline}>
              <Icon name="edit" size={16} /> Edit client
            </Link>
            <NewDocumentMenu customer={client} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="lg:col-start-1 lg:row-start-1">
          <ClientProfileCard client={client} footer={statusButton} />
        </div>

        <div className="min-w-0 space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 2xl:row-span-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon="payments" iconBg="bg-primary-fixed" iconColor="text-light-blue"
              label="Lifetime value"
              value={fmtMoney(Number(client.lifetimeValue) || 0, symbol, 2)}
              sub={docsLoading ? " " : partial ? "Across all paid invoices" : `From ${paidCount} paid ${paidCount === 1 ? "invoice" : "invoices"}`}
            />
            <StatCard
              icon="pending_actions" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
              label="Outstanding"
              value={fmtMoney(Number(client.outstandingBalance) || 0, symbol, 2)}
              sub={docsLoading ? " " : unpaidCount > 0 ? `${unpaidCount} unpaid ${unpaidCount === 1 ? "invoice" : "invoices"}` : "Nothing owed right now"}
              badge={docsLoading ? undefined : unpaidCount > 0 ? { text: `${unpaidCount} unpaid`, tone: "orange" } : { text: "Settled", tone: "green" }}
            />
          </div>

          <RevenueTimeline docs={live} symbol={symbol} currencyCode={currency.code} partial={partial} isLoading={docsLoading} />
        </div>

        <div className="space-y-6 lg:col-start-1 lg:row-start-2 2xl:col-start-3 2xl:row-start-1">
          <ClientRecentDocuments
            client={client}
            docs={live}
            fallbackCurrency={business?.currency ?? "USD"}
            isLoading={docsLoading}
            failed={docsError}
            onRetry={reloadDocs}
          />

          <SectionCard title="Notes">
            {client.notes?.trim() ? (
              <blockquote className="whitespace-pre-line rounded-lg border-l-4 border-secondary bg-secondary-container/30 p-4 text-body-md italic text-on-surface">
                {client.notes}
              </blockquote>
            ) : (
              <p className="text-body-md text-on-surface-variant">
                No notes yet.{" "}
                <Link href={`/clients/${client.id}/edit`} className="font-semibold text-primary-container hover:underline">
                  Add one
                </Link>
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <ClientActivityFeed events={events} isLoading={docsLoading} />

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Deactivate ${client.fullName}?`}
        description="You can reactivate them at any time."
        confirmLabel="Deactivate"
        tone="danger"
        onConfirm={async () => {
          await changeStatus("inactive");
          setConfirmDeactivate(false);
        }}
        onClose={() => setConfirmDeactivate(false)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}