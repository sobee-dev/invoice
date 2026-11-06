'use client';

import { useCallback, useEffect, useState } from 'react';
import { businessService, SummaryData } from '@/services/business';
import { reportService, ReportsDashboard } from '@/services/reports';
import { customerService, CustomerAnalytics } from '@/services/customers';
import { productService, Product } from '@/services/products';
import { documentService } from '@/services/documents';

export interface InventoryTotals { value: number; skuCount: number; }

// Same approach as mobile stock-report.tsx: a business-wide total needs every page.
async function fetchInventoryTotals(): Promise<InventoryTotals> {
  let page = 1;
  let all: Product[] = [];
  while (true) {
    const res = await productService.list({ page });
    all = all.concat(res.results);
    if (!res.next) break;
    page += 1;
  }
  return {
    value: all.reduce((sum, p) => sum + Number(p.unitPrice) * Number(p.quantityOnHand), 0),
    skuCount: all.length,
  };
}

export function useDashboardData() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [report, setReport] = useState<ReportsDashboard | null>(null);
  const [customers, setCustomers] = useState<CustomerAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryTotals | null>(null);
  const [unpaidCount, setUnpaidCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    // Each block fails on its own so one bad endpoint never blanks the page.
    const [s, r, c, i, u] = await Promise.allSettled([
      businessService.getSummaryData(),
      reportService.getDashboard(),
      customerService.fetchCustomerAnalytics(),
      fetchInventoryTotals(),
      documentService.list({ documentType: 'sales_invoice', status: 'unpaid' }),
    ]);
    setSummary(s.status === 'fulfilled' ? s.value : null);
    setReport(r.status === 'fulfilled' ? r.value : null);
    setCustomers(c.status === 'fulfilled' ? c.value : null);
    setInventory(i.status === 'fulfilled' ? i.value : null);
    setUnpaidCount(u.status === 'fulfilled' ? u.value.count : null);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { summary, report, customers, inventory, unpaidCount, isLoading, reload: load };
}
