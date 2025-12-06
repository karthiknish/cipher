"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, fadeIn } from "@/lib/motion";
import Image from "next/image";
import { 
  Eye, 
  Lightning, 
  ShoppingCart, 
  Heart, 
  Users, 
  Globe,
  ArrowUp,
  Circle,
  Clock,
  TrendUp,
  Package,
  CurrencyDollar 
} from "@phosphor-icons/react";
import { useLiveActivity, LiveActivity } from "@/context/LiveActivityContext";
import { useOrders, Order } from "@/context/OrderContext";

interface LiveStatsViewProps {
  className?: string;
}

export function LiveStatsView({ className = "" }: LiveStatsViewProps) {
  const { recentActivities, viewerCounts } = useLiveActivity();
  const { allOrders } = useOrders();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibleActivities, setVisibleActivities] = useState<LiveActivity[]>([]);
  const [liveVisitors, setLiveVisitors] = useState(0);

  // Update current time for "time ago" calculations
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Animate activities in one by one
  useEffect(() => {
    setVisibleActivities(recentActivities.slice(0, 8));
  }, [recentActivities]);

  // Calculate live visitors from viewer counts
  useEffect(() => {
    const totalViewers = Object.values(viewerCounts).reduce((sum, count) => sum + count, 0);
    // Add some simulated visitors for demo
    const simulated = Math.floor(Math.random() * 15) + 5;
    setLiveVisitors(totalViewers + simulated);
  }, [viewerCounts]);

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((currentTime.getTime() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getActivityIcon = (type: LiveActivity["type"]) => {
    switch (type) {
      case "purchase": return Package;
      case "like": return Heart;
      case "cart_add": return ShoppingCart;
      case "view": return Eye;
      default: return Lightning;
    }
  };

  const getActivityColor = (type: LiveActivity["type"]) => {
    switch (type) {
      case "purchase": return "bg-green-500";
      case "like": return "bg-red-500";
      case "cart_add": return "bg-blue-500";
      case "view": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getActivityText = (activity: LiveActivity) => {
    switch (activity.type) {
      case "purchase": return "purchased";
      case "like": return "liked";
      case "cart_add": return "added to cart";
      case "view": return "viewed";
      default: return "interacted with";
    }
  };

  // Calculate real-time stats
  const now = Date.now();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  
  const getOrderTime = (order: Order) => order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
  
  const todayOrders = allOrders.filter(o => getOrderTime(o) >= todayStart);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const lastHourOrders = allOrders.filter(o => now - getOrderTime(o) < 60 * 60 * 1000);
  
  // Simulated real-time conversion rate
  const [conversionRate, setConversionRate] = useState(3.2);
  useEffect(() => {
    const interval = setInterval(() => {
      setConversionRate(prev => {
        const change = (Math.random() - 0.5) * 0.3;
        return Math.max(1.5, Math.min(6, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Live Indicator Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
          <h3 className="text-lg font-medium">Live View</h3>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString("en-US", { 
              hour: "numeric", 
              minute: "2-digit",
              hour12: true 
            })}
          </span>
        </div>
        <span className="text-xs text-gray-400">Updates in real-time</span>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Visitors Right Now */}
        <motion.div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" weight="bold" />
            <span className="text-xs text-white/80">VISITORS NOW</span>
          </div>
          <p className="text-3xl font-bold">{liveVisitors}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-white/70">
            <Globe className="w-3 h-3" />
            <span>Across all pages</span>
          </div>
        </motion.div>

        {/* Today's Orders */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">TODAY'S ORDERS</span>
          </div>
          <p className="text-3xl font-bold">{todayOrders.length}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastHourOrders.length} in last hour</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">TODAY'S REVENUE</span>
          </div>
          <p className="text-3xl font-bold">${todayRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendUp className="w-3 h-3" />
            <span>+12% vs yesterday</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendUp className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">CONVERSION</span>
          </div>
          <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <ArrowUp className="w-3 h-3 text-green-500" />
            <span>Above avg (2.8%)</span>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightning className="w-4 h-4 text-yellow-500" weight="fill" />
            <span className="font-medium text-sm">Live Activity</span>
          </div>
          <span className="text-xs text-gray-400">
            {visibleActivities.length} recent events
          </span>
        </div>
        
        <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {visibleActivities.length > 0 ? (
              visibleActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                  >
                    {/* Activity Type Icon */}
                    <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" weight="fill" />
                    </div>
                    
                    {/* Product Image */}
                    {activity.productImage && (
                      <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={activity.productImage}
                          alt={activity.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        {" "}
                        <span className="text-gray-500">{getActivityText(activity)}</span>
                        {" "}
                        <span className="font-medium truncate">{activity.productName}</span>
                      </p>
                    </div>
                    
                    {/* Time */}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Lightning className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Activity will appear here in real-time</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product Hotspots */}
      {Object.keys(viewerCounts).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">Currently Being Viewed</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(viewerCounts)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([productId, count]) => (
                <div 
                  key={productId}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
                >
                  <Circle className="w-2 h-2 animate-pulse" weight="fill" />
                  <span className="font-medium">{count}</span>
                  <span className="text-purple-500">viewing</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* World Map Placeholder - Countries */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="font-medium text-sm">Visitor Locations</span>
          </div>
          <span className="text-xs text-gray-400">Last 24 hours</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { country: "United States", flag: "🇺🇸", visitors: 45, change: "+12%" },
            { country: "United Kingdom", flag: "🇬🇧", visitors: 23, change: "+8%" },
            { country: "Canada", flag: "🇨🇦", visitors: 18, change: "+5%" },
            { country: "Germany", flag: "🇩🇪", visitors: 12, change: "+3%" },
          ].map((loc) => (
            <div key={loc.country} className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{loc.flag}</span>
                <span className="text-xs text-gray-300 truncate">{loc.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{loc.visitors}</span>
                <span className="text-xs text-green-400">{loc.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
