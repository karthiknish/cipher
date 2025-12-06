"use client";

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

export default function Home() {
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
