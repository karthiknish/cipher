import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote on Designs",
  description: "Vote on upcoming CIPHER designs and help shape the future of streetwear. Your voice matters!",
  openGraph: {
    title: "Vote on Designs | CIPHER",
    description: "Vote on upcoming CIPHER designs and help shape the future of streetwear.",
    images: ["/og-vote.png"],
  },
};

export { default } from "./page.client";
