import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import ActivityTicker from "@/components/ActivityTicker";
import SpinWheel from "@/components/SpinWheel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cipher.store";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CIPHER | Premium Streetwear & Urban Fashion",
    template: "%s | CIPHER",
  },
  description: "Discover premium streetwear with AI-powered virtual try-on. Shop hoodies, tees, outerwear & accessories. Free shipping on orders over $100.",
  keywords: [
    "streetwear",
    "urban fashion",
    "hoodies",
    "tees",
    "outerwear",
    "virtual try-on",
    "premium clothing",
    "street style",
    "fashion",
    "cipher",
  ],
  authors: [{ name: "CIPHER", url: siteUrl }],
  creator: "CIPHER",
  publisher: "CIPHER",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CIPHER",
    title: "CIPHER | Premium Streetwear & Urban Fashion",
    description: "Discover premium streetwear with AI-powered virtual try-on. Shop hoodies, tees, outerwear & accessories.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CIPHER - Premium Streetwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CIPHER | Premium Streetwear & Urban Fashion",
    description: "Discover premium streetwear with AI-powered virtual try-on.",
    images: ["/og-image.png"],
    creator: "@cipher",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  category: "fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}
      >
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Chatbot />
          <ActivityTicker />
          <SpinWheel />
        </Providers>
      </body>
    </html>
  );
}
