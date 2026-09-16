"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Settings,
  UserCircle,
  LogOut,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/context/DashboardContext";
import LogoutModal from "./LogoutModal";
import SidebarInstallButton from "./SidebarInstallButton";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Receipts", href: "/dashboard/receipts", icon: ReceiptText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { business } = useDashboardData();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white border border-[#c5c6d0] rounded-lg shadow-[0px_2px_4px_rgba(27,46,94,0.05)]"
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} className="text-[#1b1b1f]" /> : <Menu size={20} className="text-[#1b1b1f]" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-[#c5c6d0] bg-white flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Business Name */}
        <div className="p-6 border-b border-[#c5c6d0]">
          <h2 className="text-base font-bold text-[#1b2e5e] truncate tracking-tight">
            {business?.name || "BillBuzz"}
          </h2>
          <p className="text-xs text-[#757680] mt-0.5">Business Account</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-sm font-medium",
                  isActive
                    ? "bg-[#eef0f8] text-[#1b2e5e] font-semibold"
                    : "text-[#45464f] hover:bg-[#f5f3f8] hover:text-[#1b1b1f]"
                )}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-[#1b2e5e]" : "text-[#757680]"}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#c5c6d0] space-y-2">
          <button
            onClick={() => (window.location.href = "/new-receipt")}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg transition-colors text-sm font-semibold shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
          >
            <PlusCircle size={18} />
            <span>New Receipt</span>
          </button>

          <SidebarInstallButton />

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      />

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
