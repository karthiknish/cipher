"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ShoppingCart,
  CurrencyDollar,
  Envelope,
  ArrowsClockwise,
  Target,
  Lightning,
  SpinnerGap,
  PaperPlaneTilt,
  Trash,
} from "@phosphor-icons/react";
import { AbandonedCart } from "@/context/AbandonedCartContext";
import { AbandonedCartMetrics } from "./types";

interface AbandonedTabProps {
  abandonedCarts: AbandonedCart[];
  abandonedCartsLoading: boolean;
  abandonedCartMetrics: AbandonedCartMetrics;
  sendingReminder: string | null;
  sendingBulk: boolean;
  onSendReminder: (cartId: string) => void;
  onBulkReminders: () => void;
  onDeleteCart: (cartId: string) => void;
  onRefreshCarts: () => void;
}

export function AbandonedTab({
  abandonedCarts,
  abandonedCartsLoading,
  abandonedCartMetrics,
  sendingReminder,
  sendingBulk,
  onSendReminder,
  onBulkReminders,
  onDeleteCart,
  onRefreshCarts,
}: AbandonedTabProps) {
  if (abandonedCartsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-6">
          <ShoppingCart className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-medium">{abandonedCartMetrics.total}</p>
          <p className="text-xs text-gray-500 tracking-wider">ABANDONED CARTS</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <CurrencyDollar className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-medium">
            ${abandonedCartMetrics.potentialRevenue.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 tracking-wider">POTENTIAL REVENUE</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <Envelope className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-medium">
            {abandonedCartMetrics.remindersSent}
          </p>
          <p className="text-xs text-gray-500 tracking-wider">REMINDERS SENT</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <ArrowsClockwise className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-medium">
            {abandonedCartMetrics.recovered}
          </p>
          <p className="text-xs text-gray-500 tracking-wider">RECOVERED</p>
        </div>
      </div>

      {/* Recovery Actions */}
      {abandonedCartMetrics.noReminders > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Cart Recovery Campaign</h3>
              <p className="text-sm text-gray-600">
                {abandonedCartMetrics.noReminders} carts haven&apos;t received any reminders yet
              </p>
            </div>
          </div>
          <button 
            onClick={onBulkReminders}
            disabled={sendingBulk}
            className="bg-amber-600 text-white px-6 py-3 text-sm tracking-wider font-medium hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingBulk ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : (
              <PaperPlaneTilt className="w-4 h-4" />
            )}
            {sendingBulk ? "SENDING..." : "SEND REMINDERS"}
          </button>
        </div>
      )}

      {/* Hot Leads Banner */}
      {abandonedCartMetrics.hotLeads > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <Lightning className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            <strong>{abandonedCartMetrics.hotLeads}</strong> hot leads abandoned their cart in the last 24 hours!
          </p>
        </div>
      )}

      {/* Abandoned Carts List */}
      <div className="space-y-4">
        {abandonedCarts.length > 0 ? (
          abandonedCarts.map((cart) => {
            const abandonedTime = cart.abandonedAt instanceof Date 
              ? cart.abandonedAt.getTime() 
              : new Date(cart.abandonedAt).getTime();
            const hoursAgo = Math.floor((Date.now() - abandonedTime) / (60 * 60 * 1000));
            const daysAgo = Math.floor(hoursAgo / 24);
            const timeLabel = daysAgo > 0 ? `${daysAgo}d ago` : `${hoursAgo}h ago`;
            const isHotLead = hoursAgo < 24;
            const canSendReminder = cart.email && cart.remindersSent < 3;

            return (
              <motion.div
                key={cart.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium">
                        {cart.email || <span className="text-gray-400 italic">No email</span>}
                      </p>
                      {isHotLead && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5">HOT LEAD</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Abandoned {timeLabel} · {cart.remindersSent} reminder{cart.remindersSent !== 1 ? "s" : ""} sent
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">${cart.total.toFixed(2)}</span>
                    {canSendReminder && (
                      <button 
                        onClick={() => onSendReminder(cart.id)}
                        disabled={sendingReminder === cart.id}
                        className="bg-black text-white px-4 py-2 text-xs tracking-wider hover:bg-gray-900 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingReminder === cart.id ? (
                          <SpinnerGap className="w-3 h-3 animate-spin" />
                        ) : (
                          <Envelope className="w-3 h-3" />
                        )}
                        {sendingReminder === cart.id ? "SENDING..." : "SEND REMINDER"}
                      </button>
                    )}
                    {!cart.email && (
                      <span className="text-xs text-gray-400">No email available</span>
                    )}
                    {cart.remindersSent >= 3 && (
                      <span className="text-xs text-gray-400">Max reminders sent</span>
                    )}
                    <button
                      onClick={() => onDeleteCart(cart.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                      title="Delete cart"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cart.items.map((item, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                      <div className="w-10 h-12 bg-gray-200 relative overflow-hidden">
                        <Image src={item.image || "https://placehold.co/100x120/1a1a1a/ffffff?text=Item"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">${item.price} x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar for reminders */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Recovery progress</span>
                    <span>{cart.remindersSent}/3 reminders</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black transition-all"
                      style={{ width: `${(cart.remindersSent / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 border border-gray-200 bg-white">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="mb-2">No abandoned carts</p>
            <p className="text-xs text-gray-400">
              Abandoned carts will appear here when users add items to their cart but don&apos;t complete their purchase.
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      {abandonedCarts.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={onRefreshCarts}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 transition"
          >
            <ArrowsClockwise className="w-4 h-4" />
            Refresh data
          </button>
        </div>
      )}
    </div>
  );
}
