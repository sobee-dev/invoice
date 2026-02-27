"use client";

import { useDashboardData } from "@/context/DashboardContext";
import { User, Mail, Shield, LogOut, Calendar } from "lucide-react";
import { performLogout } from "@/lib/auth-utils"; // We'll create this utility below

export default function ProfilePage() {
  const { user, loading } = useDashboardData();

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Profile</h1>
        <p className="text-slate-500">Manage your personal information and security.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -top-12 flex items-end gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-lg">
              <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-blue-600">
                <User size={48} />
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.email?.split('@')[0] || "User"}
              </h2>
              <p className="text-sm text-slate-500">Individual Account</p>
            </div>
          </div>

          <div className="grid gap-6 mt-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Mail className="text-slate-400" size={20} />
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-slate-900 dark:text-white font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Shield className="text-slate-400" size={20} />
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Account ID</p>
                <p className="text-slate-900 dark:text-white font-mono text-sm">{user?.id || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
        <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
        <p className="text-red-600 dark:text-red-500/80 text-sm mb-4">
          Logging out will clear your local session and any unsynced data will be lost.
        </p>
        <button 
          onClick={performLogout}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-200 dark:shadow-none"
        >
          <LogOut size={18} />
          Sign Out of Everything
        </button>
      </div>
    </div>
  );
}