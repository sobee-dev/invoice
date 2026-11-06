'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Icon } from './Icon';

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { business } = useBusiness();
  const { count } = useUnreadCount();
  const [query, setQuery] = useState('');
  const [imgError, setImgError] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/docs?search=${encodeURIComponent(query.trim())}`);
  };

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-outline-variant/60 bg-surface px-4">
      <div className="flex items-center gap-4">
        <button onClick={onMenu} aria-label="Toggle sidebar" className="flex h-6 w-6 items-center justify-center text-on-surface">
          <Icon name="menu" size={24} />
        </button>
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-primary">BillBuzz</Link>
      </div>

      <form onSubmit={onSearch} className="flex flex-1 justify-center">
        <label className="flex h-10 w-full max-w-lg items-center gap-1.5 rounded-lg bg-surface-container px-3">
          <Icon name="search" size={24} className="text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search..."
            className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </label>
      </form>

      <div className="flex items-center">
        <Link href="/notifications" aria-label={`Notifications${count ? ` (${count} unread)` : ''}`} className="relative p-2">
          <Icon name="notifications" size={24} className="text-on-surface" />
          {count > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface" />}
        </Link>

        <span className="ml-4 h-8 w-px bg-outline-variant" />

        <details className="relative pl-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="text-right">
              <span className="block text-sm font-semibold leading-tight text-primary">{business?.name || 'Loading...'}</span>
              <span className="block text-[11px] leading-tight text-on-surface-variant">Owner Account</span>
            </span>
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-secondary-container">
              {business?.logoUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <Icon name="person" size={20} className="text-on-surface-variant" />
              )}
            </span>
          </summary>
          <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-lg border border-outline-variant/60 bg-white py-1 shadow-modal">
            <Link href="/settings" className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low">Settings</Link>
            <button onClick={signOut} className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-surface-container-low">Sign out</button>
          </div>
        </details>
      </div>
    </header>
  );
}
