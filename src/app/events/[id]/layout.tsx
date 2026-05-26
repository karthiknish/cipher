import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event",
  description: "Event details and RSVP for CIPHER experiences.",
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
