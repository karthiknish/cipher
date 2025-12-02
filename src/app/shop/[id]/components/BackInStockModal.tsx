"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Bell, Warning, CheckCircle, Envelope, SpinnerGap } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useStockNotification } from "@/context/StockNotificationContext";
import { useToast } from "@/context/ToastContext";

interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: { 
    id: string; 
    name: string; 
    image: string; 
  };
  selectedSize?: string;
}

export default function BackInStockModal({ 
  isOpen, 
  onClose, 
  product, 
  selectedSize 
}: BackInStockModalProps) {
  const { user } = useAuth();
  const { subscribeToStock, isSubscribed } = useStockNotification();
  const toast = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    setSubscribed(isSubscribed(product.id, selectedSize));
  }, [product.id, selectedSize, isSubscribed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    const success = await subscribeToStock(product, email, selectedSize);
    setIsSubmitting(false);

    if (success) {
      setSubscribed(true);
      toast.success("You'll be notified when this item is back in stock!");
      setTimeout(onClose, 1500);
    } else {
      toast.error("Failed to subscribe. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="bg-white w-full max-w-md overflow-hidden shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight">NOTIFY ME</h2>
                <p className="text-xs text-gray-500">Get alerted when back in stock</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Product Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 mb-6">
            <div className="w-16 h-20 bg-gray-200 relative overflow-hidden flex-shrink-0">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-medium">{product.name}</h3>
              {selectedSize && (
                <p className="text-sm text-gray-500">Size: {selectedSize}</p>
              )}
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <Warning className="w-3 h-3" /> Currently out of stock
              </p>
            </div>
          </div>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">You&apos;re on the list!</h3>
              <p className="text-sm text-gray-500">
                We&apos;ll email you at <span className="font-medium">{email}</span> when this item is available.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" /> SUBSCRIBING...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" /> NOTIFY ME
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                We&apos;ll only email you once when this item is restocked. No spam, promise.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
