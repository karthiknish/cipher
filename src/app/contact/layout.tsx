import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with CIPHER. We're here to help with orders, styling advice, and any questions about our streetwear.",
  openGraph: {
    title: "Contact Us | CIPHER",
    description: "Get in touch with CIPHER. We're here to help with orders, styling advice, and questions.",
    images: ["/og-contact.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
