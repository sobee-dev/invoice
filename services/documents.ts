// services/documents.ts  (identical on mobile and web)
import api from '../lib/axios';

export type DocumentType = 'purchase_invoice' | 'proforma_invoice' | 'sales_invoice';
export type DocumentStatus = 'draft' | 'paid' | 'unpaid' | 'delivered' | 'deleted';

// not_applicable: nothing tracked in stock. pending: nothing deducted yet.
// partial: some quantity deducted. deducted: every tracked item fully deducted.
export type StockStatus = 'not_applicable' | 'pending' | 'partial' | 'deducted';

export interface DocumentItem {
  id: string;
  document: string;
  product?: string; // product UUID, null if unset or deleted (SET_NULL)
  productImageUrl?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  order: number;
  quantityDeducted?: number | string; // DRF decimals arrive as strings
  quantityReturned?: number | string;
}

export type DocumentItemPayload = Omit<
  DocumentItem,
  'id' | 'document' | 'total' | 'order' | 'quantityDeducted' | 'quantityReturned'
> & {
  productName?: string; // new/free-text name, backend resolves via get_or_create_product
};

export interface Document {
  id: string;
  business: string;
  customer?: string;
  documentType: DocumentType;
  status: DocumentStatus;
  stockStatus: StockStatus;
  stockDeductedAt?: string | null;
  documentNumber: string;
  documentDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  supplierName: string;
  currency: string;
  subtotal: number;
  taxRate: number; // e.g. 0.15
  taxAmount: number;
  discount: number;
  grandTotal: number;
  returnedCredit: number | string;
  balanceDue: number | string;
  notes: string;
  amountPaid: number;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    email: string;
    displayName: string;
  };
  updatedAt: string;
  items?: DocumentItem[];
}

// Status, money and stock fields are server controlled, so they are never sent.
type ServerOnly =
  | 'id' | 'business' | 'createdBy' | 'subtotal' | 'taxAmount' | 'documentNumber' | 'grandTotal'
  | 'createdAt' | 'updatedAt' | 'items' | 'status' | 'stockStatus' | 'stockDeductedAt'
  | 'amountPaid' | 'returnedCredit' | 'balanceDue' | 'paidAt' | 'isDelivered' | 'deliveredAt';

export type DocumentCreatePayload = Partial<Omit<Document, ServerOnly>> & {
  documentType: DocumentType;
  documentDate: string; // ISO date, required (no default on model)
  items?: DocumentItemPayload[];
};

export type DocumentUpdatePayload = Partial<Omit<Document, ServerOnly | 'documentType'>> & {
  items?: DocumentItemPayload[]; // full replace, update() deletes existing items and recreates them
};

export interface DeductionItem {
  itemId: string;
  qty: number;
}

export interface DocumentListParams {
  documentType?: DocumentType;
  status?:       DocumentStatus;
  stockStatus?:  StockStatus;
  search?:       string;
  customer?:     string;
  page?:         number;
  ordering?:     string;
}

export interface PaginatedResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

export const documentService = {
  async list(params?: DocumentListParams): Promise<PaginatedResponse<Document>> {
    const { data } = await api.get('/api/documents/', { params });
    return data;
  },

  async get(id: string): Promise<Document> {
    const { data } = await api.get(`/api/documents/${id}/`);
    return data;
  },

  async create(payload: DocumentCreatePayload): Promise<Document> {
    const { data } = await api.post('/api/documents/', payload);
    return data;
  },

  async update(id: string, payload: DocumentUpdatePayload): Promise<Document> {
    const { data } = await api.patch(`/api/documents/${id}/`, payload);
    return data;
  },

  /** Marks a draft paid in one step, or records the remaining balance of an unpaid invoice. */
  async markPaid(id: string, options?: { method?: string; reference?: string }): Promise<Document> {
    const { data } = await api.post(`/api/documents/${id}/mark-paid/`, options ?? {});
    return data;
  },

  /** Draft sales invoice to unpaid. deductStock also deducts every item in the same step. */
  async markUnpaid(id: string, options?: { deductStock?: boolean }): Promise<Document> {
    const { data } = await api.post(`/api/documents/${id}/mark-unpaid/`, { deductStock: options?.deductStock ?? false });
    return data;
  },

  /** Mark a document as delivered (Document.mark_delivered) */
  async markDelivered(id: string): Promise<Document> {
    const { data } = await api.post(`/api/documents/${id}/deliver/`);
    return data;
  },

  /** Soft-delete a document (Document.soft_delete) */
  async softDelete(id: string): Promise<{ status: string; id: string }> {
    const { data } = await api.post(`/api/documents/${id}/soft-delete/`);
    return data;
  },

  /** Deduct stock for a sales invoice. The server refuses to deduct more than what is left. */
  async deductInventory(id: string, deductions: DeductionItem[]): Promise<{ status: string; stockStatus: StockStatus }> {
    const { data } = await api.post(`/api/documents/${id}/deduct-inventory/`, {
      items: deductions.map(d => ({ itemId: d.itemId, quantity: d.qty })),
    });
    return data;
  },

  /** Deduct everything that is left on the invoice in one call. */
  async deductAllInventory(id: string): Promise<{ status: string; stockStatus: StockStatus }> {
    const { data } = await api.post(`/api/documents/${id}/deduct-inventory/`, { subtractAll: true });
    return data;
  },

  /** Add supplier-order items back into inventory */
  async addToInventory(id: string): Promise<{ status: string }> {
    const { data } = await api.post(`/api/documents/${id}/add-to-inventory/`);
    return data;
  },
};