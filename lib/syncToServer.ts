import { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import  api  from '@/lib/axios';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const syncOutbox = useCallback(async () => {
    // Prevent double-syncing or running if offline
    if (isSyncingRef.current || !navigator.onLine) return;

    // 1. Get all pending operations from Dexie
    const operations = await db.outbox.toArray();
    if (operations.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      // We assume the 'payload' column in outbox contains the full receipt + items
      const payloads = operations.map(op => op.payload);

      // 3. Send to Django via your Axios instance
      const response = await api.post("/api/receipts/bulk-sync/", payloads);
      const { syncedIds,errors } = response.data;
      
      if (syncedIds && syncedIds.length > 0) {
        // 3. Update Receipts table: Only for IDs confirmed by server
        await db.receipts.where('id').anyOf(syncedIds).modify({ 
          syncStatus: 'synced',
          updatedAt: new Date().toISOString()
        });

        const outboxIdsToDelete = operations
          .filter(op => syncedIds.includes(op.entityId))
          .map(op => op.id)
          .filter((id): id is number => id !== undefined);

        await db.outbox.bulkDelete(outboxIdsToDelete);

        console.log(`Successfully synced ${syncedIds.length} receipts.`);
      }

      // if (errors && errors.length > 0) {
      //   console.warn(`${errors.length} receipts failed to sync:`, errors);
        
      //   for (const err of errors) {
      //     await db.outbox.where('entityId').equals(err.id).modify({
      //       lastError: err.errors || err.error,
      //       retryCount: (prev: number) => (prev || 0) + 1
      //     });
      //   }
      // }
    
    } catch (err: any) {
      console.error("Bulk sync failed Connection or Server error:", err.response?.data || err.message);


      // Increment retry count for future attempts
      const opIds = operations.map(op => op.id).filter((id): id is number => id !== undefined);
      await db.outbox.where('id').anyOf(opIds).modify(op => {
        op.retryCount = (op.retryCount || 0) + 1;
      });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

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