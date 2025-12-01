"use client";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Minus, Plus } from "@phosphor-icons/react";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, subtotal, shipping, tax, total, clearCart } = useCart();
  const toast = useToast();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">YOUR BAG IS EMPTY</h1>
          <p className="text-gray-500 mb-10">Add some items to get started</p>
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
          >
            CONTINUE SHOPPING
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light tracking-tight"
          >
            YOUR BAG ({cart.length})
          </motion.h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="border-b border-gray-200 pb-4 mb-6 hidden md:grid grid-cols-12 text-xs tracking-wider text-gray-500">
              <div className="col-span-6">PRODUCT</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-center">PRICE</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>

            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={`${item.id}-${item.size}`} 
                  className="grid grid-cols-12 gap-4 py-6 border-b border-gray-100 items-center"
                >
                  {/* Product */}
                  <div className="col-span-12 md:col-span-6 flex gap-4">
                    <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-gray-400 tracking-wider mb-1">{item.category?.toUpperCase()}</p>
                      <h3 className="font-medium mb-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">Size: {item.size}</p>
                      <button
                        onClick={() => {
                          removeFromCart(item.id, item.size);
                          toast.info(`${item.name} removed from bag`);
                        }}
                        className="text-xs text-gray-400 hover:text-black transition underline underline-offset-4 text-left"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 md:col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        className="p-2 hover:bg-gray-50 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-4 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="p-2 hover:bg-gray-50 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-4 md:col-span-2 text-center text-sm">
                    ${item.price}
                  </div>

                  {/* Total */}
                  <div className="col-span-4 md:col-span-2 text-right font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="mt-6 flex justify-between items-center">
              <Link 
                href="/shop" 
                className="text-sm tracking-wider hover:underline underline-offset-4"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => {
                  clearCart();
                  toast.info("Cart cleared");
                }}
                className="text-sm text-gray-400 hover:text-red-500 transition"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-neutral-50 p-8 sticky top-24">
              <h2 className="text-sm tracking-wider mb-6">ORDER SUMMARY</h2>
              
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="block w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition text-center mb-4"
              >
                CHECKOUT
              </Link>
              
              <p className="text-xs text-gray-400 text-center">
                Secure checkout powered by Stripe
              </p>

              {shipping > 0 && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Add ${(150 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
