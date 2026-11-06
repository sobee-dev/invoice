'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notifications';

const POLL_MS = 5 * 60 * 1000;
const BACKOFF_MS = 15 * 60 * 1000;

// Web version of the mobile hook: no push listener, so it refreshes on
// mount, every 5 minutes while the tab is visible, and when the tab regains focus.
export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await notificationService.unreadCount());
    } catch {
      // 429 or transient failure: the next trigger self-corrects
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'owner') { setCount(0); return; }
    let blockedUntil = 0;
    const safeRefresh = async () => {
      if (Date.now() < blockedUntil || document.visibilityState !== 'visible') return;
      try {
        setCount(await notificationService.unreadCount());
      } catch (err: any) {
        if (err?.response?.status === 429) blockedUntil = Date.now() + BACKOFF_MS;
      }
    };
    safeRefresh();
    const timer = setInterval(safeRefresh, POLL_MS);
    document.addEventListener('visibilitychange', safeRefresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', safeRefresh); };
  }, [user]);

  return { count, refresh };
}
