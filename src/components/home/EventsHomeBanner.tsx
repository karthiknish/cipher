"use client";

import { motion, viewportAnimations, createViewportAnimation, withDelay, transitions } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Users, Lightning } from "@phosphor-icons/react";
import { useLocalScene } from "@/context/LocalSceneContext";

export function EventsHomeBanner() {
  const { getFeaturedEvent, getUpcomingEvents } = useLocalScene();
  
  const featuredEvent = getFeaturedEvent();
  const upcomingEvents = getUpcomingEvents().slice(0, 3);
  
  if (!featuredEvent) return null;

  const startDate = new Date(featuredEvent.startDate);
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <section className="py-16 md:py-24 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Featured Event Image */}
          <motion.div
            {...viewportAnimations.fadeLeft}
            className="relative aspect-[4/3] overflow-hidden"
          >
            <Image
              src={featuredEvent.imageUrl}
              alt={featuredEvent.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            
            {/* Date Badge */}
            <div className="absolute top-6 left-6 bg-white text-black px-4 py-2 text-center">
              <p className="text-2xl font-light leading-none">{startDate.getDate()}</p>
              <p className="text-xs tracking-wider uppercase">
                {startDate.toLocaleDateString("en-US", { month: "short" })}
              </p>
            </div>
            
            {/* Countdown */}
            {daysUntil > 0 && daysUntil <= 14 && (
              <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-sm px-4 py-2">
                <p className="text-sm">
                  <span className="font-medium">{daysUntil}</span> days until event
                </p>
              </div>
            )}
          </motion.div>
          
          {/* Content */}
          <motion.div
            {...createViewportAnimation("right", 0.1)}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightning weight="fill" className="w-5 h-5 text-purple-400" />
              <span className="text-sm tracking-[0.3em] text-gray-400">UPCOMING EVENT</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
              {featuredEvent.title}
            </h2>
            
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              {featuredEvent.description.slice(0, 150)}...
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{featuredEvent.location.city}, {featuredEvent.location.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{featuredEvent.rsvpCount}/{featuredEvent.capacity} attending</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/events/${featuredEvent.id}`}
                className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-100 transition"
              >
                VIEW EVENT
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-3 border border-white/30 px-8 py-4 text-sm tracking-wider font-medium hover:bg-white/10 transition"
              >
                ALL EVENTS
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* More Events Preview */}
        {upcomingEvents.length > 1 && (
          <motion.div
            {...createViewportAnimation("up", 0.2)}
            className="mt-16 pt-12 border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm tracking-[0.2em] text-gray-400">MORE UPCOMING</h3>
              <Link href="/events" className="text-sm tracking-wider hover:underline">
                View All →
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6">
              {upcomingEvents.filter(e => e.id !== featuredEvent.id).slice(0, 3).map((event) => {
                const eventDate = new Date(event.startDate);
                return (
                  <Link 
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex gap-4 hover:bg-white/5 p-4 -m-4 transition"
                  >
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <h4 className="font-medium text-sm truncate group-hover:underline">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {event.location.city}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
