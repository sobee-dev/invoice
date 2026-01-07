import Dexie, { type EntityTable } from 'dexie';
import type {Business,Receipt,ReceiptItem,OutboxOperation,SyncState,} from './types';

// Define the database
const db = new Dexie('InvoiceAppDB') as Dexie & {
  business: EntityTable<Business, 'id'>;
  receipts: EntityTable<Receipt, 'id'>;
  receiptItems: EntityTable<ReceiptItem, 'id'>;
  outbox: EntityTable<OutboxOperation, 'id'>;
  syncState: EntityTable<SyncState, 'id'>;
};

// Schema
db.version(1).stores({
  business: 'id, serverId, updatedAt, syncStatus',
  receipts: 'id, businessId, receiptNumber, createdAt, updatedAt, syncStatus, serverId, isPaid', // ✅ Added isPaid index
  receiptItems: 'id, receiptId, serverId, syncStatus',
  outbox: '++id, entityType, entityId, operation, createdAt, retryCount',
  syncState: 'id, entityType',
});

export { db };

// Available templates (static for now; could be fetched from server later)
export const TEMPLATES = [
  {
    id: 'template-classic',
    name: 'Classic',
    description: 'Clean and professional layout with traditional styling',
    previewImage: '/templates/classic-preview.png',
  },
  {
    id: 'template-modern',
    name: 'Modern',
    description: 'Sleek, minimal design with bold typography',
    previewImage: '/templates/modern-preview.png',
  },
  {
    id: 'template-compact',
    name: 'Compact',
    description: 'Space-efficient layout ideal for thermal printers',
    previewImage: '/templates/compact-preview.png',
  },
];
