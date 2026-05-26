import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how CIPHER protects your privacy and handles your personal information.",
  robots: {
    index: true,
    follow: true,
  },
};

export { default } from "./page.client";
