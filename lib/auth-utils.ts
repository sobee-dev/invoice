import api from "@/lib/axios";
import { db } from "@/lib/db";

export const performLogout = async () => {
  // 1. Attempt Server-Side Logout
  try {
    await api.post("/api/users/logout/");
  } catch (err) {
    console.warn("Backend session already cleared or unreachable.");
  }

  // 2. Attempt Local Data Wipe
  try {
    // Try the "Clean" way first (Clearing tables)
    // This is faster and doesn't require re-opening the DB structure
    await Promise.all([
      db.receipts.clear(),
      db.business.clear(),
      db.users.clear(),
    ]);
  } catch (err) {
    console.error("Scoped clear failed, resorting to Nuclear Wipe:", err);
    
    // 3. Fallback: The Nuclear Option
    // If table clearing fails (rare, but happens if schema is corrupted), 
    // we delete the whole DB.
    try {
      db.close(); 
      await db.delete();
      await db.open();
    } catch (nuclearErr) {
      console.error("Critical: Could not wipe IndexedDB. Manual clear required.");
    }
  } finally {
    // 4. Final Cleanup
    localStorage.clear();
    sessionStorage.clear();
    
    // 5. Redirect to Login
    window.location.href = "/login";
  }
};