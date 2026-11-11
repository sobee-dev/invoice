import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import { PWAProvider } from "@/context/PWAContext";


// Body, forms, tables, invoice line items, badges.
const inter = localFont({
  src: "../public/fonts/Inter-Variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

// Headings, the app brand and major buttons. Self-hosted variable font,
// so SemiBold, Bold and ExtraBold all come from the same file.
const jakarta = localFont({
  src: "../public/fonts/PlusJakartaSans-Variable.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});


export const metadata: Metadata = {
  metadataBase: new URL('https://billbuzz.ng'),
  title: {
    default: 'Billbuzz | Professional Business management Suite',
    template: '%s | Billbuzz',
  },
  description: 'The most efficient Software for managing businesses, inventories and track invoices',
  openGraph: {
    images: ['/billbuzz-logo.png'],
  },
};

// display=block keeps icon names from flashing as plain text while the font loads.
const MATERIAL_SYMBOLS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} antialiased`}>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}