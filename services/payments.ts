// services/payments.ts  (identical on mobile and web)
import api from '../lib/axios';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'card', 'check', 'other'];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  check: 'Check',
  other: 'Other',
};

export type StockStatus = 'not_applicable' | 'pending' | 'partial' | 'deducted';

// DRF sends decimals as strings, so money and quantities arrive as string.
export interface PaymentAllocation {
  id: string;
  document: string;
  documentNumber: string;
  amount: string;
}

export interface Payment {
  id: string;
  customer: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string;
  recordedByName: string | null;
  allocations: PaymentAllocation[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CustomerPaymentsResponse extends Paginated<Payment> {
  summary: { outstandingBalance: string; unpaidInvoiceCount: number };
}

export interface RecordPaymentPayload {
  amount: string; // "1500.50", at most 2 decimals
  method?: PaymentMethod;
  reference?: string;
  note?: string;
  documentId?: string | null; // omit to apply to the oldest unpaid invoices first
  idempotencyKey: string;
}

export interface InvoiceSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  customer: string | null;
  customerName: string;
  currency: string;
  status: 'draft' | 'unpaid' | 'paid' | 'delivered' | 'deleted';
  stockStatus: StockStatus;
  grandTotal: string;
  returnedCredit: string;
  amountPaid: string;
  balanceDue: string;
}

export interface InvoiceHistoryItem {
  id: string;
  product: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  quantityDeducted: string;
  quantityReturned: string;
  returnable: string;
}

export interface InvoiceHistoryPayment {
  id: string;
  payment: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  voidedAt: string | null;
  recordedByName: string | null;
}

export interface InvoiceReturn {
  id: string;
  item: string;
  description: string;
  quantity: string;
  creditAmount: string;
  reason: string;
  createdAt: string;
}

export interface InvoiceHistory {
  invoice: InvoiceSummary;
  items: InvoiceHistoryItem[];
  payments: InvoiceHistoryPayment[];
  returns: InvoiceReturn[];
}

export interface OutstandingInvoice {
  id: string;
  documentNumber: string;
  documentDate: string;
  customer: string | null;
  customerName: string;
  currency: string;
  stockStatus: StockStatus;
  grandTotal: string;
  returnedCredit: string;
  amountPaid: string;
  balanceDue: string;
  daysOutstanding: number;
}

export interface OutstandingResponse extends Paginated<OutstandingInvoice> {
  summary: { totalOutstanding: string; invoiceCount: number; customerCount: number };
}

/** A key the server uses to ignore a retried request. 8 to 64 of [A-Za-z0-9_-]. */
export function makeIdempotencyKey(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}

export const paymentService = {
  async customerPayments(customerId: string, params?: { limit?: number; offset?: number }): Promise<CustomerPaymentsResponse> {
    const { data } = await api.get(`/api/payments/customers/${customerId}/payments/`, { params });
    return data;
  },

  async recordPayment(
    customerId: string,
    payload: RecordPaymentPayload,
  ): Promise<{ payment: Payment; outstandingBalance: string }> {
    const { data } = await api.post(`/api/payments/customers/${customerId}/payments/`, payload);
    return data;
  },

  async invoiceHistory(documentId: string): Promise<InvoiceHistory> {
    const { data } = await api.get(`/api/payments/invoices/${documentId}/history/`);
    return data;
  },

  /** quantity is a string so decimals never pass through a float. */
  async returnItems(
    documentId: string,
    payload: { items: { itemId: string; quantity: string }[]; reason?: string },
  ): Promise<InvoiceHistory> {
    const { data } = await api.post(`/api/payments/invoices/${documentId}/returns/`, payload);
    return data;
  },

  async voidPayment(paymentId: string, reason: string): Promise<{ payment: Payment; outstandingBalance: string }> {
    const { data } = await api.post(`/api/payments/records/${paymentId}/void/`, { reason });
    return data;
  },

  async outstanding(params?: { customer?: string; limit?: number; offset?: number }): Promise<OutstandingResponse> {
    const { data } = await api.get('/api/payments/outstanding/', { params });
    return data;
  },
};