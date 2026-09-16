// components/LogoutModal.tsx
import { useDashboardData } from "@/context/DashboardContext";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function LogoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { clearData } = useDashboardData();
  const router = useRouter();

  if (!isOpen) return null;

  const handleFullLogout = async () => {
    try {
      clearData();
      try {
        sessionStorage.clear();
        await db.delete();
      } catch (dbErr) {
        console.warn("DB delete failed", dbErr);
      }
      window.location.replace("/");
    } catch (err) {
      console.error("Logout process encountered an error:", err);
      window.location.href = "/";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl shadow-[0px_8px_16px_rgba(27,46,94,0.12)] border border-[#c5c6d0] max-w-sm w-full mx-4">
        <h2 className="text-lg font-bold text-[#1b1b1f] mb-1">Confirm Logout</h2>
        <p className="text-sm text-[#45464f] mb-6">
          Are you sure you want to log out? Unsynced data may be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#c5c6d0] text-[#1b1b1f] rounded-lg text-sm font-semibold hover:bg-[#f5f3f8] transition-colors"
          >
            Stay
          </button>
          <button
            onClick={handleFullLogout}
            className="flex-1 px-4 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#93000a] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
