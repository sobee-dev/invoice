import router from 'next/router';
import { db } from '../db';
import type { Business } from '../types';
import api from '../axios';


export async function getBusiness() {
  // Pull the first business record from Dexie
  const business = await db.business.toArray();
  return business[0] || null;
  }


/**
 * Save business after onboarding / login fetch
 */
export const saveBusiness = async (businessData: Partial<Business>) => {
  try {
   
    const response = await api.patch("/api/business/me/", businessData);

    return response.data;
  } catch (err) {
    console.error("Failed to sync business details to cloud", err);
    throw err;
  }
};


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

