"use client";
import Loader from "@/components/Loader";
import { useDashboardData } from "@/context/DashboardContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useDashboardData();
 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized ||loading) return;

    const token = localStorage.getItem('token');
    // const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const isLoginPage = pathname === "/login";

    // 1. If NO token and NO user, send to login (unless already there)
    if (!user && !token) {
      if (!isLoginPage) router.replace("/login");
      return;
    }

    // 2. If we have a user, handle Onboarding redirection
    if (user) {
      if (isLoginPage) {
        router.replace("/dashboard");
        return;
      }

      const isDone = user.business?.onboardingComplete;
      const isInsideOnboarding = pathname.startsWith("/onboarding");

      if (!isDone && !isInsideOnboarding) {
        router.replace("/onboarding");
      } else if (isDone && isInsideOnboarding) {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, initialized, pathname, router]);

  // Use a logical priority for rendering
  if (loading) return <Loader />;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // If we have a token but user isn't here yet, we're likely mid-request. Stay on Loader.
  if (!initialized || loading) return <Loader />;

  // If no user and no token, show nothing (useEffect will handle redirect)
  if (!user && !token && pathname !== "/login") return null;

  return <>{children}</>;
}