import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Track your CIPHER achievements and unlock exclusive rewards. Level up your streetwear journey.",
  openGraph: {
    title: "Achievements | CIPHER",
    description: "Track your CIPHER achievements and unlock exclusive rewards.",
    images: ["/og-achievements.png"],
  },
};

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
