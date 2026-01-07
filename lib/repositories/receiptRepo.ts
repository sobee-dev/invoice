import { db } from '../db';
import type { Receipt, ReceiptItem, ReceiptDraft, DraftItem } from '../types';
import { calculateReceiptTotals, generateReceiptNumber } from '../types';
import { getBusiness } from './businessRepo';


// QUERY OPERATIONS

export async function getReceipts(): Promise<Receipt[]> {
  return db.receipts
    .where('deletedAt')
    .equals(0)
    .or('deletedAt')
    .equals(undefined as unknown as number)
    .reverse()
    .sortBy('createdAt');
}

export async function getReceiptById(id: string): Promise<Receipt | undefined> {
  return db.receipts.get(id);
}

export async function getReceiptItems(receiptId: string): Promise<ReceiptItem[]> {
  return db.receiptItems.where('receiptId').equals(receiptId).toArray();
}



// RECEIPT NUMBERING

export async function getLastReceiptNumber(): Promise<string | null> {
  const lastReceipt = await db.receipts.orderBy('createdAt').last();
  return lastReceipt?.receiptNumber ?? null;
}

export async function getNextReceiptNumber(): Promise<string> {
  const last = await getLastReceiptNumber();
  return generateReceiptNumber(last);
}

//CREATE RECEIPT (OFFLINE-FIRST)

export async function saveReceipt(draft: ReceiptDraft): Promise<Receipt> {
  // VALIDATION: Get business from cache
  const business = await getBusiness();
  if (!business) {
    throw new Error('Business profile not found. Complete onboarding first.');
  }

  // SETUP: Generate IDs and timestamps
  const now = new Date().toISOString();  // ✅ ISO format (not Date.now())
  const receiptId = crypto.randomUUID();

  // CALCULATIONS: Compute totals
  const { subtotal, taxAmount, grandTotal } = calculateReceiptTotals(
    draft.items,
    draft.taxEnabled,
    draft.taxRate,
    draft.discount
  );

  // BUILD: Create receipt object
  const receipt: Receipt = {
    id: receiptId,
    serverId: undefined,  // ✅ Will be set after sync
    businessId: business.id,
    templateId: business.selectedTemplateId,
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
    deletedAt: undefined,
  };

  // SAVE: Transaction ensures all-or-nothing
  try {
    await db.transaction(
      'rw',
      [db.receipts, db.receiptItems, db.outbox],
      async () => {
        // 1. Save receipt
        await db.receipts.add(receipt);

        // 2. Save items
        const items: ReceiptItem[] = draft.items.map((item: DraftItem) => ({
          id: crypto.randomUUID(),
          serverId: undefined,
          receiptId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          syncStatus: 'pending',
        }));
        await db.receiptItems.bulkAdd(items);

        // 3. Queue for sync
        await db.outbox.add({
          entityType: 'receipts', 
          entityId: receiptId,  
          operation: 'create',     
          payload: { receipt, items },
          createdAt: now,
          retryCount: 0,   
        });
      }
    );

    return receipt;

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

export async function getReceiptWithItems(
  receiptId: string
): Promise<{ receipt: Receipt; items: ReceiptItem[] } | null> {
  const receipt = await getReceiptById(receiptId);
  if (!receipt) return null;

  const items = await getReceiptItems(receiptId);
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
    const receipts = await db.receipts
      .filter(r => !r.deletedAt)
      .toArray();

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
