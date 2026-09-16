"use client";
import { usePWA } from "@/context/PWAContext";

export default function SidebarInstallButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWA();

  // Already installed — show nothing
  if (isInstalled) return null;

  // iOS — show static instruction
  if (isIOS) {
    return (
      <div className="mx-3 p-3 rounded-xl bg-[#eef0f8] border border-[#c5c6d0]">
        <p className="text-xs font-bold text-[#1b2e5e] mb-1">📲 Install BillBuzz</p>
        <p className="text-[11px] text-[#45464f] leading-snug">
          Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
        </p>
      </div>
    );
  }

  // Android/Desktop — show install button
  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className="w-full mx-auto flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f3f8] transition text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-[#1b2e5e] flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1b1b1f]">Install App</p>
        <p className="text-[11px] text-[#757680]">Add to home screen</p>
      </div>
    </button>
  );
}