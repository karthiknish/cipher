import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "CIPHER Admin Dashboard - Manage products, orders, customers, and analytics.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
