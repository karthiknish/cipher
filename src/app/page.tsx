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
  TestimonialsSection,
  EditorialBanner,
  NewsletterSection,
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen">
      <LiveStatsTicker />
      <HeroSection />
      <ServiceBar />
      <StyleAgentSection />
      <SpinToWinBanner />
      <FeaturedShowcase />
      <CollectionsGrid />
      <FeaturesSection />
      <EventsHomeBanner />
      <AITryOnSection />
      <TestimonialsSection />
      <EditorialBanner />
      <NewsletterSection />
    </div>
  );
}
