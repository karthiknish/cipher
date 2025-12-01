"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLiveActivity, LiveActivity } from "@/context/LiveActivityContext";
import { ShoppingBag, Heart, Eye, ShoppingCart, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const activityIcons = {
  purchase: ShoppingBag,
  like: Heart,
  view: Eye,
  cart_add: ShoppingCart,
};

const activityMessages = {
  purchase: "just purchased",
  like: "just liked",
  view: "is viewing",
  cart_add: "just added to cart",
};

const activityColors = {
  purchase: "bg-green-500",
  like: "bg-pink-500",
  view: "bg-blue-500",
  cart_add: "bg-purple-500",
};

export default function ActivityTicker() {
  const { recentActivities } = useLiveActivity();
  const [currentActivity, setCurrentActivity] = useState<LiveActivity | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);

  // Cycle through activities
  useEffect(() => {
    if (isDismissed || recentActivities.length === 0) return;

    // Show first activity immediately
    if (!currentActivity && recentActivities.length > 0) {
      setCurrentActivity(recentActivities[0]);
      setIsVisible(true);
    }

    // Rotate activities every 5 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setActivityIndex(prev => {
          const nextIndex = (prev + 1) % recentActivities.length;
          setCurrentActivity(recentActivities[nextIndex]);
          return nextIndex;
        });
        setIsVisible(true);
      }, 500); // Wait for exit animation
    }, 5000);

    return () => clearInterval(interval);
  }, [recentActivities, isDismissed, currentActivity]);

  // Reset dismissed state after some time
  useEffect(() => {
    if (isDismissed) {
      const timeout = setTimeout(() => {
        setIsDismissed(false);
      }, 60000); // Re-show after 1 minute
      return () => clearTimeout(timeout);
    }
  }, [isDismissed]);

  if (isDismissed || !currentActivity || recentActivities.length === 0) {
    return null;
  }

  const Icon = activityIcons[currentActivity.type];
  const message = activityMessages[currentActivity.type];
  const colorClass = activityColors[currentActivity.type];

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm"
        >
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              {/* Activity Icon */}
              <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" weight="fill" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{currentActivity.userName}</span>{" "}
                  <span className="text-gray-600">{message}</span>
                </p>
                <Link 
                  href={`/shop/${currentActivity.productId}`}
                  className="text-sm font-medium text-black hover:underline truncate block"
                >
                  {currentActivity.productName}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(currentActivity.timestamp)}</p>
              </div>

              {/* Product Image (if available) */}
              {currentActivity.productImage && (
                <Link 
                  href={`/shop/${currentActivity.productId}`}
                  className="w-12 h-12 relative bg-gray-100 rounded flex-shrink-0 overflow-hidden"
                >
                  <Image
                    src={currentActivity.productImage}
                    alt={currentActivity.productName}
                    fill
                    className="object-cover"
                  />
                </Link>
              )}

              {/* Dismiss Button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Activity Count Indicator */}
            {recentActivities.length > 1 && (
              <div className="flex justify-center gap-1 pb-2">
                {recentActivities.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === activityIndex % Math.min(recentActivities.length, 5) 
                        ? "bg-black" 
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
