import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SiteChrome } from "@/components/SiteChrome";
import { SkipLink } from "@/components/SkipLink";
import appCss from "@/styles/globals.css?url";

const siteUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_SITE_URL) ||
  "http://localhost:3000";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5",
      },
      {
        title: "CIPHER | Premium Streetwear & Urban Fashion",
      },
      {
        name: "description",
        content:
          "Discover premium streetwear with AI-powered virtual try-on. Shop hoodies, tees, outerwear & accessories. Free shipping on orders over $100.",
      },
      { name: "keywords", content: "streetwear, urban fashion, hoodies, tees, outerwear, virtual try-on, premium clothing, street style, fashion, cipher" },
      { name: "author", content: "CIPHER" },
      { name: "creator", content: "CIPHER" },
      { name: "publisher", content: "CIPHER" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#000000", media: "(prefers-color-scheme: dark)" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:siteName", content: "CIPHER" },
      { property: "og:title", content: "CIPHER | Premium Streetwear & Urban Fashion" },
      {
        property: "og:description",
        content:
          "Discover premium streetwear with AI-powered virtual try-on. Shop hoodies, tees, outerwear & accessories.",
      },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "CIPHER - Premium Streetwear" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CIPHER | Premium Streetwear & Urban Fashion" },
      {
        name: "twitter:description",
        content: "Discover premium streetwear with AI-powered virtual try-on.",
      },
      { name: "twitter:image", content: "/og-image.png" },
      { name: "twitter:creator", content: "@cipher" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
        <Providers>
          <SkipLink />
          <Navbar />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
          <SiteChrome />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
