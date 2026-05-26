import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Shop CIPHER bundle deals. Save big on curated streetwear collections and outfit sets.",
  openGraph: {
    title: "Bundles | CIPHER",
    description: "Shop CIPHER bundle deals. Save big on curated streetwear collections.",
    images: ["/og-bundles.png"],
  },
};

export { default } from "./page.client";
