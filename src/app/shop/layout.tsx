import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our collection of premium streetwear. Hoodies, tees, pants, outerwear & accessories with free shipping on orders over $100.",
  openGraph: {
    title: "Shop | CIPHER",
    description: "Browse our collection of premium streetwear. Hoodies, tees, pants, outerwear & accessories.",
    images: ["/og-shop.png"],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
