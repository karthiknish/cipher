"use client";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "@/lib/motion";
import { Heart, ShoppingBag, Trash, ArrowRight, SpinnerGap } from "@phosphor-icons/react";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const toast = useToast();

  const handleAddToCart = (item: typeof wishlist[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      quantity: 1,
      size: "M", // Default size
    });
    toast.success(`${item.name} added to bag`);
  };

  const handleRemove = (item: typeof wishlist[0]) => {
    removeFromWishlist(item.id);
    toast.info(`${item.name} removed from wishlist`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 border border-gray-200 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">YOUR WISHLIST IS EMPTY</h1>
          <p className="text-gray-500 mb-10">Save items you love for later</p>
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
          >
            START SHOPPING
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
            YOUR WISHLIST ({wishlist.length})
          </motion.h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10"
        >
          <AnimatePresence mode="popLayout">
            {wishlist.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={item.id}
                className="group"
              >
                <Link href={`/shop/${item.id}`} className="block">
                  <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(item);
                        }}
                        className="w-10 h-10 bg-white flex items-center justify-center shadow-md hover:bg-red-50 transition"
                        title="Remove from wishlist"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(item);
                      }}
                      className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 text-sm tracking-wider font-medium opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" /> ADD TO BAG
                    </button>
                  </div>
                </Link>
                
                <Link href={`/shop/${item.id}`}>
                  <p className="text-xs text-gray-400 tracking-wider mb-1">{item.category.toUpperCase()}</p>
                  <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{item.name}</h3>
                  <p className="text-sm text-gray-500">${item.price}</p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Continue Shopping */}
        <div className="mt-16 text-center">
          <Link 
            href="/shop" 
            className="text-sm tracking-wider hover:underline underline-offset-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
