import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";
import { PWAProvider } from "@/context/PWAContext";



export const metadata: Metadata = {
  metadataBase: new URL('https://billbuzz.ng'),
  title: {
    default: 'Billbuzz | Professional Receipt & Invoice Generator',
    template: '%s | Billbuzz' // This makes subpages look like "Pricing | Billbuzz"
  },
  description: 'The offline-first SaaS for managing business receipts and instant invoice generation.',
  openGraph: {
    images: ['/billbuzz-logo.png'], // Your brand's "share" image
  },
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#002395" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BillBuzz" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* <link rel="stylesheet" href="/globals.css" /> */}
        
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardProvider>
          <PWAProvider>
            {children}
          </PWAProvider>
        </DashboardProvider>
        
      </body>
    </html>
  );
}
