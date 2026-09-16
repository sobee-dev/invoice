import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";
import { PWAProvider } from "@/context/PWAContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://billbuzz.ng'),
  title: {
    default: 'Billbuzz | Professional Receipt & Invoice Generator',
    template: '%s | Billbuzz',
  },
  description: 'The offline-first SaaS for managing business receipts and instant invoice generation.',
  openGraph: {
    images: ['/billbuzz-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1b2e5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BillBuzz" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <DashboardProvider>
          <PWAProvider>
            {children}
          </PWAProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}
