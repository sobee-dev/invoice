"use client";

import Link from "next/link";
import { useDashboardData } from "@/context/DashboardContext";
import Loader from "@/components/Loader";

export default function LandingPage() {
  const { user, loading } = useDashboardData();

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  const isLoggedIn = !!user && hasToken;

  // If the user is already logged in, show a "Go to Dashboard" button instead of Login/Signup
  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
          Streamline Your <span className="text-primary">Business</span> Invoicing
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
          The simple, fast, and secure way to manage your receipts, track taxes, 
          and professionalize your business identity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Get Started for Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Social Proof / Features Lite */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl text-center">
        <div>
          <div className="text-primary font-bold text-xl mb-2">Fast</div>
          <p className="text-sm text-slate-500">Generate receipts in under 30 seconds.</p>
        </div>
        <div>
          <div className="text-primary font-bold text-xl mb-2">Secure</div>
          <p className="text-sm text-slate-500">Your data is synced safely to the cloud.</p>
        </div>
        <div>
          <div className="text-primary font-bold text-xl mb-2">Pro</div>
          <p className="text-sm text-slate-500">Custom branding and digital signatures.</p>
        </div>
      </div>
    </div>
  );
}