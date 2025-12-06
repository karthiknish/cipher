"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { Scales, ArrowRight, X } from "@phosphor-icons/react";
import { useCompare } from "@/context/CompareContext";

export default function CompareDrawer() {
  const { compareItems, removeFromCompare, clearCompare, canAddMore } = useCompare();
  const [isExpanded, setIsExpanded] = useState(false);

  if (compareItems.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40"
    >
      {/* Collapsed View */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <Scales className="w-5 h-5" />
          <span className="font-medium">Compare ({compareItems.length}/3)</span>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ArrowRight className="w-5 h-5 rotate-90" />
        </motion.div>
      </button>

      {/* Expanded Comparison View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  {canAddMore ? `Add ${3 - compareItems.length} more to compare` : "Compare up to 3 products"}
                </p>
                <button 
                  onClick={clearCompare}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {compareItems.map((item) => (
                  <div key={item.id} className="relative border border-gray-200 p-4">
                    <button 
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="relative aspect-square bg-gray-100 mb-3">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <h4 className="font-medium text-sm mb-1 truncate">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                  </div>
                ))}
                
                {/* Empty Slots */}
                {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="border border-dashed border-gray-300 p-4 flex items-center justify-center min-h-[200px]">
                    <p className="text-sm text-gray-400 text-center">Add product<br/>to compare</p>
                  </div>
                ))}
              </div>

              {compareItems.length >= 2 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="font-medium mb-4">Quick Comparison</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left font-medium text-gray-500">Feature</th>
                          {compareItems.map(item => (
                            <th key={item.id} className="py-2 text-left font-medium">{item.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Price</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">${item.price}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Category</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.category}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Sizes</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.sizes?.join(", ") || "S, M, L, XL"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 text-gray-500">Material</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.material || "Premium Cotton"}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
