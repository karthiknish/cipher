import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "RSVP to CIPHER pop-ups, drops, and exclusive streetwear experiences near you.",
  openGraph: {
    title: "Events | CIPHER",
    description: "Discover upcoming CIPHER events and RSVP online.",
  },
};

export { default } from "./page.client";
