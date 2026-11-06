// lib/axios.ts
import axios, { InternalAxiosRequestConfig } from 'axios';
import {
  errorCodeOf,
  notifyPlanLimit,
  PLAN_LIMIT_CODE,
  planLimitInfoFrom,
  STAFF_OVER_LIMIT_CODE,
  STAFF_OVER_LIMIT_NOTICE,
} from './planLimit';

axios.defaults.headers.common['X-Client'] = 'web';
// ── Storage ─────────────────────────────────────────────────────────────────
// Only non-sensitive values go in localStorage now. The access token stays in
// memory and the refresh token is an httpOnly cookie that JavaScript cannot read.
const isBrowser = typeof window !== 'undefined';

export const storage = {
  async getItem(key: string) {
    if (!isBrowser) return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (!isBrowser) return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (!isBrowser) return;
    window.localStorage.removeItem(key);
  },
};

// ── One-shot notice for the login page ──────────────────────────────────────
// A staff member blocked by the plan is signed out here, and the login page
// reads the reason once with consumeAuthNotice().
const AUTH_NOTICE_KEY = 'auth_notice';

export function setAuthNotice(text: string) {
  if (!isBrowser) return;
  try { window.sessionStorage.setItem(AUTH_NOTICE_KEY, text); } catch { /* storage blocked */ }
}

export function consumeAuthNotice(): string | null {
  if (!isBrowser) return null;
  try {
    const text = window.sessionStorage.getItem(AUTH_NOTICE_KEY);
    if (text) window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
    return text;
  } catch {
    return null;
  }
}

// ── Throttle pub/sub, same pattern as onSessionExpired below ───────────────
type ThrottledHandler = (retryAfterSeconds: number) => void;
let onThrottled: ThrottledHandler | null = null;

export function setThrottledHandler(handler: ThrottledHandler | null) {
  onThrottled = handler;
}

function extractRetryAfterSeconds(error: any): number {
  const fromBody = error.response?.data?.retryAfter;
  if (typeof fromBody === 'number') return fromBody;

  const header = error.response?.headers?.['retry-after'];
  const fromHeader = header ? parseInt(header, 10) : NaN;
  return Number.isFinite(fromHeader) ? fromHeader : 60;
}

// ── API base URL ────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

if (process.env.NODE_ENV === 'development' && isBrowser) {
  console.log('[api] baseURL:', API_BASE_URL);
}

const REFRESH_URL = '/api/users/token/refresh/';
const LOGOUT_URL = '/api/users/logout/';

// withCredentials makes the browser send and accept the httpOnly refresh
// cookie on cross-origin requests to Django.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const AUTH_SESSION_DEADLINE_KEY = 'session_deadline'; // ms epoch, absolute cap
export const AUTH_LAST_EMAIL_KEY = 'last_used_email';        // not sensitive, just prefills the login form

// ── In-memory access token ──────────────────────────────────────────────────
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

// Call this after login and after every refresh. Django sends the refresh
// token as a cookie, so the only things the client keeps are the access token
// (in memory) and the absolute session deadline (ms epoch, from the response
// body as "sessionExpiresAt").
export const saveSession = async (access: string, sessionExpiresAt?: number) => {
  accessToken = access;
  if (typeof sessionExpiresAt === 'number') {
    await storage.setItem(AUTH_SESSION_DEADLINE_KEY, String(sessionExpiresAt));
  }
};

// Local cleanup only. Use logout() below to also remove the cookie.
export const clearSession = async () => {
  accessToken = null;
  await storage.removeItem(AUTH_SESSION_DEADLINE_KEY);
  // AUTH_LAST_EMAIL_KEY deliberately NOT cleared here. Logging out
  // shouldn't make the next person re-type an email that was just there.
};

// The browser will not let JavaScript delete an httpOnly cookie, so Django
// has to do it. Local state is cleared even if the request fails.
export const logout = async () => {
  try {
    await axios.post(`${api.defaults.baseURL}${LOGOUT_URL}`, {}, { withCredentials: true });
  } catch {
    // network failure, still clear local state
  }
  await clearSession();
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

let refreshPromise: Promise<string | null> | null = null;

// A minimal pub/sub so axios (which has no access to React context) can
// tell AuthContext "the session just died" without a circular import.
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  // Proactive check against the absolute session cap before bothering Django.
  const deadline = await storage.getItem(AUTH_SESSION_DEADLINE_KEY);
  if (deadline && Date.now() > Number(deadline)) {
    await clearSession();
    onSessionExpired?.();
    return null;
  }

  try {
    // Bare axios on purpose, so a failed refresh cannot trigger the
    // response interceptor and loop. The cookie travels automatically.
    const { data } = await axios.post(
      `${api.defaults.baseURL}${REFRESH_URL}`,
      {},
      { withCredentials: true },
    );
    await saveSession(data.access, data.sessionExpiresAt);
    return data.access;
  } catch (e) {
    // A staff member over the plan cap is refused on refresh too.
    if (errorCodeOf(e) === STAFF_OVER_LIMIT_CODE) setAuthNotice(STAFF_OVER_LIMIT_NOTICE);
    await clearSession();
    onSessionExpired?.(); // no cookie or refresh rejected, session is dead
    return null;
  }
}

// Shared by the 401 handler and by restoreSession so two callers never fire
// two refreshes at once. This matters because Django rotates the refresh
// token, so a second concurrent refresh would be rejected.
function refreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Call once when the app mounts (for example inside AuthContext). After a
// page reload the in-memory token is gone, so this uses the cookie to get a
// fresh one. Returns true if a session was restored.
export async function restoreSession(): Promise<boolean> {
  if (accessToken) return true;
  const token = await refreshOnce();
  return token !== null;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 429) {
      onThrottled?.(extractRetryAfterSeconds(error));
      return Promise.reject(error);
    }

    // Plan rules, handled once for every screen.
    if (error.response?.status === 403) {
      const code = errorCodeOf(error);
      if (code === PLAN_LIMIT_CODE) {
        notifyPlanLimit(planLimitInfoFrom(error));
      } else if (code === STAFF_OVER_LIMIT_CODE) {
        setAuthNotice(STAFF_OVER_LIMIT_NOTICE);
        await clearSession();
        onSessionExpired?.();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshOnce();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default api;