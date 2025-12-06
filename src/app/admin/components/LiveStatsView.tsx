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

  // Calculate live visitors from actual viewer counts (no simulation)
  useEffect(() => {
    const totalViewers = Object.values(viewerCounts).reduce((sum, count) => sum + count, 0);
    setLiveVisitors(totalViewers);
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
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  
  const getOrderTime = (order: Order) => order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
  
  const todayOrders = allOrders.filter(o => getOrderTime(o) >= todayStart);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const lastHourOrders = allOrders.filter(o => now - getOrderTime(o) < 60 * 60 * 1000);
  
  // Calculate yesterday's revenue for comparison
  const yesterdayOrders = allOrders.filter(o => {
    const time = getOrderTime(o);
    return time >= yesterdayStart && time < todayStart;
  });
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : todayRevenue > 0 ? 100 : 0;
  
  // Calculate actual conversion rate based on today's orders vs total activities
  const todayActivities = recentActivities.filter(a => {
    const activityTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    return activityTime >= todayStart;
  });
  
  const conversionRate = todayActivities.length > 0 
    ? (todayOrders.length / Math.max(todayActivities.length, 1)) * 100
    : 0;

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
          <div className={`flex items-center gap-1 mt-1 text-xs ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueChange >= 0 ? <TrendUp className="w-3 h-3" /> : <ArrowUp className="w-3 h-3 rotate-180" />}
            <span>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(0)}% vs yesterday</span>
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
            <span>{todayOrders.length} orders / {todayActivities.length} activities</span>
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

      {/* Visitor Locations - derived from activity data */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="font-medium text-sm">Visitor Locations</span>
          </div>
          <span className="text-xs text-gray-400">From recent activity</span>
        </div>
        {(() => {
          // Extract locations from activity userNames (e.g., "Alex from NYC")
          const locationCounts: Record<string, number> = {};
          recentActivities.forEach(activity => {
            const match = activity.userName.match(/from\s+(\w+)/i);
            if (match) {
              const location = match[1];
              locationCounts[location] = (locationCounts[location] || 0) + 1;
            }
          });
          
          const locationFlags: Record<string, string> = {
            "NYC": "🇺🇸", "LA": "🇺🇸", "London": "🇬🇧", "Tokyo": "🇯🇵",
            "Paris": "🇫🇷", "Berlin": "🇩🇪", "Sydney": "🇦🇺", "Toronto": "🇨🇦"
          };
          
          const sortedLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
          
          if (sortedLocations.length === 0) {
            return (
              <div className="text-center py-4 text-gray-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No location data yet</p>
                <p className="text-xs mt-1">Location data appears as users interact</p>
              </div>
            );
          }
          
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sortedLocations.map(([location, count]) => (
                <div key={location} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{locationFlags[location] || "🌍"}</span>
                    <span className="text-xs text-gray-300 truncate">{location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{count}</span>
                    <span className="text-xs text-gray-400">activities</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
