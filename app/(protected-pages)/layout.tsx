// app/(dashboard)/layout.tsx
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/Loader";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  return <AuthGuard>
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
           <Loader />
        </div>
      }>
        {children}
      </Suspense>
    </AuthGuard>;
} 