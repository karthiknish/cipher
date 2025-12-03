import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your CIPHER shopping cart. Secure checkout with multiple payment options.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
