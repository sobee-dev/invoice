// context/BusinessContext.tsx
"use client";

import { BusinessProfile, businessService } from "@/services/business";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

interface BusinessContextType {
  business: BusinessProfile | null;
  isLoading: boolean;    // first load for the current user only
  isRefreshing: boolean; // background refresh, never unmount pages on this
  loadFailed: boolean;   // true for real failures, false for a plain 404
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({} as BusinessContextType);

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null>(null);

  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Only the newest request is allowed to write state, so a slow response for
  // a previous user can never overwrite the current one.
  const latestRequest = useRef(0);

  // Flip to loading in the same render the user changes, so a guard never
  // sees "user present, business null, not loading" for a frame.
  if (userId !== fetchedForUserId && !isLoading) {
    setIsLoading(true);
  }

  const load = useCallback(async (forUserId: string, background: boolean) => {
    const requestId = ++latestRequest.current;

    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setBusiness(null);
    }

    try {
      const data = await businessService.getMyBusiness();
      if (requestId !== latestRequest.current) return;
      setBusiness(data);
      setLoadFailed(false);
    } catch (e: any) {
      if (requestId !== latestRequest.current) return;
      if (e?.response?.status === 404) {
        // No business yet. Onboarding is not finished, which is expected.
        setBusiness(null);
        setLoadFailed(false);
      } else {
        // Network down, 401, 403, 500. Keep any business we already have
        // and tell the entry page this was a failure, not an empty account.
        console.error("Failed to load business profile", e);
        setLoadFailed(true);
      }
    } finally {
      if (requestId === latestRequest.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setFetchedForUserId(forUserId);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId, false);
    } else {
      // Logged out or session not restored yet. Clear everything so one
      // user's business cannot leak into the next session.
      latestRequest.current++;
      setBusiness(null);
      setLoadFailed(false);
      setIsLoading(false);
      setIsRefreshing(false);
      setFetchedForUserId(null);
    }
  }, [userId, load]);

  const refreshBusiness = useCallback(async () => {
    if (userId) await load(userId, true);
  }, [userId, load]);

  return (
    <BusinessContext.Provider
      value={{ business, isLoading, isRefreshing, loadFailed, refreshBusiness }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);