"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Users, ShoppingBag, TrendUp, Timer } from "@phosphor-icons/react";

const STATS = [
  { icon: Users, text: "127 people shopping right now" },
  { icon: ShoppingBag, text: "43 orders placed in the last hour" },
  { icon: TrendUp, text: "Cipher Hoodie is trending 🔥" },
  { icon: Timer, text: "Free shipping ends in 2h 34m" },
];

export default function LiveStatsTicker() {
  const [currentStat, setCurrentStat] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % STATS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStat}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-2 text-sm"
        >
          {(() => {
            const Icon = STATS[currentStat].icon;
            return <Icon className="w-4 h-4 text-white/60" />;
          })()}
          <span className="text-white/80">{STATS[currentStat].text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
