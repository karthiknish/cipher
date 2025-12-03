import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Manage your CIPHER creator account. Track your commissions, referrals, and performance.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
