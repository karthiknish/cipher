"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, fadeIn, fadeInUp, staggerDelay } from "@/lib/motion";
import { 
  Calendar, 
  MapPin, 
  Lightning, 
  Users, 
  Star, 
  Crown,
  FunnelSimple,
  List,
  SquaresFour,
  MapTrifold,
  Storefront
} from "@phosphor-icons/react";
import { useLocalScene, EventType } from "@/context/LocalSceneContext";
import { EventCard } from "@/components/events";
import { StoreLocator } from "@/components/events";
import Link from "next/link";

type FilterType = "all" | EventType | "nearby";
type ViewType = "grid" | "list";

const FILTERS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Events", icon: Calendar },
  { id: "popup", label: "Pop-Ups", icon: Lightning },
  { id: "meetup", label: "Meetups", icon: Users },
  { id: "launch", label: "Launches", icon: Star },
  { id: "workshop", label: "Workshops", icon: Crown },
  { id: "nearby", label: "Near Me", icon: MapPin },
];

export default function EventsPage() {
  const { 
    getUpcomingEvents, 
    getFeaturedEvent, 
    getEventsByType, 
    getNearbyEvents,
    userLocation,
    requestLocationPermission,
    stores
  } = useLocalScene();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [showStores, setShowStores] = useState(false);

  const featuredEvent = getFeaturedEvent();
  
  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") {
      return getUpcomingEvents();
    }
    if (activeFilter === "nearby") {
      return getNearbyEvents(userLocation?.notifyRadius || 50);
    }
    return getEventsByType(activeFilter as EventType);
  }, [activeFilter, getUpcomingEvents, getEventsByType, getNearbyEvents, userLocation]);

  // Remove featured event from the list if it's there
  const eventsWithoutFeatured = filteredEvents.filter(e => e.id !== featuredEvent?.id);

  const handleNearbyFilter = async () => {
    if (!userLocation?.enabled) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }
    setActiveFilter("nearby");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-black text-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-sm tracking-[0.3em] text-gray-400 mb-4">CIPHER LOCAL</p>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
              EVENTS & POP-UPS
            </h1>
            <p className="text-lg text-gray-400 max-w-xl">
              Join exclusive drops, meet the community, and experience CIPHER in person. 
              From intimate VIP events to massive launch parties.
            </p>
          </motion.div>
        </div>
        {/* Decorative corner */}
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-white/5 to-transparent" />
      </section>

      {/* Featured Event */}
      {featuredEvent && activeFilter === "all" && (
        <section className="container mx-auto px-4 -mt-10 relative z-10">
          <EventCard event={featuredEvent} variant="featured" />
        </section>
      )}

      {/* Filters & View Toggle */}
      <section className="sticky top-16 z-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 gap-4 overflow-x-auto">
            {/* Filters */}
            <div className="flex items-center gap-2">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => filter.id === "nearby" ? handleNearbyFilter() : setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm tracking-wider whitespace-nowrap transition ${
                      isActive 
                        ? "bg-black text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon weight={isActive ? "fill" : "regular"} className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
            
            {/* View Toggle & Stores */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStores(!showStores)}
                className={`flex items-center gap-2 px-4 py-2 text-sm tracking-wider transition ${
                  showStores 
                    ? "bg-black text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Storefront className="w-4 h-4" />
                Stores
              </button>
              
              <div className="flex border border-gray-200">
                <button
                  onClick={() => setViewType("grid")}
                  className={`p-2 transition ${viewType === "grid" ? "bg-black text-white" : "hover:bg-gray-100"}`}
                >
                  <SquaresFour className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewType("list")}
                  className={`p-2 transition ${viewType === "list" ? "bg-black text-white" : "hover:bg-gray-100"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {showStores ? (
            <motion.div
              key="stores"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-light tracking-tight">OUR LOCATIONS</h2>
                  <p className="text-gray-500 mt-1">{stores.filter(s => s.isActive).length} stores</p>
                </div>
              </div>
              <StoreLocator mode="display" />
            </motion.div>
          ) : (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Location Enable Banner for Nearby */}
              {activeFilter === "nearby" && !userLocation?.enabled && (
                <div className="bg-gray-50 p-8 text-center mb-8">
                  <MapTrifold className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Enable Location</h3>
                  <p className="text-gray-500 mb-4">
                    Allow location access to discover events and pop-ups near you
                  </p>
                  <button
                    onClick={requestLocationPermission}
                    className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-900 transition"
                  >
                    ENABLE LOCATION
                  </button>
                </div>
              )}

              {/* Events Grid/List */}
              {eventsWithoutFeatured.length > 0 ? (
                <div className={
                  viewType === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                    : "space-y-4"
                }>
                  {eventsWithoutFeatured.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EventCard 
                        event={event} 
                        variant={viewType === "list" ? "compact" : "default"} 
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-light mb-2">No Events Found</h3>
                  <p className="text-gray-500 mb-6">
                    {activeFilter === "nearby" 
                      ? "No events near your location right now"
                      : "Check back soon for upcoming events"
                    }
                  </p>
                  {activeFilter !== "all" && (
                    <button
                      onClick={() => setActiveFilter("all")}
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      View all events
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
            NEVER MISS A DROP
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Be the first to know about pop-ups, exclusive events, and new arrivals in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:border-white outline-none transition"
            />
            <button className="px-8 py-3 bg-white text-black text-sm tracking-wider font-medium hover:bg-gray-100 transition">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
