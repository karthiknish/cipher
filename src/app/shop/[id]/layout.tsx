import { Metadata } from "next";

// This provides base metadata for product pages
// Individual product metadata would ideally be generated server-side
// For now, we provide good defaults
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Product Details`,
    description: "Shop premium streetwear at CIPHER. Quality materials, modern design, and free shipping on orders over $100.",
    openGraph: {
      title: "Shop Product | CIPHER",
      description: "Discover premium streetwear designed for the modern urban explorer.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
