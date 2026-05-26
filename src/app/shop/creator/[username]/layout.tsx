import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Shop",
  description: "Shop curated picks from a CIPHER creator.",
};

export default function CreatorShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
