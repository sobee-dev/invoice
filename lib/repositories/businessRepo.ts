import { db } from '../db';
import type { Business } from '../types';


export async function getBusiness(): Promise<Business | undefined> {
  return db.business.toCollection().first();
}

/**
 * Save business after onboarding / login fetch
 */
export async function saveBusiness(business: Business): Promise<void> {
  await db.business.clear();       // ensure single business
  await db.business.add(business);
}

/**
 * Clear business on logout
 */
export async function clearBusiness(): Promise<void> {
  await db.business.clear();
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    return await (db.business)
      .filter(b => b.syncStatus !== 'deleted')  // Exclude soft-deleted
      .reverse()  // Newest first
      .sortBy('createdAt');
  } catch (error) {
    console.error('Failed to get businesses:', error);
    return [];  // Return empty array instead of throwing
  }
}


// export async function updateBusiness(
//   businessId: string,
//   updates: Partial<Omit<Business, 'id' | 'serverId' | 'createdAt' | 'syncStatus'>>
// ): Promise<Business> {
//   // Step 1: Get existing business
//   const existing = await getBusiness(businessId);
//   if (!existing) {
//     throw new Error(`Business with ID ${businessId} not found`);
//   }

//   // Step 2: Build updated business
//   const timestamp = now();
//   const updated: Business = {
//     ...existing,
//     ...updates,
//     updatedAt: timestamp,
//     syncStatus: 'pending',  // Mark as needs syncing
//     // Don't overwrite these:
//     id: existing.id,
//     serverId: existing.serverId,  // Preserve Django ID
//     createdAt: existing.createdAt,
//   };

//   try {
//     // Step 3: Save in transaction
//     await db.transaction('rw', [db.business, db.outbox], async () => {
//       await db.business.put(updated);
//       await addToOutbox('business', businessId, 'update', updated);
//     });

//     return updated;
//   } catch (error) {
//     console.error('Failed to update business:', error);
//     throw new Error('Failed to update business locally');
//   }
// }

// export async function deleteBusiness(businessId: string): Promise<void> {
//   const existing = await getBusiness(businessId);
//   if (!existing) {
//     throw new Error(`Business with ID ${businessId} not found`);
//   }

//   try {
//     await db.transaction('rw', [db.business, db.outbox], async () => {
//       // Soft delete: mark as deleted but keep record
//       await db.business.update(businessId, {
//         syncStatus: 'deleted',
//         updatedAt: now(),
//       });

//       // Queue for syncing (will hard delete after sync)
//       await addToOutbox('business', businessId, 'delete', {
//         id: businessId,
//         serverId: existing.serverId,
//       });
//     });
//   } catch (error) {
//     console.error('Failed to delete business:', error);
//     throw new Error('Failed to delete business locally');
//   }
// }



// export async function isOnboardingComplete(
//   businessId?: string
// ): Promise<boolean> {
//   try {
//     const business = await getCurrentBusiness(businessId);
//     return business?.onboardingComplete ?? false;
//   } catch (error) {
//     console.error('Failed to check onboarding:', error);
//     return false;  // Safe default: show onboarding
//   }
// }

// export async function completeOnboarding(businessId: string): Promise<Business> {
//   return updateBusiness(businessId, {
//     onboardingComplete: true,
//   });
// }

// export async function markBusinessSynced(
//   businessId: string,
//   serverId: number
// ): Promise<void> {
//   await db.business.update(businessId, {
//     serverId,
//     syncStatus: 'synced',
//     updatedAt: now(),
//   });
// }

// export async function markBusinessSyncFailed(
//   businessId: string,
//   error: string
// ): Promise<void> {
//   await db.business.update(businessId, {
//     syncStatus: 'error',
//     // Could store error message in a separate field if needed
//   });
// }







// export async function updateBusiness(businessId: string,
//   updates: Partial<Omit<Business, 'id' | 'createdAt'>>
// ): Promise<Business | null> {
//   const existing = await getBusiness(businessId);
//   if (!existing) return null;

//   const now = Date.now();
//   const updated: Business = {
//     ...existing,
//     ...updates,
//     updatedAt: now,
//   };

//   await db.business.put(updated);

//   // Add to outbox for sync
//   await db.outbox.add({
//     id: crypto.randomUUID(),
//     table: 'business',
//     operation: 'upsert',
//     recordId: updated.id,
//     payload: updated,
//     createdAt: now,
//     attempts: 0,
//   });

//   return updated;
// }

// export async function isOnboardingComplete(businessId? : string): Promise<boolean> {
 
//   const business = await getBusiness(businessId);
//   return business?.onboardingComplete ?? false;
// }
