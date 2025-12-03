import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your CIPHER order. Secure payment processing with fast shipping.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
