// Domain types for the receipt generator app

export type SyncStatus = 'pending' | 'synced' | 'error' | 'deleted';
export type EntityType = 'business' | 'receipts' | 'receiptItem';
export type OperationType = 'create' | 'update' | 'delete';

export interface Business {
  id: string;
  name: string;
  description: string;
  addressOne: string;
  addressTwo?: string;
  phone: string;
  email: string;
  registrationNumber?: string;
  logo?: string; // base64 or URL
  currency: string;
  taxRate: number; // e.g., 0.10 for 10%
  taxEnabled: boolean;
  selectedTemplateId: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  motto?: string;
  signature: string;
  serverId?: number;
  syncStatus: SyncStatus;

}

export interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string; // path to preview thumbnail
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  id: string;
  serverId?: number;
  businessId: string;
  templateId: string;
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  notes?: string;
  isPaid: boolean;          
  paidAt?: string;           
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// For creating new receipts (before saving)
export interface ReceiptDraft {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  receiptDate: string;
  receiptNumber: string;
  notes: string;
  items: DraftItem[];
  taxEnabled: boolean;
  taxRate: number;
  discount: number;
}

export interface DraftItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Outbox for offline sync
export interface OutboxOperation {
  id?: number;
  entityType: EntityType;
  entityId: string;
  operation: OperationType;
  payload: unknown;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// Sync cursor tracking
export interface SyncState {
  id: string;
  lastPulledAt: number;
  lastPushedAt: number;
  deviceId: string;
}

// Utility: calculate receipt totals
export function calculateReceiptTotals(
  items: DraftItem[],
  taxEnabled: boolean,
  taxRate: number,
  discount: number = 0
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = taxEnabled ? subtotal * taxRate : 0;
  const grandTotal = subtotal + taxAmount - discount;
  
  return { subtotal, taxAmount, grandTotal };
}

// Utility: generate receipt number
export function generateReceiptNumber(lastNumber: string | null): string {
  if (!lastNumber) return '#001';
  const match = lastNumber.match(/\d+/);
  if (!match) return '#001';
  const next = parseInt(match[0], 10) + 1;
  return `#${String(next).padStart(3, '0')}`;
}
