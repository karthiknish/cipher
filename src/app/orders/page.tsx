"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/motion";
import { useOrders, Order } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { Package, CaretRight, SpinnerGap } from "@phosphor-icons/react";

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light tracking-tight"
          >
            MY ORDERS
          </motion.h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 mx-auto mb-6 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-light tracking-tight mb-4">NO ORDERS YET</h2>
            <p className="text-gray-500 mb-8">Start shopping to see your orders here</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
            >
              SHOP NOW
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 p-6"
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 tracking-wider mb-1">ORDER #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs tracking-wider ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status].toUpperCase()}
                    </span>
                    <span className="font-medium">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order.items.slice(0, 3).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-4">
                      <div className="relative w-16 h-20 bg-gray-100 flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                        <p className="text-sm">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-gray-500">+ {order.items.length - 3} more items</p>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 mb-6">
                  <p className="text-xs text-gray-400 tracking-wider mb-2">SHIPPING TO</p>
                  <p className="text-sm">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex-1 flex items-center justify-center gap-2 border border-black py-3 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition"
                  >
                    VIEW DETAILS <CaretRight className="w-4 h-4" />
                  </Link>
                  {order.status === "delivered" && (
                    <button className="flex-1 bg-black text-white py-3 text-sm tracking-wider font-medium hover:bg-gray-900 transition">
                      BUY AGAIN
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
