// components/LogoutModal.tsx
import { useDashboardData } from "@/context/DashboardContext";
import { db } from "@/lib/db"; // Your Dexie instance
import { useRouter } from "next/navigation";

export default function LogoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-2">Confirm Logout</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to log out?
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Stay
          </button>
          <button 
            onClick={handleFullLogout}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}