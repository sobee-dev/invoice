"use client";

import { useDashboardData } from "@/context/DashboardContext";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { performLogout } from "@/lib/auth-utils";

export default function ProfilePage() {
  const { user, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="p-8 text-sm text-[#757680] animate-pulse">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Account Profile</h1>
        <p className="text-sm text-[#45464f] mt-0.5">Manage your personal information and security.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#c5c6d0] shadow-[0px_2px_4px_rgba(27,46,94,0.05)] overflow-hidden">
        {/* Header Banner */}
        <div className="h-28 bg-gradient-to-r from-[#1b2e5e] to-[#011848]" />

        <div className="px-6 pb-6">
          <div className="relative -top-10 flex items-end gap-5">
            <div className="w-20 h-20 rounded-xl bg-white border border-[#c5c6d0] p-1 shadow-[0px_4px_8px_rgba(27,46,94,0.10)]">
              <div className="w-full h-full rounded-lg bg-[#eef0f8] flex items-center justify-center text-[#1b2e5e]">
                <User size={40} />
              </div>
            </div>
            <div className="mb-1">
              <h2 className="text-lg font-bold text-[#1b1b1f] tracking-tight">
                {user?.email?.split('@')[0] || "User"}
              </h2>
              <p className="text-xs text-[#757680]">Individual Account</p>
            </div>
          </div>

          <div className="grid gap-3 -mt-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f3f8] border border-[#e9e7ec]">
              <Mail className="text-[#757680] shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-[#757680] uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-sm text-[#1b1b1f] font-medium mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f3f8] border border-[#e9e7ec]">
              <Shield className="text-[#757680] shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-[#757680] uppercase tracking-wider">
                  Account ID
                </p>
                <p className="text-sm text-[#1b1b1f] font-mono mt-0.5">{user?.id || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#ffdad6] rounded-xl border border-[#f9b4ae] p-5">
        <h3 className="text-[#93000a] font-bold text-sm mb-1">Danger Zone</h3>
        <p className="text-[#ba1a1a] text-xs mb-4 leading-relaxed">
          Logging out will clear your local session. Any unsynced data will be lost.
        </p>
        <button
          onClick={performLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <LogOut size={16} />
          Sign Out of Everything
        </button>
      </div>
    </div>
  );
}
