// context/DashboardContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { Business, IUser } from "@/lib/types";
import { db } from "@/lib/db";
import { jwtDecode } from "jwt-decode";

interface DashboardState {
  business: Business | null;
  user: IUser | null;
  loading: boolean;
  initialized: boolean;
}

interface DashboardContextValue extends DashboardState {
  refreshData: () => Promise<void>;
  clearData: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardState>({ business: null, user: null, loading: true ,initialized: false});
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearData = useCallback(() => {
    if (typeof window === "undefined") return;
  // --- IMPORTANT: Clear the timer on logout ---
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

  // Clear storage and state
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.clear();
    setData({ business: null, user: null, loading: false, initialized: true });
  
  // Nuclear redirect
    window.location.replace("/");
  }, []);
  

  const refreshToken = useCallback(async () => {
    try {
      const storedRefresh = localStorage.getItem('refreshToken');
      if (!storedRefresh) throw new Error("No refresh token");

      const res = await api.post("/api/users/token/refresh/", { refresh: storedRefresh });
      
      const newAccess = res.data.access;
      const newRefresh = res.data.refresh; // Some APIs return a new refresh token too

      localStorage.setItem('token', newAccess);
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
      
      // Schedule the next refresh based on the NEW token
      scheduleTokenRefresh(newAccess);
    } catch (err) {
      console.error("Failed to refresh token", err);
      clearData(); // Log user out if refresh fails
    }
  }, [clearData]);

  const scheduleTokenRefresh = useCallback((token: string) => {
    // Clear any existing timer
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Refresh 5 minutes (300 seconds) before the 24-hour mark
    const timeLeft = (decoded.exp || 0) - currentTime - 300; 

    if (timeLeft > 0) {
      refreshTimerRef.current = setTimeout(refreshToken, timeLeft * 1000);
    } else {
      // If less than 5 mins left, refresh immediately
      refreshToken();
    }
  }, [refreshToken]);

  
  const fetchAll = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem('token');

    if (!token) {
    setData({ user: null, business: null, loading: false, initialized: true });
    return;
    }

    setData(prev => ({ ...prev, loading: true }));
    try {

      const decoded = jwtDecode(token);
      if ((decoded.exp || 0) < Date.now() / 1000) {
        await refreshToken(); // Token expired, refresh it first
        return;
      }

      const userRes = await api.get("/api/users/me/");
      const freshUser = userRes.data;
      const freshBusiness = freshUser.business;

      if (freshBusiness) {
      await db.business.clear(); // Keep only one business
      await db.business.add(freshBusiness);
      }

      setData({ 
        user: freshUser, 
        business: freshBusiness, 
        loading: false,
        initialized: true
      });
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setData({ user: null, business: null, loading: false, initialized: true });
      } else {
        setData((prev) => ({ ...prev, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <DashboardContext.Provider value={{ ...data, refreshData: fetchAll,clearData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardData = () =>{
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboardData must be used within a DashboardProvider");
  return context;
};