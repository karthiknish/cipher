import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Shop CIPHER bundle deals. Save big on curated streetwear collections and outfit sets.",
  openGraph: {
    title: "Bundles | CIPHER",
    description: "Shop CIPHER bundle deals. Save big on curated streetwear collections.",
    images: ["/og-bundles.png"],
  },
};

export default function BundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
