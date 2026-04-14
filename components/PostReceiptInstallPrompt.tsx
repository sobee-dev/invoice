"use client";
import { usePWA } from "@/context/PWAContext";

interface Props {
  onDismiss: () => void;
}

export default function PostReceiptInstallPrompt({ onDismiss }: Props) {
  const { canInstall, isIOS, promptInstall } = usePWA();

  if (!canInstall && !isIOS) return null;

  const handleInstall = () => {
    promptInstall();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#002395" }}
          >
            <img src="/icons/icon-192x192.png" alt="BillBuzz" className="w-12 h-12 rounded-xl" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
          You just created your first receipt 🎉
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Install BillBuzz for faster access and offline receipt creation — no browser needed.
        </p>

        {isIOS ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800 text-center leading-relaxed">
              Tap <strong>Share</strong> at the bottom of your browser, then select{" "}
              <strong>Add to Home Screen</strong>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full h-12 rounded-xl text-white font-bold mb-3"
            style={{ backgroundColor: "#002395" }}
          >
            📲 Install BillBuzz
          </button>
        )}

        <button
          onClick={onDismiss}
          className="w-full h-10 text-sm text-gray-400 hover:text-gray-600"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}