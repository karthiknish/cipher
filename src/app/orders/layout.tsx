import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track your CIPHER orders and view order history.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
