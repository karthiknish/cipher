"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin, X, Bell, Calendar } from "@phosphor-icons/react";
import { useLocalScene } from "@/context/LocalSceneContext";

export function NearbyEventsNotification() {
  const { getNearbyEvents, userLocation, requestLocationPermission } = useLocalScene();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [nearbyEvent, setNearbyEvent] = useState<ReturnType<typeof getNearbyEvents>[0] | null>(null);

  useEffect(() => {
    // Check if user has dismissed recently
    const dismissedAt = localStorage.getItem("cipher_nearby_events_dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      // Don't show for 24 hours after dismissal
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Check for nearby events if location is enabled
    if (userLocation?.enabled && userLocation.coordinates) {
      const nearby = getNearbyEvents(userLocation.notifyRadius || 50);
      if (nearby.length > 0) {
        setNearbyEvent(nearby[0]);
        // Delay showing the notification for better UX
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [userLocation, getNearbyEvents]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem("cipher_nearby_events_dismissed", Date.now().toString());
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Show again after 1 hour
    localStorage.setItem("cipher_nearby_events_dismissed", (Date.now() - 23 * 60 * 60 * 1000).toString());
  };

  if (!nearbyEvent || dismissed) return null;

  const eventDate = new Date(nearbyEvent.startDate);
  const isUpcoming = eventDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // Within 7 days

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 100, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md bg-black text-white p-4 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" weight="fill" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 tracking-wider mb-1">
                {isUpcoming ? "HAPPENING SOON NEAR YOU" : "EVENT NEAR YOU"}
              </p>
              <h3 className="font-medium truncate">{nearbyEvent.title}</h3>
              <p className="text-sm text-white/70 truncate">
                {nearbyEvent.location.city} • {eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/events/${nearbyEvent.id}`}
              className="flex-1 py-2.5 bg-white text-black text-sm font-medium text-center hover:bg-gray-100 transition"
              onClick={() => setIsVisible(false)}
            >
              View Event
            </Link>
            <button
              onClick={handleRemindLater}
              className="px-4 py-2.5 border border-white/30 text-white text-sm hover:bg-white/10 transition flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact version for showing in sidebar/header
export function NearbyEventsBadge() {
  const { getNearbyEvents, userLocation } = useLocalScene();
  
  if (!userLocation?.enabled) return null;
  
  const nearbyEvents = getNearbyEvents(userLocation.notifyRadius || 50);
  if (nearbyEvents.length === 0) return null;

  return (
    <Link 
      href="/events"
      className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full hover:bg-purple-200 transition"
    >
      <Calendar className="w-3.5 h-3.5" />
      {nearbyEvents.length} nearby
    </Link>
  );
}
