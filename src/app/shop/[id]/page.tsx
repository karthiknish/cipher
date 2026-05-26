import { Metadata } from "next";

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

export { default } from "./page.client";
