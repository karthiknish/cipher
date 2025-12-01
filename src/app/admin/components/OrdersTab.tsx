"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag, CaretDown } from "@phosphor-icons/react";
import { Order } from "@/context/OrderContext";
import { STATUS_OPTIONS, STATUS_COLORS } from "./types";

interface OrdersTabProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
}

export function OrdersTab({ orders, onStatusChange }: OrdersTabProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border border-gray-200">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 tracking-wider">ORDER #{order.id}</p>
              <p className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p className="text-xs text-gray-500">{order.userEmail}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value as Order["status"])}
                  className={`appearance-none pr-8 pl-3 py-2 text-xs tracking-wider cursor-pointer ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.toUpperCase()}
                    </option>
                  ))}
                </select>
                <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
              </div>
              <span className="font-medium">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                <div className="w-8 h-10 bg-gray-200 relative overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">Size: {item.size} x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
