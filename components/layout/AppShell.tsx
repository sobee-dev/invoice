// components/layout/AppShell.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TrialBanner } from "@/components/billing/PlanBanners";
import { Sidebar, SidebarVariant } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ROUTES } from "@/lib/routes";

export function AppShell({ children, variant = "owner" }: { children: React.ReactNode; variant?: SidebarVariant }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);   // desktop: hide the sidebar
  const [mobileOpen, setMobileOpen] = useState(false); // small screens: slide-over

  // Close the slide-over after every navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  // The billing page already shows the trial in its plan card.
  const onBilling = pathname === ROUTES.billing || pathname.startsWith(`${ROUTES.billing}/`);
  const showTrialBanner = variant === "owner" && !onBilling;

  return (
    <div className="min-h-screen bg-surface">
      <Topbar variant={variant} onToggleSidebar={toggleSidebar} />
      <Sidebar
        variant={variant}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-x-0 bottom-0 top-[70px] z-20 bg-black/40 lg:hidden"
        />
      )}

      <main className={`pt-[70px] transition-[padding] duration-200 ${collapsed ? "lg:pl-0" : "lg:pl-64"}`}>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
          {showTrialBanner && <TrialBanner />}
          {children}
        </div>
      </main>
    </div>
  );
}