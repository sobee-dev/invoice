// app/(dashboard)/layout.tsx
import InstallBanner from "@/components/InstallBanner";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#fbf8fd]">
      {/* Sidebar fixed on the left */}
      <Sidebar />
      <InstallBanner />
      {/* Main content scrollable on the right */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
