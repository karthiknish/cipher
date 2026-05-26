import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Challenges",
  description: "Join CIPHER style challenges and showcase your streetwear looks. Compete for prizes and recognition.",
  openGraph: {
    title: "Style Challenges | CIPHER",
    description: "Join CIPHER style challenges and showcase your streetwear looks.",
    images: ["/og-challenges.png"],
  },
};

export { default } from "./page.client";
