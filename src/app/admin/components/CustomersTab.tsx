"use client";
import { motion } from "framer-motion";
import {
  Crown,
  Star,
  Users,
  Lightning,
  Warning,
  Archive,
  Envelope,
} from "@phosphor-icons/react";
import { Metrics, CustomerData } from "./types";

interface CustomersTabProps {
  metrics: Metrics;
}

export function CustomersTab({ metrics }: CustomersTabProps) {
  const getSegmentForCustomer = (customer: CustomerData): { segment: string; segmentColor: string } => {
    if (metrics.customerSegments.vip.includes(customer)) {
      return { segment: "VIP", segmentColor: "bg-amber-100 text-amber-700" };
    } else if (metrics.customerSegments.loyal.includes(customer)) {
      return { segment: "Loyal", segmentColor: "bg-purple-100 text-purple-700" };
    } else if (metrics.customerSegments.newCustomers.includes(customer)) {
      return { segment: "New", segmentColor: "bg-green-100 text-green-700" };
    } else if (metrics.customerSegments.atRisk.includes(customer)) {
      return { segment: "At Risk", segmentColor: "bg-orange-100 text-orange-700" };
    } else if (metrics.customerSegments.dormant.includes(customer)) {
      return { segment: "Dormant", segmentColor: "bg-gray-100 text-gray-500" };
    }
    return { segment: "Regular", segmentColor: "bg-gray-100 text-gray-700" };
  };

  return (
    <div className="space-y-8">
      {/* Segment Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: "vip", label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", description: "$500+ spent or 5+ orders" },
          { key: "loyal", label: "Loyal", icon: Star, color: "bg-purple-100 text-purple-700", description: "3+ orders, active" },
          { key: "regular", label: "Regular", icon: Users, color: "bg-blue-100 text-blue-700", description: "2+ orders" },
          { key: "newCustomers", label: "New", icon: Lightning, color: "bg-green-100 text-green-700", description: "First order <30d" },
          { key: "atRisk", label: "At Risk", icon: Warning, color: "bg-orange-100 text-orange-700", description: "30-90d inactive" },
          { key: "dormant", label: "Dormant", icon: Archive, color: "bg-gray-100 text-gray-700", description: "90d+ inactive" },
        ].map(segment => (
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
              {metrics.customerSegments[segment.key as keyof typeof metrics.customerSegments].length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Customer Behavior Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* VIP Customers */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                VIP Customers
              </h3>
              <p className="text-xs text-gray-500 mt-1">Your most valuable customers</p>
            </div>
            <button className="text-xs tracking-wider text-black hover:underline">
              EXPORT
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.customerSegments.vip.length > 0 ? (
              metrics.customerSegments.vip.slice(0, 5).map((customer, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium">{customer.email}</p>
                    <p className="text-xs text-gray-500">
                      {customer.orders} orders · Avg ${customer.avgOrderValue.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-700">${customer.totalSpent.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">Total spent</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No VIP customers yet</p>
            )}
          </div>
        </div>

        {/* At-Risk Customers */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <Warning className="w-5 h-5 text-orange-500" />
                At-Risk Customers
              </h3>
              <p className="text-xs text-gray-500 mt-1">Haven&apos;t ordered in 30-90 days</p>
            </div>
            <button className="bg-orange-500 text-white px-3 py-1.5 text-xs tracking-wider hover:bg-orange-600 transition">
              SEND CAMPAIGN
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.customerSegments.atRisk.length > 0 ? (
              metrics.customerSegments.atRisk.slice(0, 5).map((customer, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100">
                  <div>
                    <p className="text-sm font-medium">{customer.email}</p>
                    <p className="text-xs text-gray-500">
                      Last order: {Math.floor((Date.now() - customer.lastOrder) / (24 * 60 * 60 * 1000))}d ago
                    </p>
                  </div>
                  <button className="p-2 hover:bg-orange-100 transition">
                    <Envelope className="w-4 h-4 text-orange-600" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No at-risk customers</p>
            )}
          </div>
        </div>
      </div>

      {/* All Customers Table */}
      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-medium">All Customers</h3>
          <p className="text-xs text-gray-500 mt-1">{metrics.customerData.length} total customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">EMAIL</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ORDERS</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">TOTAL SPENT</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">AVG ORDER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">LAST ORDER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">SEGMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.customerData.slice(0, 10).map((customer, i) => {
                const { segment, segmentColor } = getSegmentForCustomer(customer);

                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-6 text-sm">{customer.email}</td>
                    <td className="py-3 px-6 text-sm">{customer.orders}</td>
                    <td className="py-3 px-6 text-sm font-medium">${customer.totalSpent.toFixed(0)}</td>
                    <td className="py-3 px-6 text-sm">${customer.avgOrderValue.toFixed(0)}</td>
                    <td className="py-3 px-6 text-sm text-gray-500">
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 text-xs ${segmentColor}`}>{segment}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
