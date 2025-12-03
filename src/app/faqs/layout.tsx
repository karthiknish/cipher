import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Frequently asked questions about CIPHER. Find answers about shipping, returns, sizing, and more.",
  openGraph: {
    title: "FAQs | CIPHER",
    description: "Frequently asked questions about CIPHER. Shipping, returns, sizing, and more.",
    images: ["/og-faqs.png"],
  },
};

export default function FaqsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
