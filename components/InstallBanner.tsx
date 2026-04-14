"use client";
import { useState } from "react";
import { usePWA } from "@/context/PWAContext";

export default function InstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  // iOS — show manual instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="BillBuzz" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="text-sm font-bold text-gray-900">Install BillBuzz</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tap{" "}
                <span className="inline-flex items-center gap-0.5 font-semibold text-blue-600">
                  Share
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                  </svg>
                </span>{" "}
                then <span className="font-semibold text-blue-600">Add to Home Screen</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* iOS arrow pointing to share button */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
      </div>
    );
  }

  // Android / Desktop Chrome
  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192x192.png" alt="BillBuzz" className="w-10 h-10 rounded-xl" />
          <div>
            <p className="text-sm font-bold text-gray-900">Install BillBuzz</p>
            <p className="text-xs text-gray-500 mt-0.5">Faster access, works offline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            Not now
          </button>
          <button
            onClick={promptInstall}
            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#002395" }}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}