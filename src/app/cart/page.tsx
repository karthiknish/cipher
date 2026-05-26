import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your CIPHER shopping cart. Secure checkout with multiple payment options.",
  robots: {
    index: false,
    follow: true,
  },
};

export { default } from "./page.client";
