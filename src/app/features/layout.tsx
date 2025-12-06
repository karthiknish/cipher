import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Features | CIPHER",
    description: "Discover all the features that make CIPHER the smartest way to shop for fashion. AI-powered try-ons, personalized recommendations, style challenges, and more.",
    openGraph: {
        title: "Features | CIPHER",
        description: "Discover all the features that make CIPHER the smartest way to shop for fashion.",
    },
};

export default function FeaturesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
