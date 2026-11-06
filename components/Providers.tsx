// components/Providers.tsx
"use client";

import { ThrottleBanner } from "@/components/ThrottleBanner";
import { AuthProvider } from "@/context/AuthContext";
import { BusinessProvider } from "@/context/BusinessContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

// Same nesting as the mobile root layout.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>
        <SubscriptionProvider>
          {children}
          <ThrottleBanner />
        </SubscriptionProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}