import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved CIPHER items. Keep track of your favorite streetwear pieces.",
  robots: {
    index: false,
    follow: true,
  },
};

export { default } from "./page.client";
