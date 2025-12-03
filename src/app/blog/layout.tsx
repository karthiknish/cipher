import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Explore streetwear trends, style guides, and fashion insights from CIPHER. Stay updated with the latest in urban fashion.",
  openGraph: {
    title: "Blog | CIPHER",
    description: "Explore streetwear trends, style guides, and fashion insights from CIPHER.",
    images: ["/og-blog.png"],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
