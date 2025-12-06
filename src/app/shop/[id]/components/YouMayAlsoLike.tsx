"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Sparkle, ShoppingBag } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useRecommendations } from "@/context/RecommendationContext";

interface YouMayAlsoLikeProps {
  currentProductId: string;
}

export default function YouMayAlsoLike({ currentProductId }: YouMayAlsoLikeProps) {
  const { getPersonalizedRecommendations, getSimilarProducts } = useRecommendations();
  const { addToCart } = useCart();
  const toast = useToast();
  
  // Get personalized recommendations, falling back to similar products
  const recommendations = getPersonalizedRecommendations(4);
  const similarProducts = getSimilarProducts(currentProductId, 4);
  
  // Use personalized if available, otherwise similar products
  const displayProducts = recommendations.length > 0 
    ? recommendations.filter(p => p.id !== currentProductId).slice(0, 4)
    : similarProducts;
  
  if (displayProducts.length === 0) return null;

  const handleQuickAdd = (product: typeof displayProducts[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: 1,
      size: "M",
    });
    toast.success(`${product.name} added to bag`);
  };

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkle className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-light tracking-tight">YOU MAY ALSO LIKE</h2>
      </div>
      <p className="text-sm text-gray-500 mb-8">AI-powered recommendations based on your style</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <motion.div 
            key={product.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <Link href={`/shop/${product.id}`}>
              <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium">
                  AI PICK
                </div>
              </div>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-sm text-gray-600">${product.price}</p>
              </div>
              <button 
                onClick={() => handleQuickAdd(product)}
                className="p-2 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
