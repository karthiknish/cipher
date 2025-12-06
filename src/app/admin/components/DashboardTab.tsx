"use client";
import { motion } from "@/lib/motion";
import Image from "next/image";
import { 
  ChartBar, 
  ChartPie, 
  Clock, 
  CurrencyDollar, 
  ShoppingBag, 
  TrendUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  CheckCircle,
  XCircle,
  Truck,
} from "@phosphor-icons/react";
import { Order } from "@/context/OrderContext";
import { MiniBarChart, DonutChart } from "./Charts";
import { Metrics, DateRange, STATUS_OPTIONS, STATUS_COLORS, CATEGORIES } from "./types";
import { LiveStatsView } from "./LiveStatsView";

interface DashboardTabProps {
  metrics: Metrics;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

export function DashboardTab({ metrics, dateRange, setDateRange }: DashboardTabProps) {
  return (
    <div className="space-y-8">
      {/* Live Stats - Shopify Style */}
      <LiveStatsView />

      {/* Date Range Filter */}
      <div className="flex justify-end">
        <div className="flex gap-2 bg-gray-100 p-1">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-xs tracking-wider transition ${
                dateRange === range ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              {range === "all" ? "ALL TIME" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center">
              <CurrencyDollar className="w-5 h-5 text-emerald-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium ${metrics.revenueChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {metrics.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(metrics.revenueChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-medium">${metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 tracking-wider mt-1">TOTAL REVENUE</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sky-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-sky-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium ${metrics.ordersChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {metrics.ordersChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(metrics.ordersChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-medium">{metrics.totalOrders}</p>
          <p className="text-xs text-gray-500 tracking-wider mt-1">TOTAL ORDERS</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium ${metrics.customersChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {metrics.customersChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(metrics.customersChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-medium">{metrics.uniqueCustomers}</p>
          <p className="text-xs text-gray-500 tracking-wider mt-1">CUSTOMERS</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
              <TrendUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium ${metrics.avgChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {metrics.avgChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(metrics.avgChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-medium">${metrics.avgOrderValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 tracking-wider mt-1">AVG ORDER VALUE</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Orders (Last 7 Days)</h3>
              <p className="text-xs text-gray-500 mt-1">Daily order volume</p>
            </div>
            <ChartBar className="w-5 h-5 text-gray-400" />
          </div>
          <MiniBarChart data={metrics.ordersByDay} maxValue={Math.max(...metrics.ordersByDay, 1)} />
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <span>6d ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Order Status</h3>
              <p className="text-xs text-gray-500 mt-1">Current distribution</p>
            </div>
            <ChartPie className="w-5 h-5 text-gray-400" />
          </div>
          <DonutChart 
            data={[
              { label: "Pending", value: metrics.ordersByStatus.pending, color: "#fef3c7" },
              { label: "Confirmed", value: metrics.ordersByStatus.confirmed, color: "#e0f2fe" },
              { label: "Processing", value: metrics.ordersByStatus.processing, color: "#ede9fe" },
              { label: "Shipped", value: metrics.ordersByStatus.shipped, color: "#f1f5f9" },
              { label: "Delivered", value: metrics.ordersByStatus.delivered, color: "#d1fae5" },
              { label: "Cancelled", value: metrics.ordersByStatus.cancelled, color: "#ffe4e6" },
            ]}
          />
          <div className="grid grid-cols-3 gap-2 mt-4">
            {STATUS_OPTIONS.map(status => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status].replace("text-", "bg-").split(" ")[0]}`} />
                <span className="capitalize">{status}</span>
                <span className="text-gray-400">({metrics.ordersByStatus[status]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Top Products</h3>
              <p className="text-xs text-gray-500 mt-1">By revenue</p>
            </div>
            <TrendUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {metrics.topProducts.length > 0 ? (
              metrics.topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                    {i + 1}
                  </span>
                  <div className="w-10 h-12 bg-gray-100 relative overflow-hidden flex-shrink-0">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.count} sold</p>
                  </div>
                  <p className="font-medium">${product.revenue.toFixed(0)}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Recent Orders</h3>
              <p className="text-xs text-gray-500 mt-1">Latest activity</p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p className="text-xs text-gray-500">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status]}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium">Sales by Category</h3>
            <p className="text-xs text-gray-500 mt-1">Revenue distribution</p>
          </div>
          <Tag className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(category => {
            const revenue = metrics.salesByCategory[category] || 0;
            const totalCategoryRevenue = Object.values(metrics.salesByCategory).reduce((a, b) => a + b, 0);
            const percentage = totalCategoryRevenue > 0 ? (revenue / totalCategoryRevenue) * 100 : 0;
            return (
              <div key={category} className="text-center p-4 bg-gray-50">
                <p className="text-2xl font-medium">${revenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 tracking-wider mt-1">{category.toUpperCase()}</p>
                <div className="w-full h-1 bg-gray-200 mt-3">
                  <div className="h-full bg-black" style={{ width: `${percentage}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
          <div>
            <p className="text-lg font-medium">{metrics.ordersByStatus.delivered}</p>
            <p className="text-xs text-gray-500">Delivered</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex items-center gap-4">
          <Truck className="w-8 h-8 text-slate-500" />
          <div>
            <p className="text-lg font-medium">{metrics.ordersByStatus.shipped}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex items-center gap-4">
          <Clock className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-lg font-medium">{metrics.ordersByStatus.pending + metrics.ordersByStatus.confirmed}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex items-center gap-4">
          <XCircle className="w-8 h-8 text-rose-500" />
          <div>
            <p className="text-lg font-medium">{metrics.ordersByStatus.cancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
