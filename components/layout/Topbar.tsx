// components/layout/Topbar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { Icon } from "@/components/layout/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { ROUTES } from "@/lib/routes";

interface TopbarProps {
  onToggleSidebar: () => void;
  variant?: "owner" | "staff";
}

// True when the app was launched from the home screen rather than a browser tab.
function useIsInstalledApp(): boolean {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
  }, []);

  return installed;
}

export function Topbar({ onToggleSidebar, variant = "owner" }: TopbarProps) {
  const { user } = useAuth();
  const { business } = useBusiness();
  const isStaff = variant === "staff";
  const isInstalledApp = useIsInstalledApp();
  const [refreshing, setRefreshing] = useState(false);

  // Wire this to the notifications service when the web inbox exists.
  const unreadCount = 0;

  const displayName = business?.name || user?.fullName || "Your business";

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[70px] items-center gap-4 border-b border-outline-variant bg-surface px-4 sm:px-6">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={onToggleSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-low"
      >
        <Icon name="menu" size={26} />
      </button>

      <Link
        href={isStaff ? ROUTES.staffHome : ROUTES.ownerHome}
        className="text-2xl font-extrabold tracking-tight text-primary"
      >
        BillBuzz
      </Link>

      {isStaff ? <div className="flex-1" /> : <GlobalSearch />}

      <div className="ml-auto flex items-center gap-4 md:ml-0">
        {isInstalledApp && (
          <button
            type="button"
            aria-label="Refresh the app"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-low disabled:opacity-60"
          >
            <Icon name="refresh" size={26} className={refreshing ? "animate-spin" : ""} />
          </button>
        )}

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-low"
        >
          <Icon name="notifications" size={26} />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-error" />
          )}
        </button>

        <div className="hidden h-8 w-px bg-outline-variant sm:block" />

        <div className="hidden text-right sm:block">
          <p className="max-w-[180px] truncate text-sm font-semibold leading-tight text-primary">{displayName}</p>
          <p className="text-xs text-on-surface-variant">{isStaff ? "Staff Account" : "Owner Account"}</p>
        </div>
        <Avatar name={displayName} imageUrl={business?.logoUrl} size={40} />
      </div>
    </header>
  );
}