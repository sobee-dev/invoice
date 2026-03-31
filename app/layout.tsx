import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";



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
        {/* <link rel="stylesheet" href="/globals.css" /> */}
        
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardProvider>
          {children}
        </DashboardProvider>
        
      </body>
    </html>
  );
}
