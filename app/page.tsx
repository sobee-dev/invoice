"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboardingComplete } from "@/lib/repositories/businessRepo";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      if (complete) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }).finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
