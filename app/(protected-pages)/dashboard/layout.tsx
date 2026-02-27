// app/(dashboard)/layout.tsx
import Sidebar from "@/components/Sidebar";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 
  

  return (
    
      <div className="flex bg-slate-50 dark:bg-slate-950">
        {/* Sidebar is fixed on the left */}
        <Sidebar />
        
        {/* Main Content scrollable on the right */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    
  );
}