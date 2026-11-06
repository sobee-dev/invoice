// app/enter/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { entryRoute } from "@/lib/routes";

export default function EntryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { business, isLoading: businessLoading, loadFailed, refreshBusiness } = useBusiness();

  const waiting = authLoading || (!!user && businessLoading);
  const showRetry = !!user && loadFailed && !waiting;

  useEffect(() => {
    if (waiting || showRetry) return;
    router.replace(entryRoute(user, business));
  }, [waiting, showRetry, user, business, router]);

  if (showRetry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[#45464f]">
          We could not load your business. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => refreshBusiness()}
          className="h-12 px-6 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return <Loader />;
}