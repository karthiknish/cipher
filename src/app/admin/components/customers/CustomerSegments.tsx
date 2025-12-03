"use client";
import { motion } from "framer-motion";
import {
  Crown,
  Star,
  Users,
  Lightning,
  Warning,
  Archive,
} from "@phosphor-icons/react";
import { Metrics } from "../types";

interface CustomerSegmentsProps {
  customerSegments: Metrics["customerSegments"];
}

const segments = [
  { key: "vip", label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", description: "$500+ spent or 5+ orders" },
  { key: "loyal", label: "Loyal", icon: Star, color: "bg-purple-100 text-purple-700", description: "3+ orders, active" },
  { key: "regular", label: "Regular", icon: Users, color: "bg-blue-100 text-blue-700", description: "2+ orders" },
  { key: "newCustomers", label: "New", icon: Lightning, color: "bg-green-100 text-green-700", description: "First order <30d" },
  { key: "atRisk", label: "At Risk", icon: Warning, color: "bg-orange-100 text-orange-700", description: "30-90d inactive" },
  { key: "dormant", label: "Dormant", icon: Archive, color: "bg-gray-100 text-gray-700", description: "90d+ inactive" },
] as const;

export function CustomerSegments({ customerSegments }: CustomerSegmentsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {segments.map(segment => (
        <motion.div
          key={segment.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border border-gray-200 ${segment.color.split(" ")[0]}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <segment.icon className={`w-4 h-4 ${segment.color.split(" ")[1]}`} />
            <span className={`text-xs font-medium ${segment.color.split(" ")[1]}`}>{segment.label}</span>
          </div>
          <p className="text-2xl font-medium">
            {customerSegments[segment.key as keyof typeof customerSegments].length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
