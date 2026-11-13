// app/(staff)/staff/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdBanner } from "@/components/ads/AdBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { DocumentsTable } from "@/components/docs/DocumentsTable";
import { NewDocumentMenu } from "@/components/docs/NewDocumentMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useStaffDashboard } from "@/hooks/useStaffDashboard";
import { fetchDocumentPage } from "@/lib/documents";
import { ROUTES, staffDocRoute } from "@/lib/routes";
import { resolveCurrency } from "@/utils/currencySymbol";
import { fmtMoney } from "@/utils/money";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { business } = useBusiness();

  const { data: stats } = useStaffDashboard();

  // The backend already limits staff to the documents they created.
  const recent = useQuery({
    queryKey: ["documents", "staff-recent"],
    queryFn: async () => (await fetchDocumentPage({ page: 1 })).rows.slice(0, 4),
  });
  const rows = recent.data ?? [];
  const rowsLoading = recent.isPending;
  const rowsFailed = recent.isError && !recent.data;

  const symbol = business?.currency ? resolveCurrency(business.currency).symbol : "";
  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

  const dash = "...";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-primary">Welcome back, {displayName}</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant">
            Here is a summary of your performance for{" "}
            <span className="font-semibold text-primary">{business?.name || "..."}</span>.
          </p>
        </div>
        <NewDocumentMenu variant="staff" mobileAlign="left" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon="payments" iconBg="bg-primary-fixed" iconColor="text-light-blue"
          label="Revenue generated"
          value={stats ? fmtMoney(Number(stats.revenueGenerated), symbol, 2) : dash}
          sub="All-time total from your paid invoices"
        />
        <StatCard
          icon="receipt_long" iconBg="bg-secondary-fixed" iconColor="text-secondary"
          label="Documents"
          value={stats ? String(stats.documentsCreated) : dash}
          sub="Total created by you"
        />
        <StatCard
          icon="trending_up" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed-variant"
          label="Average transaction"
          value={stats ? fmtMoney(Number(stats.avgTransactionValue), symbol, 2) : dash}
          sub="Per document"
        />
      </div>

      <SectionCard
        title="My Recent Documents"
        divided
        bodyClassName="p-0"
        action={
          <Link href={ROUTES.staffDocs} className="text-sm font-semibold text-primary hover:underline">
            View All
          </Link>
        }
      >
        {rowsFailed ? (
          <EmptyState
            icon="cloud_off"
            title="We could not load your recent documents"
            action={
              <button
                type="button"
                onClick={() => {
                  recent.refetch();
                }}
                className="h-10 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary"
              >
                Try again
              </button>
            }
          />
        ) : (
          <DocumentsTable
            rows={rows}
            fallbackCurrency={business?.currency ?? "USD"}
            isLoading={rowsLoading}
            skeletonRows={4}
            hrefFor={(row) => staffDocRoute(row.id)}
            empty={
              <EmptyState
                icon="description"
                title="No recent documents found"
                description="Invoices you create will appear here."
              />
            }
          />
        )}
      </SectionCard>

      <AdBanner placement="dashboard-footer" />
    </div>
  );
}