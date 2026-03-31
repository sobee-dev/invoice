import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Billbuzz",
  description: "How Billbuzz collects, uses, and protects your personal data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you register, we collect your name, email address, and password (stored as an encrypted hash). We never store your plain-text password.",
      },
      {
        subtitle: "Business Information",
        text: "To generate receipts, we store business details you provide: business name, address, logo, tax ID, and currency preferences. This data belongs to you and is used solely to produce your documents.",
      },
      {
        subtitle: "Receipt & Transaction Data",
        text: "All receipts, invoices, and transaction records you create are stored securely and associated with your account. This data is never shared with third parties.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect anonymous usage metrics (pages visited, features used, error logs) to improve the product. This data cannot be used to identify you personally.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      {
        subtitle: "To provide the service",
        text: "Your data is used to generate, store, and sync your receipts and invoices across devices.",
      },
      {
        subtitle: "To communicate with you",
        text: "We may send transactional emails (password resets, account notifications). We do not send marketing emails without your explicit consent.",
      },
      {
        subtitle: "To improve the product",
        text: "Anonymised usage data helps us understand how people use Billbuzz and where we can improve.",
      },
    ],
  },
  {
    title: "3. Data Storage & Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is encrypted in transit using TLS and at rest using AES-256 encryption. Your password is hashed using bcrypt and is never readable by anyone, including our team.",
      },
      {
        subtitle: "Storage location",
        text: "Your data is stored on secure cloud infrastructure. We use industry-standard security practices and regularly audit our systems.",
      },
      {
        subtitle: "Offline data",
        text: "Billbuzz works offline using local storage on your device. This local data is synced to the cloud when you reconnect. You can clear local data at any time from your device settings.",
      },
    ],
  },
  {
    title: "4. Data Sharing",
    content: [
      {
        subtitle: "We do not sell your data",
        text: "Your personal information and business data are never sold to third parties under any circumstances.",
      },
      {
        subtitle: "Service providers",
        text: "We use trusted third-party services (cloud hosting, email delivery) strictly to operate the platform. These providers are contractually bound to protect your data and may not use it for any other purpose.",
      },
      {
        subtitle: "Legal requirements",
        text: "We may disclose information if required by law, court order, or to protect the rights and safety of our users.",
      },
    ],
  },
  {
    title: "5. Your Rights",
    content: [
      {
        subtitle: "Access & export",
        text: "You can access and export all your data at any time from your account settings.",
      },
      {
        subtitle: "Correction",
        text: "You can update your personal and business information at any time from your profile settings.",
      },
      {
        subtitle: "Deletion",
        text: "You can delete your account and all associated data at any time. Deletion is permanent and irreversible. To request account deletion, contact us at support@Billbuzz.app.",
      },
      {
        subtitle: "Data portability",
        text: "You can export your receipt history as PDF or CSV at any time — your data is always yours.",
      },
    ],
  },
  {
    title: "6. Cookies",
    content: [
      {
        subtitle: "Authentication cookies",
        text: "We use a secure, HTTP-only cookie to keep you logged in. This cookie contains no personal information and expires when you log out or after 30 days.",
      },
      {
        subtitle: "No tracking cookies",
        text: "We do not use third-party tracking cookies, advertising cookies, or any cross-site tracking technology.",
      },
    ],
  },
  {
    title: "7. Children's Privacy",
    content: [
      {
        subtitle: "Age requirement",
        text: "Billbuzz is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.",
      },
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      {
        subtitle: "Notification of changes",
        text: "We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or a prominent notice on the platform. The date of the last update is shown at the bottom of this page.",
      },
    ],
  },
  {
    title: "9. Contact Us",
    content: [
      {
        subtitle: "Questions or concerns",
        text: "If you have any questions about this Privacy Policy or how we handle your data, please contact us at support@Billbuzz.app. We aim to respond to all privacy-related inquiries within 48 hours.",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">Billbuzz</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-28 pb-12 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            We take your privacy seriously. This policy explains exactly what data we collect, why we collect it, and how we protect it.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Quick summary */}
        <div className="mb-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <h2 className="font-bold text-primary mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            The short version
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {[
              "We collect only what we need to run the service.",
              "We never sell your data to anyone, ever.",
              "Your receipts and business data belong to you.",
              "You can export or delete your data at any time.",
              "We use industry-standard encryption to protect your information.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Policy sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                {section.title}
              </h2>
              <div className="space-y-5">
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <h3 className="text-sm font-semibold text-primary mb-1.5">{item.subtitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact box */}
        <div className="mt-16 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">Have a privacy concern?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            We&apos;re happy to answer any questions about how we handle your data.
          </p>
          <a
            href="mailto:support@Billbuzz.app"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@Billbuzz.app
          </a>
        </div>

        {/* Back link */}
        <div className="mt-12 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors">
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-8 px-6 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Billbuzz. All rights reserved.
          {" · "}
          <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
        </p>
      </footer>
    </div>
  );
}