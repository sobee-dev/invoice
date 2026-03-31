"use client";

import Link from "next/link";
import { useDashboardData } from "@/context/DashboardContext";
import Loader from "@/components/Loader";
import type { Metadata } from 'next'
import Image from "next/image";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Fast",
    description: "Generate professional receipts and invoices in under 30 seconds. No friction, no fluff.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure & Synced",
    description: "Your receipts are encrypted and synced to the cloud. Access them anywhere, anytime.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Custom Branding",
    description: "Add your logo, brand colors, and digital signature. Look professional from day one.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Tax & Analytics",
    description: "Track revenue, monitor taxes, and get insights on your business performance.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "PDF & Image Export",
    description: "Download receipts as high-quality PDFs or images. Share instantly with clients.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: "Offline First",
    description: "Works without internet. All data syncs automatically when you reconnect.",
  },
];

const steps = [
  { number: "01", title: "Create an account", description: "Sign up free in seconds — no credit card required." },
  { number: "02", title: "Set up your business", description: "Add your logo, business name, and tax details once." },
  { number: "03", title: "Generate receipts", description: "Fill in the details, hit generate, and download instantly." },
];

// SEO

const metadata: Metadata = {
  title: 'Billbuzz | Professional Receipt Generator',
  description: 'Create and manage business receipts effortlessly.',
  keywords: ['receipts', 'invoices', 'business management'],
}

export default function LandingPage() {
  const { user, loading } = useDashboardData();
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const isLoggedIn = !!user && hasToken;

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-lg  flex items-center justify-center">
              <Image
                src="/billbuzz-logo.jpg"
                alt="Billbuzz Logo"
                width={40} 
                height={40} 
                className="rounded-md" 
                priority 
              />
            </div>
            <span className="font-bold text-lg tracking-tight">Billbuzz</span>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-primary/20">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Free to get started — no credit card needed
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Invoicing that works{" "}
            <span className="text-primary relative">
              as hard as you do
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10 Q75 2 150 8 Q225 14 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/40"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The simple, fast, and secure way to create receipts, track payments, and professionalize your business — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 text-base">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/register" className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 text-base">
                  Start for Free →
                </Link>
                <Link href="/login" className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-base">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust line */}
          <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
            Trusted by small businesses and freelancers across Africa
          </p>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "30s", label: "To generate a receipt" },
            { value: "100%", label: "Offline capable" },
            { value: "Free", label: "To get started" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">Everything your business needs</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Built for freelancers, traders, and small businesses who want to look professional without the complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 !text-base !text-left">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed !text-left">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200 dark:bg-slate-700" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-primary text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  {step.number}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to digitalize your invoicing?
            </h2>
            <p className="text-blue-100 mb-8 text-base">
              Join businesses already using Billbuzz to streamline their invoicing.
            </p>
            {isLoggedIn ? (
              <Link href="/dashboard" className="inline-block px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-blue-50 transition-all text-base shadow-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <Link href="/register" className="inline-block px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-blue-50 transition-all text-base shadow-lg">
                Start for Free →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className=" rounded-lg w-12 h-12 bg-primary flex items-center justify-center">
              <Image
                src="/billbuzz-logo.jpg"
                alt="Billbuzz Logo"
                width={40} 
                height={40} 
                className="rounded-md" 
                priority 
              />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Billbuzz</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            
            <a href="mailto:billbuzzltd@gmail.com" className="hover:text-primary transition-colors">Contact</a>
          </div>

          <p className="text-sm text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Billbuzz. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}