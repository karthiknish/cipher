"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Share, 
  Heart,
  NavigationArrow,
  Lightning,
  Star,
  Crown,
  Check,
  Warning,
  ShoppingBag
} from "@phosphor-icons/react";
import { useLocalScene, CipherEvent } from "@/context/LocalSceneContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { EventCard } from "@/components/events";

const EVENT_TYPE_CONFIG = {
  popup: { label: "Pop-Up Shop", color: "bg-purple-500", icon: Lightning },
  meetup: { label: "Community Meetup", color: "bg-blue-500", icon: Users },
  launch: { label: "Launch Event", color: "bg-orange-500", icon: Star },
  workshop: { label: "Workshop", color: "bg-green-500", icon: Crown },
};

const TIER_COLORS = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-gradient-to-r from-gray-300 to-gray-500"
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { 
    getEventById, 
    hasUserRSVPd, 
    rsvpToEvent, 
    cancelRSVP, 
    checkEligibility,
    getUpcomingEvents,
    getUserRSVP
  } = useLocalScene();
  const { products } = useProducts();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const event = getEventById(id);
  
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-light mb-4">Event Not Found</h1>
        <Link href="/events" className="text-sm underline">
          Back to Events
        </Link>
      </div>
    );
  }

  const isRSVPd = hasUserRSVPd(event.id);
  const userRSVP = getUserRSVP(event.id);
  const eligibility = checkEligibility(event.id);
  const isFull = event.rsvpCount >= event.capacity;
  const capacityPercent = Math.min(100, (event.rsvpCount / event.capacity) * 100);
  
  const typeConfig = EVENT_TYPE_CONFIG[event.type];
  const TypeIcon = typeConfig.icon;
  
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  // Get related products
  const featuredProducts = products.filter(p => 
    event.featuredProductIds.includes(p.id) || event.exclusiveProductIds.includes(p.id)
  );
  
  // Get related events (same type, excluding current)
  const relatedEvents = getUpcomingEvents()
    .filter(e => e.id !== event.id && e.type === event.type)
    .slice(0, 3);

  const handleRSVP = async () => {
    if (!user) {
      toast.error("Please sign in to RSVP");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    
    if (isRSVPd) {
      const success = await cancelRSVP(event.id);
      if (success) {
        toast.success("RSVP cancelled");
      }
    } else {
      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "Not eligible for this event");
        setIsSubmitting(false);
        return;
      }
      const success = await rsvpToEvent(event.id);
      if (success) {
        toast.success(isFull ? "You've been added to the waitlist!" : "RSVP confirmed! See you there.");
      }
    }
    
    setIsSubmitting(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${event.title} at CIPHER!`;
    
    if (navigator.share) {
      await navigator.share({ title: event.title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const getDirectionsUrl = () => {
    const address = encodeURIComponent(
      `${event.location.address}, ${event.location.city}, ${event.location.state} ${event.location.zip}`
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      weekday: "long",
      month: "long", 
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[60vh]">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <Link 
          href="/events"
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Events</span>
        </Link>
        
        {/* Type Badge */}
        <div className={`absolute top-6 right-6 px-4 py-2 ${typeConfig.color} text-white text-sm tracking-wider font-medium flex items-center gap-2`}>
          <TypeIcon weight="bold" className="w-4 h-4" />
          {typeConfig.label}
        </div>
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            {event.isExclusive && event.requiredTier && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 ${TIER_COLORS[event.requiredTier]} text-white text-xs tracking-wider mb-4`}>
                <Crown weight="fill" className="w-3 h-3" />
                {event.requiredTier.toUpperCase()} MEMBERS ONLY
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-light text-white tracking-tight">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-sm tracking-wider text-gray-500 mb-4">ABOUT THIS EVENT</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Date */}
              <div className="bg-gray-50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar weight="fill" className="w-5 h-5 text-gray-400" />
                  <span className="text-sm tracking-wider text-gray-500">DATE</span>
                </div>
                <p className="font-medium">{formatDate(startDate)}</p>
                {startDate.toDateString() !== endDate.toDateString() && (
                  <p className="text-gray-500 text-sm">to {formatDate(endDate)}</p>
                )}
              </div>
              
              {/* Time */}
              <div className="bg-gray-50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock weight="fill" className="w-5 h-5 text-gray-400" />
                  <span className="text-sm tracking-wider text-gray-500">TIME</span>
                </div>
                <p className="font-medium">{formatTime(startDate)} - {formatTime(endDate)}</p>
                <p className="text-gray-500 text-sm">{event.timezone}</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin weight="fill" className="w-5 h-5 text-gray-400" />
                  <span className="text-sm tracking-wider text-gray-500">LOCATION</span>
                </div>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <NavigationArrow className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
              <h3 className="text-lg font-medium mb-1">{event.location.name}</h3>
              <p className="text-gray-600">{event.location.address}</p>
              <p className="text-gray-600">
                {event.location.city}, {event.location.state} {event.location.zip}
              </p>
            </div>

            {/* Exclusive Products */}
            {featuredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm tracking-wider text-gray-500">
                    {event.exclusiveProductIds.length > 0 ? "EXCLUSIVE PRODUCTS" : "FEATURED PRODUCTS"}
                  </h2>
                  <Link href="/shop" className="text-sm font-medium hover:underline">
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <Link key={product.id} href={`/shop/${product.id}`} className="group">
                      <div className="relative aspect-square bg-gray-100 mb-2 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {event.exclusiveProductIds.includes(product.id) && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs">
                            EXCLUSIVE
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate group-hover:underline">{product.name}</p>
                      <p className="text-sm text-gray-500">${product.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div>
                <h2 className="text-sm tracking-wider text-gray-500 mb-6">MORE {typeConfig.label.toUpperCase()}S</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {relatedEvents.map((relatedEvent) => (
                    <EventCard key={relatedEvent.id} event={relatedEvent} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* RSVP Card */}
              <div className="bg-gray-50 p-6">
                {/* Capacity */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {event.rsvpCount} attending
                    </span>
                    <span className={capacityPercent >= 90 ? "text-red-500 font-medium" : "text-gray-500"}>
                      {isFull ? "Sold out" : `${event.capacity - event.rsvpCount} spots left`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-yellow-500" : "bg-black"
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Eligibility Warning */}
                {!eligibility.eligible && !isRSVPd && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 mb-4">
                    <Warning className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{eligibility.reason}</p>
                  </div>
                )}

                {/* RSVP Status */}
                {isRSVPd && userRSVP && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 mb-4">
                    <Check weight="bold" className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {userRSVP.status === "waitlist" ? "On the Waitlist" : "You're Going!"}
                      </p>
                      {userRSVP.status === "waitlist" && (
                        <p className="text-xs text-green-700">We'll notify you if a spot opens up</p>
                      )}
                    </div>
                  </div>
                )}

                {/* RSVP Button */}
                <button
                  onClick={handleRSVP}
                  disabled={isSubmitting || (!eligibility.eligible && !isRSVPd)}
                  className={`w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
                    isRSVPd
                      ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      : eligibility.eligible
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : isRSVPd ? (
                    "CANCEL RSVP"
                  ) : isFull ? (
                    event.waitlistEnabled ? "JOIN WAITLIST" : "SOLD OUT"
                  ) : (
                    "RSVP NOW"
                  )}
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="w-full mt-3 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  SHARE EVENT
                </button>
              </div>

              {/* Quick Info */}
              <div className="bg-gray-50 p-6 space-y-4">
                <h3 className="text-sm tracking-wider text-gray-500">WHAT TO EXPECT</h3>
                <ul className="space-y-3 text-sm">
                  {event.type === "popup" && (
                    <>
                      <li className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        Exclusive in-person drops
                      </li>
                      <li className="flex items-center gap-3">
                        <Lightning className="w-4 h-4 text-gray-400" />
                        Limited edition items
                      </li>
                    </>
                  )}
                  {event.type === "meetup" && (
                    <>
                      <li className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        Connect with the community
                      </li>
                      <li className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-gray-400" />
                        Exclusive perks for attendees
                      </li>
                    </>
                  )}
                  {event.type === "launch" && (
                    <>
                      <li className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-gray-400" />
                        First access to new collection
                      </li>
                      <li className="flex items-center gap-3">
                        <Lightning className="w-4 h-4 text-gray-400" />
                        Live entertainment
                      </li>
                    </>
                  )}
                  {event.type === "workshop" && (
                    <>
                      <li className="flex items-center gap-3">
                        <Crown className="w-4 h-4 text-gray-400" />
                        Learn from the best
                      </li>
                      <li className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        Take home exclusive merch
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
