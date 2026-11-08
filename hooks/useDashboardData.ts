'use client';

import { useQuery } from '@tanstack/react-query';
import { businessService } from '@/services/business';
import { reportService } from '@/services/reports';
import { customerService } from '@/services/customers';
import { documentService } from '@/services/documents';

// Each block is its own query, so one bad endpoint never blanks the page and a
// failed block is retried on the next visit instead of being cached as empty.
// The report and analytics keys match useReports, so both pages share one fetch.
export function useDashboardData() {
  const summary = useQuery({
    queryKey: ['business', 'summary'],
    queryFn: () => businessService.getSummaryData(),
  });
  const report = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportService.getDashboard(),
  });
  const customers = useQuery({
    queryKey: ['reports', 'customer-analytics'],
    queryFn: () => customerService.fetchCustomerAnalytics(),
  });
  const unpaid = useQuery({
    queryKey: ['documents', 'unpaid-count'],
    queryFn: async () => (await documentService.list({ documentType: 'sales_invoice', status: 'unpaid' })).count,
  });

  const all = [summary, report, customers, unpaid];

  return {
    summary: summary.data ?? null,
    report: report.data ?? null,
    customers: customers.data ?? null,
    unpaidCount: unpaid.data ?? null,
    isLoading: all.some((q) => q.isPending),
    reload: () => {
      all.forEach((q) => {
        q.refetch();
      });
    },
  };
}