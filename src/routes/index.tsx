import { createFileRoute } from "@tanstack/react-router";
import {
  LiveStatsTicker,
  HeroSection,
  ServiceBar,
  StyleAgentSection,
  SpinToWinBanner,
  FeaturedShowcase,
  CollectionsGrid,
  FeaturesSection,
  EventsHomeBanner,
  AITryOnSection,
  EditorialBanner,
  NewsletterSection,
} from "@/components/home";
import ForYouSection from "@/components/ForYouSection";

function Home() {
  return (
    <div className="min-h-screen">
      <LiveStatsTicker />
      <HeroSection />
      <ServiceBar />
      <StyleAgentSection />
      <SpinToWinBanner />
      <FeaturedShowcase />
      <ForYouSection />
      <CollectionsGrid />
      <FeaturesSection />
      <EventsHomeBanner />
      <AITryOnSection />
      <EditorialBanner />
      <NewsletterSection />
    </div>
  );
}

export const Route = createFileRoute("/")({ component: Home });
