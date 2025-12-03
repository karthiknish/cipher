import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Find your perfect fit with CIPHER's comprehensive size guide. Measurements for hoodies, tees, pants, and more.",
  openGraph: {
    title: "Size Guide | CIPHER",
    description: "Find your perfect fit with CIPHER's comprehensive size guide.",
    images: ["/og-size-guide.png"],
  },
};

export default function SizeGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
