import { Metadata } from "next";

// This provides base metadata for blog posts
// Individual post metadata would ideally be generated server-side
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Format slug for display (convert-dashes-to-spaces and capitalize)
  const formattedTitle = slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  return {
    title: formattedTitle,
    description: "Read the latest style guides, trend reports, and fashion insights from CIPHER Journal.",
    openGraph: {
      title: `${formattedTitle} | CIPHER Journal`,
      description: "Explore streetwear trends and fashion insights from CIPHER.",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
