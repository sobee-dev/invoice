// services/reports.ts  (identical on mobile and web)
import api from '../lib/axios';

export interface MonthlyRevenuePoint {
  month:   string;
  value:   number | string;
  current: boolean;
}

export interface ReportsDashboard {
  monthlyRevenue:   MonthlyRevenuePoint[];
  revenueTotal:     number | string;
  revenueGrowth:    string;
  avgInvoiceValue:  number | string;
  collectionRate:   string;
  outstandingTotal: number | string; // what is still owed across all customers
  outstandingInvoiceCount?:  number;
  outstandingCustomerCount?: number;
}

export interface OutstandingOverview {
  totalOutstanding: number | string;
  invoiceCount:     number;
  customerCount:    number;
  ageing:           { label: string; amount: number | string }[];
  topDebtors:       { customerId: string; fullName: string; total: number | string; invoiceCount: number }[];
}

export const reportService = {
  async getDashboard(): Promise<ReportsDashboard> {
    const { data } = await api.get<ReportsDashboard>('/api/reports/dashboard/');
    return data;
  },

  async getOutstanding(): Promise<OutstandingOverview> {
    const { data } = await api.get<OutstandingOverview>('/api/reports/outstanding/');
    return data;
  },
};