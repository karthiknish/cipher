"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock } from "@phosphor-icons/react";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";

interface RecentlyViewedSectionProps {
  currentProductId: string;
}

export default function RecentlyViewedSection({ currentProductId }: RecentlyViewedSectionProps) {
  const { recentlyViewed } = useRecentlyViewed();
  
  const filtered = recentlyViewed.filter(p => p.id !== currentProductId).slice(0, 4);
  
  if (filtered.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="w-5 h-5 text-gray-400" />
        <h2 className="text-xl font-light tracking-tight">RECENTLY VIEWED</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <Link key={product.id} href={`/shop/${product.id}`} className="group">
            <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <p className="text-xs text-gray-400 mb-1">{product.category}</p>
            <h3 className="font-medium text-sm">{product.name}</h3>
            <p className="text-sm text-gray-600">${product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
