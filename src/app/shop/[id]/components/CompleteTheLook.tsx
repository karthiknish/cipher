"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface CompleteTheLookProps {
  currentProduct: { 
    id: string; 
    category: string; 
    price: number; 
  };
  products: Array<{ 
    id: string; 
    name: string; 
    price: number; 
    image: string; 
    category: string; 
  }>;
}

export default function CompleteTheLook({ currentProduct, products }: CompleteTheLookProps) {
  const { addToCart } = useCart();
  const toast = useToast();

  // Suggest complementary items based on category
  const getComplementaryCategories = (category: string): string[] => {
    const complements: Record<string, string[]> = {
      "Tees": ["Pants", "Outerwear", "Hoodies"],
      "Hoodies": ["Pants", "Tees", "Outerwear"],
      "Outerwear": ["Tees", "Pants", "Hoodies"],
      "Pants": ["Tees", "Hoodies", "Outerwear"],
    };
    return complements[category] || ["Tees", "Pants"];
  };

  const complementaryCategories = getComplementaryCategories(currentProduct.category);
  const suggestions = products
    .filter(p => p.id !== currentProduct.id && complementaryCategories.includes(p.category))
    .slice(0, 3);

  if (suggestions.length === 0) return null;

  const handleQuickAdd = (product: typeof suggestions[0]) => {
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
      <h2 className="text-xl font-light tracking-tight mb-2">COMPLETE THE LOOK</h2>
      <p className="text-sm text-gray-500 mb-8">Style this piece with these complementary items</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suggestions.map((product) => (
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
              </div>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                <h3 className="font-medium">{product.name}</h3>
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
