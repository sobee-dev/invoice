'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AUTH_SESSION_DEADLINE_KEY,
  clearSession,
  restoreSession,
  setSessionExpiredHandler,
  setThrottledHandler,
  storage,
} from '@/lib/axios';
import {
  authService,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/services/auth';


interface AuthContextType {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  loginWithGoogle: (code: string) => Promise<{ user: AuthUser; isNew: boolean }>;
  /** Finishes a new Google sign-up after the person accepted the terms. */
  completeGoogleSignup: (signupToken: string) => Promise<{ user: AuthUser; isNew: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticating: boolean;
  throttledUntil: number | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [throttledUntil, setThrottledUntil] = useState<number | null>(null);

  // axios has no access to React, so it reports through these two handlers.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    setThrottledHandler((retryAfterSeconds) => {
      setThrottledUntil(Date.now() + retryAfterSeconds * 1000);
    });
    return () => setThrottledHandler(null);
  }, []);

  // Boot. A stored session deadline means this browser has signed in before,
  // so the refresh cookie may still be good. Trade it for an access token and
  // load the user. No deadline means nobody is signed in, so skip the network.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const deadline = await storage.getItem(AUTH_SESSION_DEADLINE_KEY);
        if (deadline && (await restoreSession())) {
          const me = await authService.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        await clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Another tab logging out clears the deadline key, so follow it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || (e.key === AUTH_SESSION_DEADLINE_KEY && !e.newValue)) {
        clearSession();
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Sign out the moment the 14 day session ceiling is reached. The refresh
  // cookie is httpOnly, so the deadline stored at login is the only expiry
  // the browser can see.
  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const expire = async () => {
      await clearSession();
      setUser(null);
    };

    const schedule = async () => {
      if (timer) clearTimeout(timer);
      const raw = await storage.getItem(AUTH_SESSION_DEADLINE_KEY);
      const deadline = Number(raw);
      if (cancelled || !raw || !Number.isFinite(deadline)) return;

      const msLeft = deadline - Date.now();
      if (msLeft <= 0) { await expire(); return; }
      // setTimeout cannot hold more than about 24 days, so re-check if capped.
      timer = setTimeout(schedule, Math.min(msLeft, 2_000_000_000));
    };

    schedule();

    // Timers drift while a tab sleeps, so re-check when it comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  const login = async (payload: LoginPayload) => {
    setIsAuthenticating(true);
    try {
      const res = await authService.login(payload);
      setUser(res.user);
      return res.user;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsAuthenticating(true);
    try {
      const res = await authService.register(payload);
      setUser(res.user);
      return res.user;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginWithGoogle = async (code: string) => {
    setIsAuthenticating(true);
    try {
      const res = await authService.googleLogin(code);
      setUser(res.user);
      return { user: res.user, isNew: res.isNew };
    } finally {
      setIsAuthenticating(false);
    }
  };

    const completeGoogleSignup = async (signupToken: string) => {
    setIsAuthenticating(true);
    try {
      const res = await authService.completeGoogleSignup(signupToken);
      setUser(res.user);
      return { user: res.user, isNew: res.isNew };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try { await authService.logout(); } finally { setUser(null); }
  };

  const refreshUser = async () => setUser(await authService.me());

  return (
    <AuthContext.Provider
        value={{
          user,
          login,
          register,
          loginWithGoogle,
          completeGoogleSignup,
          logout,
          refreshUser,
          isLoading,
          isAuthenticating,
          throttledUntil,
        }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);