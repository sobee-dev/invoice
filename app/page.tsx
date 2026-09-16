"use client";

import Link from "next/link";
import { useDashboardData } from "@/context/DashboardContext";
import Loader from "@/components/Loader";
import Image from "next/image";
import { useState } from "react";

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Fast",
    description: "Generate professional receipts and invoices in under 30 seconds. No friction, no fluff.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure & Synced",
    description: "Your receipts are encrypted and synced to the cloud. Access them anywhere, anytime.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Custom Branding",
    description: "Add your logo, brand colors, and digital signature. Look professional from day one.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Tax & Analytics",
    description: "Track revenue, monitor taxes, and get insights on your business performance.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "PDF & Image Export",
    description: "Download receipts as high-quality PDFs or images. Share instantly with clients.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// ─── Store badges ───────────────────────────────────────────────────────────
// Plain, self-drawn buttons rather than the official badge artwork —
// swap the hrefs for your real store listing links once they're live.

function AppStoreButton() {
  return (
    
    <a  href="#"
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg border border-[#c5c6d0] bg-white hover:bg-[#f5f3f8] transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 12.536c-.03-2.89 2.36-4.28 2.47-4.35-1.35-1.97-3.44-2.24-4.19-2.27-1.78-.18-3.48 1.05-4.38 1.05-.9 0-2.29-1.03-3.77-1-1.93.03-3.72 1.13-4.71 2.86-2.01 3.49-.51 8.65 1.44 11.48.96 1.39 2.1 2.95 3.6 2.89 1.44-.06 1.99-.93 3.74-.93 1.74 0 2.24.93 3.77.9 1.56-.03 2.54-1.41 3.49-2.81 1.1-1.6 1.55-3.16 1.57-3.24-.03-.01-3.01-1.15-3.04-4.58z" />
        <path d="M14.9 4.14c.79-.96 1.32-2.28 1.18-3.6-1.14.05-2.53.76-3.35 1.72-.73.85-1.38 2.21-1.21 3.5 1.27.1 2.57-.64 3.38-1.62z" />
      </svg>
      <div className="text-left leading-tight">
        <p className="text-[10px] text-[#757680]">Download on the</p>
        <p className="text-sm font-semibold text-[#1b1b1f]">App Store</p>
      </div>
    </a>
  );
}

function PlayStoreButton() {
  return (
    
    <a  href="#"
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg border border-[#c5c6d0] bg-white hover:bg-[#f5f3f8] transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.6 2.2c-.35.34-.55.86-.55 1.53v16.54c0 .67.2 1.19.55 1.53l.1.08 9.27-9.27v-.22L3.7 2.12l-.1.08z" />
        <path d="M15.9 15.63l-3.03-3.03v-.22l3.04-3.04.07.04 3.58 2.04c1.02.58 1.02 1.53 0 2.11l-3.6 2.06-.06.04z" />
        <path d="M15.97 15.59l-3.1-3.1-9.27 9.27c.34.36.9.4 1.53.05l10.84-6.22" />
        <path d="M15.97 6.4L5.13.18c-.63-.36-1.19-.31-1.53.05l9.27 9.27 3.1-3.1z" />
      </svg>
      <div className="text-left leading-tight">
        <p className="text-[10px] text-[#757680]">Get it on</p>
        <p className="text-sm font-semibold text-[#1b1b1f]">Google Play</p>
      </div>
    </a>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────
// Drop your real dashboard screenshot at /public/app-screenshot.png —
// it fills this frame automatically. Falls back to a plain placeholder
// panel until that file exists.

function PhoneMockup() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative mx-auto w-[260px] h-[540px] rounded-[2.5rem] border-[6px] border-[#1b1b1f] bg-[#1b1b1f] shadow-[0px_20px_50px_rgba(27,46,94,0.25)]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#1b1b1f] rounded-b-xl z-10" />
      <div className="w-full h-full rounded-[2.1rem] overflow-hidden bg-[#f5f3f8] relative">
        {!imgFailed ? (
          <img
            src="/app-screenshot.png"
            alt="BillBuzz dashboard on mobile"
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-xs text-[#757680]">
              Drop app-screenshot.png in /public to preview it here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useDashboardData();
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const isLoggedIn = !!user && hasToken;

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fbf8fd] text-[#1b1b1f]">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#c5c6d0] bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Billbuzz Logo"
                width={36}
                height={36}
                className="rounded-md"
                priority
              />
            </div>
            <span className="font-bold text-[#1b1b1f] tracking-tight">Billbuzz</span>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#45464f] hover:text-[#1b2e5e] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg text-sm font-semibold transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)]"
                >
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
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1b2e5e]/4 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c5c6d0] bg-white text-[#1b2e5e] text-xs font-semibold mb-8 shadow-[0px_2px_4px_rgba(27,46,94,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1b2e5e] animate-pulse" />
            Free to get started — no credit card needed
          </div> */}

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-[#1b1b1f]">
            Invoicing and management that works{" "}
            <span className="text-[#1b2e5e] relative">
              ahead of your business
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path
                  d="M2 10 Q75 2 150 8 Q225 14 298 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-[#fece65]"
                />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#45464f] max-w-2xl mx-auto mb-10 leading-relaxed">
            The simple, fast, and secure way to create receipts, track payments, and professionalize your business — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_4px_8px_rgba(27,46,94,0.20)] text-base"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_4px_8px_rgba(27,46,94,0.20)] text-base"
                >
                  Start for Free →
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border border-[#c5c6d0] bg-white hover:bg-[#f5f3f8] text-[#1b1b1f] rounded-lg font-semibold transition-colors text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <p className="mt-6 text-sm text-[#757680]">
            Trusted by small businesses and freelancers across Africa
          </p>
        </div>
      </section>

      {/* ── Mobile app mockup ─────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest text-[#1b2e5e] font-semibold mb-3">On the go</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1b1b1f] tracking-tight mb-4">
              Take it with you
            </h2>
            <p className="text-[#45464f] text-sm leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
              Manage receipts, staff, and inventory straight from your phone — wherever you're working from.
            </p>
            <div className="flex flex-row gap-3 justify-center md:justify-start">
              <AppStoreButton />
              <PlayStoreButton />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-[#c5c6d0] bg-white">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "30s", label: "To generate a receipt" },
            { value: "100%", label: "Offline capable" },
            { value: "Free", label: "To get started" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold text-[#1b2e5e] tracking-tight">{stat.value}</p>
              <p className="text-sm text-[#757680] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-[#1b2e5e] font-semibold mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1b1b1f] tracking-tight">
              Everything your business needs
            </h2>
            <p className="mt-4 text-[#45464f] max-w-xl mx-auto text-sm leading-relaxed">
              Built for freelancers, traders, and small businesses who want to look professional without the complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-5 rounded-xl border border-[#c5c6d0] bg-white hover:border-[#1b2e5e]/30 hover:shadow-[0px_4px_12px_rgba(27,46,94,0.08)] transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[#eef0f8] text-[#1b2e5e] flex items-center justify-center mb-4 group-hover:bg-[#1b2e5e] group-hover:text-white transition-colors duration-200">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#1b1b1f] mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-[#45464f] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f5f3f8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-[#1b2e5e] font-semibold mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1b1b1f] tracking-tight">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-[#c5c6d0]" />
                )}
                <div className="w-14 h-14 rounded-xl bg-[#1b2e5e] text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-[0px_4px_8px_rgba(27,46,94,0.20)]">
                  {step.number}
                </div>
                <h3 className="font-semibold text-[#1b1b1f] mb-1.5 text-sm">{step.title}</h3>
                <p className="text-xs text-[#45464f]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-[#1b2e5e] rounded-2xl p-12 relative overflow-hidden shadow-[0px_8px_24px_rgba(27,46,94,0.25)]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to digitalize your invoicing?
            </h2>
            <p className="text-[#8597cd] mb-8 text-sm leading-relaxed">
              Join businesses already using Billbuzz to streamline their invoicing.
            </p>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-block px-8 py-4 bg-[#fece65] hover:bg-[#eec058] text-[#755700] rounded-lg font-bold transition-colors text-base shadow-lg"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-block px-8 py-4 bg-[#fece65] hover:bg-[#eec058] text-[#755700] rounded-lg font-bold transition-colors text-base shadow-lg"
              >
                Start for Free →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#c5c6d0] py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Billbuzz Logo"
                width={36}
                height={36}
                className="rounded-md"
                priority
              />
            </div>
            <span className="font-bold text-[#1b1b1f]">Billbuzz</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#757680]">
            <Link href="/privacy-policy" className="hover:text-[#1b2e5e] transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:billbuzzltd@gmail.com" className="hover:text-[#1b2e5e] transition-colors">
              Contact
            </a>
          </div>

          <p className="text-sm text-[#757680]">
            © {new Date().getFullYear()} Billbuzz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}