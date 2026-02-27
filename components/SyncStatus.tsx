import { useSync } from "@/lib/syncToServer";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function SyncStatusIndicator() {
  const { isSyncing } = useSync();
  
  // Reactively count pending items in the outbox
  const pendingCount = useLiveQuery(() => db.outbox.count());

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-500 text-sm font-medium animate-pulse">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        Syncing...
      </div>
    );
  }

  if (pendingCount && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-amber-500 text-sm font-medium">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        {pendingCount} unsaved changes
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
      All backed up
    </div>
  );
}