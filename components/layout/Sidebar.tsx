// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { SidebarPlanCard } from "@/components/layout/SidebarPlanCard";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { canUseStaff } from "@/lib/plan";
import { ROUTES } from "@/lib/routes";

export type SidebarVariant = "owner" | "staff";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string; // Material Symbols name
}

const MAIN_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: ROUTES.ownerHome, icon: "dashboard" },
  { key: "docs", label: "Docs", href: ROUTES.docs, icon: "description" },
  { key: "products", label: "Products", href: ROUTES.products, icon: "inventory_2" },
  { key: "clients", label: "Clients", href: ROUTES.clients, icon: "group" },
  { key: "team", label: "Team", href: ROUTES.team, icon: "badge" },
];

const SECONDARY_NAV: NavItem[] = [
  { key: "reports", label: "Reports", href: ROUTES.reports, icon: "analytics" },
  { key: "settings", label: "Settings", href: ROUTES.settings, icon: "settings" },
];

const STAFF_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: ROUTES.staffHome, icon: "dashboard" },
  { key: "docs", label: "Docs", href: ROUTES.staffDocs, icon: "description" },
  { key: "profile", label: "Profile", href: ROUTES.staffProfile, icon: "account_circle" },
];

interface SidebarProps {
  variant?: SidebarVariant;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ variant = "owner", collapsed, mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { subscription } = useSubscriptionContext();
  const isStaff = variant === "staff";
  const staffLocked = !isStaff && !canUseStaff(subscription);

  const renderItem = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const locked = item.key === "team" && staffLocked;

    return (
      <li key={item.key}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          title={locked ? "Staff accounts are not on the Free plan" : undefined}
          className={`flex h-12 items-center gap-4 rounded-xl px-4 text-sm font-semibold tracking-wide transition-colors ${
            active
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface hover:bg-surface-container-low"
          } ${locked ? "opacity-60" : ""}`}
        >
          <Icon name={item.icon} size={24} filled={active} />
          {item.label}
          {locked && <Icon name="lock" size={16} className="ml-auto text-on-surface-variant" />}
        </Link>
      </li>
    );
  };

  const slide = mobileOpen ? "translate-x-0" : "-translate-x-full";
  const desktopSlide = collapsed ? "lg:-translate-x-full" : "lg:translate-x-0";

  return (
    <aside
      className={`fixed bottom-0 left-0 top-[70px] z-30 flex w-64 flex-col border-r border-outline-variant bg-surface px-4 py-6 transition-transform duration-200 ${slide} ${desktopSlide}`}
    >
      <nav aria-label="Main">
        {isStaff ? (
          <ul className="space-y-1">{STAFF_NAV.map(renderItem)}</ul>
        ) : (
          <>
            <ul className="space-y-1">{MAIN_NAV.map(renderItem)}</ul>
            <div className="my-4 border-t border-outline-variant" />
            <ul className="space-y-1">{SECONDARY_NAV.map(renderItem)}</ul>
          </>
        )}
      </nav>

      {!isStaff && (
        <div className="mt-auto">
          <SidebarPlanCard onNavigate={onNavigate} />
        </div>
      )}
    </aside>
  );
}