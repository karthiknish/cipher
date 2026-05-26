import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your CIPHER account settings, preferences, and style profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export { default } from "./page.client";
