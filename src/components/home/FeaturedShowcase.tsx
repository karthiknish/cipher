"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { useProducts } from "@/context/ProductContext";

export default function FeaturedShowcase() {
  const { products } = useProducts();
  const featuredProducts = products.filter(p => p.featured).slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (featuredProducts.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  if (featuredProducts.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="w-full px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-[0.3em] text-gray-400 mb-4 block">FEATURED THIS WEEK</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight">
            EDITOR&apos;S <span className="font-bold">PICKS</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
          {/* Main Featured Image */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[4/5] bg-gray-100 overflow-hidden"
          >
            <Image
              src={featuredProducts[activeIndex]?.image || ""}
              alt={featuredProducts[activeIndex]?.name || ""}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
              <span className="text-xs tracking-wider text-white/60 mb-2 block">
                {featuredProducts[activeIndex]?.category.toUpperCase()}
              </span>
              <h3 className="text-2xl md:text-3xl font-light mb-2">
                {featuredProducts[activeIndex]?.name}
              </h3>
              <p className="text-xl">${featuredProducts[activeIndex]?.price}</p>
            </div>
          </motion.div>

          {/* Thumbnails & Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              {featuredProducts.map((product, index) => (
                <motion.button
                  key={product.id}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    index === activeIndex 
                      ? "bg-black text-white" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  whileHover={{ x: index === activeIndex ? 0 : 10 }}
                >
                  <div className="relative w-16 h-20 bg-gray-200 overflow-hidden rounded-lg flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-xs tracking-wider mb-1 ${index === activeIndex ? "text-white/60" : "text-gray-400"}`}>
                      {product.category.toUpperCase()}
                    </p>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className={index === activeIndex ? "text-white/80" : "text-gray-500"}>
                      ${product.price}
                    </p>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${index === activeIndex ? "text-white" : "text-gray-400"}`} />
                </motion.button>
              ))}
            </div>

            <Link
              href={`/shop/${featuredProducts[activeIndex]?.id}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition-all rounded-full"
            >
              SHOP THIS LOOK
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
