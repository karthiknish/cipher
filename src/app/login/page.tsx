import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your CIPHER account to access exclusive features, track orders, and earn rewards.",
  robots: {
    index: false,
    follow: true,
  },
};

export { default } from "./page.client";
