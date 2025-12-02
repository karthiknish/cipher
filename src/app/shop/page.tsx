"use client";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, SpinnerGap } from "@phosphor-icons/react";

const CATEGORIES = ["All", "Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

export default function Shop() {
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4"
          >
            THE COLLECTION
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-md mx-auto"
          >
            Premium streetwear designed for the modern urban explorer
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 text-sm tracking-wider font-medium hover:opacity-70 transition"
            >
              {filterOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              FILTER
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
          </div>
          
          {activeCategory !== "All" && (
            <button
              onClick={() => setActiveCategory("All")}
              className="text-sm tracking-wider hover:underline underline-offset-4"
            >
              Clear filter: {activeCategory}
            </button>
          )}
        </div>

        {/* Category Filter */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="flex flex-wrap gap-3 pb-8 border-b border-gray-200">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-3 text-sm tracking-wider transition-all ${
                      activeCategory === cat 
                        ? "bg-black text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-16"
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group"
            >
                <Link href={`/shop/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    
                    {/* Quick Add */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart({ 
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          category: product.category,
                          quantity: 1,
                          size: "M" // Default size for quick add
                        });
                        toast.success(`${product.name} added to bag`);
                      }}
                      className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 text-sm tracking-wider font-medium opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white text-center"
                    >
                      QUICK ADD
                    </button>
                  </div>
                </Link>
                
                <Link href={`/shop/${product.id}`}>
                  <p className="text-xs text-gray-400 tracking-wider mb-1">{product.category.toUpperCase()}</p>
                  <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{product.name}</h3>
                  <p className="text-sm text-gray-500">${product.price}</p>
                </Link>
              </div>
            ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No products found in this category</p>
            <button 
              onClick={() => setActiveCategory("All")}
              className="text-sm tracking-wider underline underline-offset-4"
            >
              View all products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
