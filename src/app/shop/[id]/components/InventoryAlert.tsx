"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Warning, Eye } from "@phosphor-icons/react";
import { useInventory } from "@/context/InventoryContext";
import { useLiveActivity } from "@/context/LiveActivityContext";

interface InventoryAlertProps {
  productId: string;
}

export default function InventoryAlert({ productId }: InventoryAlertProps) {
  const { getInventoryAlert } = useInventory();
  const { getViewerCount } = useLiveActivity();
  const [alert, setAlert] = useState<ReturnType<typeof getInventoryAlert>>(null);

  // Update inventory alert periodically
  useEffect(() => {
    setAlert(getInventoryAlert(productId));
    
    const interval = setInterval(() => {
      setAlert(getInventoryAlert(productId));
    }, 5000);

    return () => clearInterval(interval);
  }, [productId, getInventoryAlert]);

  // Get live viewer count
  const viewerCount = getViewerCount(productId);

  if (!alert) return null;

  const isLowStock = alert.stock <= 5;
  const isVeryLowStock = alert.stock <= 2;

  return (
    <div className="space-y-2">
      {/* Stock Alert */}
      {isLowStock && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2 text-sm ${
            isVeryLowStock 
              ? "bg-red-50 text-red-700 border border-red-200" 
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <Warning className="w-4 h-4" />
          <span className="font-medium">
            {isVeryLowStock 
              ? `Only ${alert.stock} left!` 
              : `Low stock - ${alert.stock} remaining`}
          </span>
        </motion.div>
      )}

      {/* Live Viewers Alert - Real-time from Firebase */}
      {viewerCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <Eye className="w-4 h-4" />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {viewerCount} {viewerCount === 1 ? "person is" : "people are"} viewing this right now
          </span>
        </motion.div>
      )}
    </div>
  );
}
