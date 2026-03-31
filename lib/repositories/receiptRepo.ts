import { db } from '../db';
import type { Receipt, ReceiptItem, ReceiptDraft, DraftItem } from '../types';
import { calculateReceiptTotals, generateReceiptNumber } from '../types';


// QUERY OPERATIONS

export async function getReceipts(): Promise<Receipt[]> {
  return db.receipts
    .reverse()
    .sortBy('createdAt');
}

// RECEIPT NUMBERING

// Helper — derives the prefix from the business name
export function getReceiptPrefix(businessName: string): string {
  const words = businessName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    // One word → first 3 letters
    return words[0].slice(0, 3).toUpperCase();
  }

  if (words.length === 2) {
    // Two words → first 2 letters of word 1 + first letter of word 2
    return (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase();
  }

  // Three or more words → first letter of each word
  return words.map((w) => w[0]).join("").toUpperCase();
}

export async function getNextReceiptNumber(): Promise<string> {
  const business = await db.business.toCollection().first();
  const businessName = business?.name?.trim();

  // Fallback prefix if no business name is set yet
  const prefix = businessName ? getReceiptPrefix(businessName) : "RCP";

  const lastReceipt = await db.receipts.orderBy("createdAt").last();

  if (!lastReceipt) return `${prefix}-001`;

  const lastNumber = lastReceipt.receiptNumber;
  const match = lastNumber.match(/(\d+)$/);

  if (match) {
    const nextValue = parseInt(match[0]) + 1;
    return `${prefix}-${nextValue.toString().padStart(3, "0")}`;
  }

  return `${prefix}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
}

//CREATE RECEIPT (OFFLINE-FIRST)

export async function saveReceipt(draft: ReceiptDraft): Promise<Receipt> {
  // VALIDATION: Get business from cache
  const business = await db.business.toArray();
  const biz = business[0];

  if (!biz) throw new Error("Business not found, Please complete onboarding");
  
  // SETUP: Generate IDs and timestamps
  const now = new Date().toISOString();  // ISO format (not Date.now())
  const receiptId = crypto.randomUUID();

  // CALCULATIONS: Compute totals
  const { subtotal, taxAmount, grandTotal } = calculateReceiptTotals(
    draft.items,
    draft.taxEnabled,
    draft.taxRate,
    draft.discount
  );

  

  // BUILD: Create receipt object

  const newReceipt: Receipt = {
    
    id: receiptId,
    serverId: undefined,  // ✅ Will be set after sync
    businessId: biz.id,
    templateId: biz.selectedTemplateId || 'template-classic',
    receiptNumber: draft.receiptNumber,
    receiptDate: draft.receiptDate,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone || undefined,
    customerEmail: draft.customerEmail || undefined,
    subtotal,
    taxRate: draft.taxRate,
    taxAmount,
    discount: draft.discount,
    isPaid: true,
    grandTotal,
    notes: draft.notes || undefined,
    syncStatus: 'pending',  // ✅ Needs sync
    createdAt: now,
    updatedAt: now,
    
  };


  const newItems: ReceiptItem[] = draft.items.map((item, index) => ({
    id: crypto.randomUUID(),
    receiptId: receiptId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice,
    order: index,
  }));

  
  try {
    await db.transaction('rw',[db.receipts, db.receiptItems, db.outbox],async () => {
  
        await db.receipts.add(newReceipt);
        await db.receiptItems.bulkAdd(newItems);
        
        // 3. Queue for sync
        await db.outbox.add({
          entityType: 'receipts', 
          entityId: receiptId,  
          operation: 'create',     
          payload: { ...newReceipt, items: newItems },
          createdAt: now,
          retryCount: 0,   
        });
      }
    );

    return newReceipt;

  } catch (error) {
    console.error('❌ Failed to save receipt:', error);
    throw new Error('Failed to save receipt locally');
  }
}

export async function deleteReceipt(id: string): Promise<void> {

  const now = new Date().toISOString();  // ✅ ISO format

  try {
    await db.transaction('rw', [db.receipts, db.outbox], async () => {
      // Mark as deleted
      await db.receipts.update(id, {
        deletedAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });

      // Queue for server deletion
      await db.outbox.add({
        entityType: 'receipts',
        entityId: id,
        operation: 'delete',
        payload: { id, deletedAt: now },
        createdAt: now,
        retryCount: 0,
      });
    });
  } catch (error) {
    console.error('❌ Failed to delete receipt:', error);
    throw new Error('Failed to delete receipt');
  }
}

export async function getReceiptWithItems(id: string) {
  const receipt = await db.receipts.get(id);
  if (!receipt) return null;

  const items = await db.receiptItems
    .where('receiptId')
    .equals(id)
    .sortBy('order');

  return { receipt, items };
}



export async function markReceiptPaid(id: string): Promise<Receipt> {
  const now = new Date().toISOString();

  try {
    const receipt = await db.receipts.get(id);
    if (!receipt) {
      throw new Error('Receipt not found');
    }

    await db.transaction('rw', [db.receipts, db.outbox], async () => {
      // Update receipt
      await db.receipts.update(id, {
        isPaid: true,
        paidAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });

      // Queue for sync
      await db.outbox.add({
        entityType: 'receipts',
        entityId: id,
        operation: 'update',
        payload: {
          id,
          serverId: receipt.serverId,
          isPaid: true,
          paidAt: now,
          updatedAt: now,
        },
        createdAt: now,
        retryCount: 0,
      });
    });

    // Return updated receipt
    const updatedReceipt = await db.receipts.get(id);
    if (!updatedReceipt) {
      throw new Error('Failed to retrieve updated receipt');
    }
    return updatedReceipt;
  } catch (error) {
    console.error('Failed to mark receipt as paid:', error);
    throw new Error('Failed to mark receipt as paid');
  }
}

export async function markReceiptUnpaid(id: string): Promise<Receipt> {
  const now = new Date().toISOString();

  try {
    const receipt = await db.receipts.get(id);
    if (!receipt) {
      throw new Error('Receipt not found');
    }

    await db.transaction('rw', [db.receipts, db.outbox], async () => {
      // Update receipt
      await db.receipts.update(id, {
        isPaid: false,
        paidAt: undefined,
        updatedAt: now,
        syncStatus: 'pending',
      });

      // Queue for sync
      await db.outbox.add({
        entityType: 'receipts',
        entityId: id,
        operation: 'update',
        payload: {
          id,
          serverId: receipt.serverId,
          isPaid: false,
          paidAt: null,
          updatedAt: now,
        },
        createdAt: now,
        retryCount: 0,
      });
    });

    // Return updated receipt
    const updatedReceipt = await db.receipts.get(id);
    if (!updatedReceipt) {
      throw new Error('Failed to retrieve updated receipt');
    }
    return updatedReceipt;
  } catch (error) {
    console.error('Failed to mark receipt as unpaid:', error);
    throw new Error('Failed to mark receipt as unpaid');
  }
}

// ============================================
// FILTER OPERATIONS
// ============================================

export async function getPaidReceipts(): Promise<Receipt[]> {
  return db.receipts
    .filter(r => !r.deletedAt && r.isPaid)
    .reverse()
    .sortBy('createdAt');
}

export async function getUnpaidReceipts(): Promise<Receipt[]> {
  return db.receipts
    .filter(r => !r.deletedAt && !r.isPaid)
    .reverse()
    .sortBy('createdAt');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function getUnsyncedCount(): Promise<number> {
  try {
    return await db.receipts
      .where('syncStatus')
      .equals('pending')
      .count();
  } catch (error) {
    console.error('Failed to get unsynced count:', error);
    return 0;
  }
}

export async function getTotalRevenue(): Promise<{
  total: number;
  paid: number;
  unpaid: number;
}> {
  try {
    const receipts = await db.receipts.where('deletedAt').equals(0).toArray();

    const total = receipts.reduce((sum, r) => sum + r.grandTotal, 0);
    const paid = receipts
      .filter(r => r.isPaid)
      .reduce((sum, r) => sum + r.grandTotal, 0);
    const unpaid = total - paid;

    return { total, paid, unpaid };
  } catch (error) {
    console.error('Failed to calculate revenue:', error);
    return { total: 0, paid: 0, unpaid: 0 };
  }
}
