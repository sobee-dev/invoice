"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight, ArrowUp, Boxes, CheckCircle,LayoutDashboard, Menu, Play, Package, BellRing, Users, Wallet, ClipboardList, FileText,
  Receipt,
  Settings, Star, TriangleAlert,X, Zap,
} from "lucide-react";

import { TRIAL_DAYS } from "@/lib/plan";
import { fmtNgn, INTERVALS, priceFor, PublicInterval, PublicTier } from "@/lib/planPricing";
import { ROUTES } from "@/lib/routes";

// ─── Content (edit here, the UI below stays the same) ────────────────────────
const NAV_LINKS = [
  ["Features", "#features"],
  ["How It Works", "#how-it-works"],
  ["Product", "#showcase"],
  ["Pricing", "#pricing"],
  ["Testimonials", "#testimonials"],
];

const STATS = [
  ["100+", "Invoices Processed", "Smart business owners trust us"],
  ["500+", "Active Freelancers & Teams", "Trust Billbuzz daily"],
  ["< 24 Hrs", "Average Payment Time", "Up from 14 business days"],
  ["35+", "Global Currencies", "Multi-currency support"],
];

const FEATURES = [
  [Package, "Stock that follows every sale", "Every invoice takes its items off your shelf automatically, so the number on your screen is the number that should be in your shop."],
  [BellRing, "Warnings before you run out", "Set a reorder level for each product and get notified when an item runs low or runs out, before a customer finds the shelf empty."],
  [Users, "One place to watch your team", "Add staff with their own sign in, choose what each person can access, and see every document they create without standing over their shoulder."],
  [Wallet, "Know who still owes you", "See every unpaid invoice, every part payment and the balance each customer still has to clear, all in one view."],
  [ClipboardList, "A trail for every stock change", "Each adjustment is logged with a reason, so when your goods and your book disagree you can see exactly when and why the numbers moved."],
  [FileText, "Invoices, proformas and supplier orders", "Create clean documents with your own logo and print them or save them as PDF in a few taps."],
] as const;

const STEPS = [
  ["01", "Set up your business and add your products", "Create your account, add your logo and business details, then list what you sell with its price, how many you have and the level at which you want to be warned."],
  ["02", "Invoice every sale", "Create an invoice for each sale and BillBuzz takes the items off your stock, then keeps track of who has paid and who still owes you."],
  ["03", "Watch your business from anywhere", "Add your staff with their own sign in, then check your stock, your sales and your unpaid balances in one place, and get a warning when something runs low."],
] as const;

const REVIEWS = [
  ["I used to guess what was left on my shelves. Now BillBuzz warns me before anything runs out.", "Chidinma O.", "Shop owner", "CO"],
  ["I cannot be in the shop every day. Now I check what my staff sold from my phone, and it matches my book.", "Tunde", "Provision store owner", "TA"],
  ["I always forgot who still owed me. Now I open BillBuzz and see every unpaid invoice and balance.", "Amina AA", "Freelancer", "AA"],
] as const;

// Prices come from lib/planPricing.ts. The limits below mirror PLAN_LIMITS in billing/plans.py.
const PLANS: {
  tier: PublicTier; name: string; desc: string; cta: string; featured?: boolean; items: string[];
}[] = [
  {
    tier: "business",
    name: "Business",
    desc: "For growing businesses that invoice every week.",
    cta: `Start ${TRIAL_DAYS}-Day Free Trial`,
    featured: true,
    items: [
      "Unlimited invoices",
      "Up to 300 products",
      "2 staff accounts",
      "All invoice templates",
      "No ads, no Billbuzz footer on documents",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    desc: "For larger teams with no ceiling on growth.",
    cta: "Get Started",
    items: [
      "Everything in Business",
      "Unlimited products",
      "Unlimited staff accounts",
      "Multiple branches",
    ],
  },
];

const FOOTER_COLS: [string, string[][]][] = [
  ["Product", [["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Product Tour", "#showcase"]]],
  ["Resources", [["Documentation", "#"], ["API Reference", "#"], ["Blog", "#"], ["Community", "#"]]],
  ["Company", [["About Us", "#"], ["Careers", "#"], ["Privacy Policy", "/privacy-policy"], ["Terms of Service", "#"]]],
];

// ─── Shared pieces ───────────────────────────────────────────────────────────
function SectionHead({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <span className="text-blue-400 font-semibold text-xs tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{tag}</span>
      <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">{title}</h2>
      <p className="text-slate-400 mt-3 text-base">{sub}</p>
    </div>
  );
}

function Logo({ size = 50, text = "text-2xl" }: { size?: number; text?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/logo.png" alt="Billbuzz logo" width={size} height={size} className="rounded-xl " priority />
      <span className={`${text} font-extrabold text-white tracking-tight`}>
        Bill<span className="text-blue-400">buzz</span>
      </span>
    </Link>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 shadow-xl" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {NAV_LINKS.map(([l, h]) => <a key={l} href={h} className="hover:text-blue-400 transition">{l}</a>)}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href={ROUTES.login} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition">Sign In</Link>
            <Link href={ROUTES.register} className="relative group overflow-hidden rounded-xl p-[1px] font-semibold text-sm">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-300 group-hover:scale-105" />
              <span className="relative px-5 py-2.5 rounded-[11px] bg-slate-950 text-white flex items-center gap-2 group-hover:bg-opacity-0 transition">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Menu" className="p-2 text-slate-300 hover:text-white bg-slate-800/50 rounded-lg border border-slate-700/50">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 py-6 px-6 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4 text-base font-medium text-slate-300">
            {NAV_LINKS.map(([l, h]) => <a key={l} href={h} onClick={() => setIsOpen(false)} className="hover:text-blue-400 py-1">{l}</a>)}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <Link href={ROUTES.login} className="w-full py-3 rounded-xl bg-slate-800 text-white font-semibold text-center">Sign In</Link>
              <Link href={ROUTES.register} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold text-center shadow-lg shadow-blue-500/25">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden dark:bg-slate-950">
      {/* <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" /> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
              
              <span>Next-Gen Automated Billing & Invoicing</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black dark:text-white tracking-tight leading-[1.1]">
              Are You <span className=" text-blue-600">100% Sure</span> All your Sales and inventory are accounted for?.
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              BillBuzz stays ahead of your business, records every sales and credits, takes the stock off your shelf and warehouse as it happens, and tells you before an item runs out, so your goods and your book always agree, even on the days you are not in the shop.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link href={ROUTES.register} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 hover:scale-105 transition-all">
                <span>Start {TRIAL_DAYS}-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#showcase" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <Play className="w-4 h-4 text-red-600 fill-red-600" />
                <span>Watch Product Demo</span>
              </a>
            </div>

            <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
              {["No credit card required", "Setup in 2 minutes"].map((t) => (
                <div key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /><span>{t}</span></div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/19] rounded-[48px] bg-slate-900 border-[8px] border-slate-800 shadow-2xl p-4 overflow-hidden ring-1 ring-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400 px-2 pt-1 font-semibold">
                <span>9:41</span>
                <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
                <div className="flex items-center gap-1"><span className="text-[10px]">5G</span><div className="w-4 h-2.5 bg-slate-400 rounded-sm" /></div>
              </div>

              <div className="my-auto space-y-4 py-2">
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-2">Total Collected</span>
                  <div className="text-2xl font-black text-white">$84,920 <span className="text-xs font-normal text-emerald-400">+18%</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Active Invoices</span>
                    <span className="text-lg font-bold text-blue-600">142</span>
                  </div>
                  <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Pending</span>
                    <span className="text-lg font-bold text-amber-400">$12,450</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400"><Zap className="w-4 h-4" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Auto-Reminder Sent</h4>
                      <p className="text-[10px] text-slate-400">Client Acme Corp paid $1,200</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Just now</span>
                </div>
              </div>

              <div className="bg-slate-950/90 py-2.5 px-4 rounded-2xl flex justify-between items-center text-slate-400">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">🏠</div>
               
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <div className="bg-slate-950 border-y border-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map(([v, l, d]) => (
          <div key={l} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-blue-500/50 transition">
            <div className="text-3xl sm:text-4xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600">{v}</div>
            <div className="text-sm font-semibold text-slate-300 mb-1">{l}</div>
            <div className="text-xs text-slate-500">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead tag="Powerful Features" title="Everything You Need to Master Your Invoicing" sub="Replace legacy spreadsheets and clunky software with a streamlined engine built for modern speed." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(([Icon, t, d]) => (
            <div key={t} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-md">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900/50 border-t border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead tag="Simple Workflow" title="How Billbuzz Works in 3 Easy Steps" sub="From zero to fully automated flow in less than the time it takes to drink your morning coffee." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="bg-slate-950 border border-slate-800 rounded-3xl p-8 relative flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-blue-500/30 block mb-4">{n}</span>
                <h3 className="text-xl font-bold text-white mb-3">{t}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{d}</p>
              </div>
              <div className="pt-8 mt-8 border-t border-slate-900 flex items-center gap-2 text-xs font-semibold text-blue-400">
                <span>Learn more about step {n}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  const [tab, setTab] = useState<"invoices" | "analytics">("invoices");
  const tabBtn = (k: "invoices" | "analytics", label: string) => (
    <button onClick={() => setTab(k)} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === k ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>{label}</button>
  );
  const invoices = [
    ["bg-blue-500/20 text-blue-400", "BB-2026-084", "Stripe Inc • Due in 3 days", "$4,850.00", "Pending", "bg-amber-500/20 text-amber-400"],
    ["bg-emerald-500/20 text-emerald-400", "BB-2026-083", "Vercel Labs • Paid cash", "$1,200.00", "Paid", "bg-emerald-500/20 text-emerald-400"],
  ];

  return (
    <section id="showcase" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-400 font-semibold text-xs tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Product Showcase</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">Designed for Absolute Clarity</h2>
          <p className="text-slate-400 mt-3 text-base">Take a peak inside our layered dashboards engineered for high-performance financial management.</p>
          <div className="flex justify-center gap-3 mt-8">{tabBtn("invoices", "Invoicing Hub")}{tabBtn("analytics", "Analytics Suite")}</div>
        </div>

        <div className="relative max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" /><div className="w-3 h-3 rounded-full bg-amber-500" /><div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs text-slate-500 font-mono">billbuzz.ng/dashboard/{tab}</span>
            <div className="w-16" />
          </div>

          {tab === "invoices" ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {invoices.map(([ic, no, sub, amt, st, stc]) => (
                <div key={no} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${ic}`}>INV</div>
                    <div><h4 className="text-sm font-bold text-white">Invoice #{no}</h4><p className="text-xs text-slate-400">{sub}</p></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{amt}</span>
                    <span className={`block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${stc}`}>{st}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-white">Revenue Growth (Q3)</h4>
                  <span className="text-xs text-emerald-400 font-bold">+34.8% vs last month</span>
                </div>
                <div className="h-40 flex items-end gap-3 pt-6">
                  {[40, 65, 45, 80, 70, 95, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-900 rounded-t-lg relative group h-full flex items-end">
                      <div style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-slate-900/50 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead tag="Customer Success" title="Loved by Founders & Freelancers" sub="See how Billbuzz transforms inventory flow for businesses" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map(([q, a, r, av]) => (
            <div key={a} className="bg-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">&ldquo;{q}&rdquo;</p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-slate-900">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">{av}</div>
                <div><h4 className="text-sm font-bold text-white">{a}</h4><p className="text-xs text-slate-500">{r}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [interval, setInterval] = useState<PublicInterval>("monthly");

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-400 font-semibold text-xs tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">Simple Plans That Scale With You</h2>
          <p className="text-slate-400 mt-3 text-base">No hidden fees or surprise transaction cuts. Every account starts with a {TRIAL_DAYS}-day free trial of Business.</p>

          <div className="inline-flex mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-1" role="group" aria-label="Billing period">
            {INTERVALS.map((i) => (
              <button
                key={i.key}
                type="button"
                aria-pressed={interval === i.key}
                onClick={() => setInterval(i.key)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold transition ${
                  interval === i.key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:text-white"
                }`}
              >
                {i.label}
                {i.discount > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${interval === i.key ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-400"}`}>
                    Save {i.discount}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((p) => {
            const price = priceFor(p.tier, interval);
            return (
              <div key={p.name} className={`rounded-3xl p-8 flex flex-col justify-between ${p.featured ? "bg-slate-900 border-2 border-blue-500 relative shadow-2xl shadow-blue-600/20" : "bg-slate-900/60 border border-slate-800"}`}>
                {p.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 mb-6">{p.desc}</p>
                  <div className="text-4xl font-black text-white">{fmtNgn(price.perMonth)} <span className="text-xs font-normal text-slate-400">/ month</span></div>
                  <p className="text-xs text-slate-500 mt-2 mb-6 min-h-[2rem]">
                    {price.months > 1 ? `${fmtNgn(price.total)} billed every ${price.months} months` : `${fmtNgn(price.total)} billed monthly`}
                    {price.saving > 0 ? `, you save ${fmtNgn(price.saving)}` : ""}
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300 mb-8">
                    {p.items.map((i) => <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0 text-blue-400" /> {i}</li>)}
                  </ul>
                </div>
                <Link href={ROUTES.register} className={`w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition ${p.featured ? "bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 shadow-lg shadow-blue-500/25" : "bg-slate-800 hover:bg-slate-700"}`}>
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-10 max-w-2xl mx-auto leading-relaxed">
          When the trial ends without a plan, your account moves to Free, with 5 invoices a month, 10 products and the Classic template.
          Need help choosing?{" "}
          <a href="mailto:billbuzzltd@gmail.com" className="text-blue-400 hover:text-blue-300 underline">Email us</a>.
        </p>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/40 to-slate-900 border border-blue-500/30 rounded-[32px] p-8 sm:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Ready to Automate Your Business?</h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 font-normal">Join Scores of successful freelancers and business owner who stay ahead of their business with Billbuzz. Start your {TRIAL_DAYS}-day free trial today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.register} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 hover:scale-105 transition">
              Start Free Trial Now
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-800 transition">Explore All Features</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-16 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2 space-y-4">
            <Logo size={32} text="text-xl" />
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The next-gen automated invoicing, billing and inventory platform designed for high-performing modern freelancers, businesses, and creative agencies.
            </p>
            <div className="text-xs text-slate-600">© {new Date().getFullYear()} Billbuzz Technologies LTD. All rights reserved.</div>
          </div>
          {FOOTER_COLS.map(([h, ls]) => (
            <div key={h} className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{h}</h4>
              <ul className="space-y-2 text-xs">
                {ls.map(([l, href]) => (
                  <li key={l}>{href.startsWith("/") ? <Link href={href} className="hover:text-white transition">{l}</Link> : <a href={href} className="hover:text-white transition">{l}</a>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}


const SIDEBAR = [
  [LayoutDashboard, "Dashboard"],
  [FileText, "Invoices"],
  [Receipt, "Receipts"],
  [Boxes, "Inventory"],
  [Users, "Customers"],
  [Settings, "Settings"],
] as const;

const DASH_ROWS = [
  ["#INV-9021", "Alhaji Bello & Sons", "₦350,000", "Paid", "bg-emerald-500/20 text-emerald-400", "Download"],
  ["#INV-9022", "Grace Fashion World", "₦115,000", "Pending", "bg-amber-500/20 text-amber-400", "Remind"],
  ["#INV-9023", "Dr. Emeka Clinic", "₦89,500", "Paid", "bg-emerald-500/20 text-emerald-400", "Download"],
] as const;

function DashboardPreview() {
  return (
    <section id="dashboard" className="py-24 bg-slate-900/50 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead
          tag="Dashboard Preview"
          title="Built for Speed, Clarity, and Control"
          sub="A centralized workspace designed to handle your invoices, customer contacts, inventory levels, and financial analytics."
        />

        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto text-left">
          {/* Browser bar */}
          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="bg-slate-900 text-slate-400 text-xs px-6 py-1 rounded-md font-mono">billbuzz.ng/dashboard</div>
            <div className="hidden sm:block text-slate-500 text-xs font-medium">Billbuzz Pro</div>
            <div className="w-10 sm:hidden" />
          </div>

          {/* Content */}
          <div className="p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="hidden lg:block lg:col-span-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 self-start">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Main Menu</div>
              {SIDEBAR.map(([Icon, label], i) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    i === 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:bg-slate-900 hover:text-white transition"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </div>
              ))}
            </aside>

            <div className="lg:col-span-9 space-y-6 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400">Total Sales</p>
                  <p className="text-xl font-extrabold text-white mt-1">₦1,450,200</p>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1 inline-flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> +18% vs last month
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400">Pending Invoices</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-1">₦240,000</p>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 inline-block">4 unpaid invoices</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400">Active Inventory</p>
                  <p className="text-xl font-extrabold text-blue-400 mt-1">142 Items</p>
                  <span className="text-[10px] font-bold text-rose-400 mt-1 inline-flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" /> 2 items low stock
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-white">Recent Invoices &amp; Sales</h4>
                  <span className="text-xs text-blue-400 font-bold cursor-pointer hover:text-blue-300">Export CSV</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        {["Invoice ID", "Customer", "Amount", "Status"].map((h) => (
                          <th key={h} className="pb-2 pr-4 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {DASH_ROWS.map(([id, cust, amt, st, stc, act]) => (
                        <tr key={id}>
                          <td className="py-3 pr-4 font-bold text-slate-200 whitespace-nowrap">{id}</td>
                          <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{cust}</td>
                          <td className="py-3 pr-4 font-extrabold text-white whitespace-nowrap">{amt}</td>
                          <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${stc}`}>{st}</span></td>
                          <td className="py-3 text-right text-blue-400 font-semibold">{act}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <ProductShowcase />
      <DashboardPreview />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}