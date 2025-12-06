"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  Star, 
  Lightning,
  Crown,
  Check
} from "@phosphor-icons/react";
import { CipherEvent, useLocalScene } from "@/context/LocalSceneContext";
import { useToast } from "@/context/ToastContext";

interface EventCardProps {
  event: CipherEvent;
  variant?: "default" | "compact" | "featured";
}

const EVENT_TYPE_CONFIG = {
  popup: { label: "Pop-Up", color: "bg-purple-500", icon: Lightning },
  meetup: { label: "Meetup", color: "bg-blue-500", icon: Users },
  launch: { label: "Launch", color: "bg-orange-500", icon: Star },
  workshop: { label: "Workshop", color: "bg-green-500", icon: Crown },
};

const TIER_COLORS = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-gradient-to-r from-gray-300 to-gray-500"
};

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const { hasUserRSVPd, rsvpToEvent, cancelRSVP, checkEligibility } = useLocalScene();
  const toast = useToast();

  const isRSVPd = hasUserRSVPd(event.id);
  const eligibility = checkEligibility(event.id);
  const isFull = event.rsvpCount >= event.capacity;
  const capacityPercent = Math.min(100, (event.rsvpCount / event.capacity) * 100);
  
  const typeConfig = EVENT_TYPE_CONFIG[event.type];
  const TypeIcon = typeConfig.icon;
  
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
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

  const handleRSVP = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRSVPd) {
      const success = await cancelRSVP(event.id);
      if (success) {
        toast.success("RSVP cancelled");
      }
    } else {
      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "Not eligible");
        return;
      }
      const success = await rsvpToEvent(event.id);
      if (success) {
        toast.success(isFull ? "Added to waitlist!" : "RSVP confirmed!");
      }
    }
  };

  if (variant === "featured") {
    return (
      <Link href={`/events/${event.id}`}>
        <motion.div 
          className="relative h-[500px] group cursor-pointer overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Type Badge */}
          <div className={`absolute top-6 left-6 px-4 py-2 ${typeConfig.color} text-white text-xs tracking-wider font-medium flex items-center gap-2`}>
            <TypeIcon weight="bold" className="w-4 h-4" />
            {typeConfig.label.toUpperCase()}
          </div>

          {/* Tier Badge */}
          {event.isExclusive && event.requiredTier && (
            <div className={`absolute top-6 right-6 px-4 py-2 ${TIER_COLORS[event.requiredTier]} text-white text-xs tracking-wider font-medium`}>
              {event.requiredTier.toUpperCase()} EXCLUSIVE
            </div>
          )}
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-3 text-white/80 text-sm mb-3">
              <Calendar weight="bold" className="w-4 h-4" />
              <span>{formatDate(startDate)} • {formatTime(startDate)}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-3">
              {event.title}
            </h2>
            
            <div className="flex items-center gap-2 text-white/80 mb-6">
              <MapPin weight="bold" className="w-4 h-4" />
              <span>{event.location.name}, {event.location.city}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Capacity */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/60" />
                  <span className="text-white/80 text-sm">{event.rsvpCount}/{event.capacity}</span>
                </div>
                {/* Capacity Bar */}
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleRSVP}
                disabled={!eligibility.eligible && !isRSVPd}
                className={`px-8 py-3 text-sm tracking-wider font-medium transition ${
                  isRSVPd 
                    ? "bg-white text-black hover:bg-gray-100" 
                    : eligibility.eligible
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                }`}
              >
                {isRSVPd ? (
                  <span className="flex items-center gap-2">
                    <Check weight="bold" className="w-4 h-4" />
                    GOING
                  </span>
                ) : isFull ? "JOIN WAITLIST" : "RSVP NOW"}
              </button>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.id}`}>
        <motion.div 
          className="flex gap-4 p-4 bg-white border border-gray-100 hover:border-black transition group"
          whileHover={{ y: -2 }}
        >
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${typeConfig.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">{formatDate(startDate)}</p>
            <h3 className="font-medium text-sm truncate group-hover:underline">{event.title}</h3>
            <p className="text-xs text-gray-500 truncate">{event.location.city}</p>
          </div>
          
          {isRSVPd && (
            <div className="flex-shrink-0">
              <Check weight="bold" className="w-5 h-5 text-green-600" />
            </div>
          )}
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/events/${event.id}`}>
      <motion.div 
        className="group cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden mb-4">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-white px-3 py-2 text-center">
            <p className="text-2xl font-light leading-none">{startDate.getDate()}</p>
            <p className="text-xs tracking-wider text-gray-500 uppercase">
              {startDate.toLocaleDateString("en-US", { month: "short" })}
            </p>
          </div>
          
          {/* Type Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 ${typeConfig.color} text-white text-xs tracking-wider font-medium flex items-center gap-1.5`}>
            <TypeIcon weight="bold" className="w-3 h-3" />
            {typeConfig.label}
          </div>
          
          {/* Tier Badge */}
          {event.isExclusive && event.requiredTier && (
            <div className={`absolute bottom-4 left-4 px-2 py-1 ${TIER_COLORS[event.requiredTier]} text-white text-xs tracking-wider`}>
              {event.requiredTier.toUpperCase()} ONLY
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium tracking-tight group-hover:underline">
            {event.title}
          </h3>
          
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin weight="bold" className="w-4 h-4" />
            <span>{event.location.name}, {event.location.city}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock weight="bold" className="w-4 h-4" />
            <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
          </div>
          
          {/* Capacity */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">{event.rsvpCount} attending</span>
              <span className={capacityPercent >= 90 ? "text-red-500 font-medium" : "text-gray-500"}>
                {isFull ? "Waitlist available" : `${event.capacity - event.rsvpCount} spots left`}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-yellow-500" : "bg-black"}`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
          
          {/* RSVP Button */}
          <button
            onClick={handleRSVP}
            disabled={!eligibility.eligible && !isRSVPd}
            className={`w-full mt-3 py-3 text-sm tracking-wider font-medium transition ${
              isRSVPd 
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" 
                : eligibility.eligible
                  ? "bg-black text-white hover:bg-gray-900"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isRSVPd ? (
              <span className="flex items-center justify-center gap-2">
                <Check weight="bold" className="w-4 h-4" />
                YOU'RE GOING
              </span>
            ) : !eligibility.eligible ? (
              eligibility.reason
            ) : isFull ? (
              "JOIN WAITLIST"
            ) : (
              "RSVP"
            )}
          </button>
        </div>
      </motion.div>
    </Link>
  );
}
