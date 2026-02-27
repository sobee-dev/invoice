import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import  api  from '@/lib/axios';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncOutbox = useCallback(async () => {
    // Prevent double-syncing or running if offline
    if (isSyncing || !navigator.onLine) return;

    // 1. Get all pending operations from Dexie
    const operations = await db.outbox.toArray();
    if (operations.length === 0) return;

    setIsSyncing(true);

    try {
      // 2. Prepare the payload
      // We assume the 'payload' column in outbox contains the full receipt + items
      const payloads = operations.map(op => op.payload);

      // 3. Send to Django via your Axios instance
      const response = await api.post("/api/receipts/bulk-sync/", payloads);
      
      const { createdCount, updatedCount, syncedIds } = response.data;

      if (createdCount > 0 || updatedCount > 0 || syncedIds?.length > 0) {
        // 4. Update local status for the successfully synced receipts
        // syncedIds should be the local UUIDs returned from the server
        const idsToUpdate = syncedIds || operations.map(op => op.entityId);

        await db.receipts.where('id').anyOf(idsToUpdate).modify({ 
          syncStatus: 'synced',
          updatedAt: new Date().toISOString()
        });

        // 5. Clear the outbox for the items we just synced
        const operationIds = operations.map(op => op.id).filter((id): id is number => id !== undefined);
        await db.outbox.bulkDelete(operationIds);
        
        console.log(`Successfully synced ${idsToUpdate.length} receipts.`);
      }
    } catch (err: any) {
      // If unauthorized (401), the axios interceptor usually handles redirect
      // Otherwise, we log the error and wait for the next attempt
      console.error("Bulk sync failed:", err.response?.data || err.message);
      
      // OPTIONAL: Increment retry count for these operations in Dexie
      await db.outbox.where('id').anyOf(operations.map(op => op.id!)).modify(op => {
        op.retryCount = (op.retryCount || 0) + 1;
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    // Run sync when coming back online
    window.addEventListener('online', syncOutbox);
    
    // Initial check: if online, try to sync immediately
    if (navigator.onLine) {
      syncOutbox();
    }

    return () => window.removeEventListener('online', syncOutbox);
  }, [syncOutbox]);

  return { isSyncing, syncOutbox };
}