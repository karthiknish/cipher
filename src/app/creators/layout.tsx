import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creators",
  description: "Meet the CIPHER creator community. Discover influencers and style icons who represent our brand.",
  openGraph: {
    title: "Creators | CIPHER",
    description: "Meet the CIPHER creator community and style icons.",
    images: ["/og-creators.png"],
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
