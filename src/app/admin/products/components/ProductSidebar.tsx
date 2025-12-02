"use client";
import Link from "next/link";
import { Star, TextT, ImageSquare, Palette, Package, ListBullets } from "@phosphor-icons/react";
import { ProductTab, ProductFormData } from "./types";

interface ProductSidebarProps {
  activeTab: ProductTab;
  setActiveTab: (tab: ProductTab) => void;
  formData: ProductFormData;
}

const TABS = [
  { id: "basic" as ProductTab, label: "Basic Info", icon: TextT },
  { id: "media" as ProductTab, label: "Media", icon: ImageSquare },
  { id: "variants" as ProductTab, label: "Colors & Sizes", icon: Palette },
  { id: "inventory" as ProductTab, label: "Inventory", icon: Package },
  { id: "details" as ProductTab, label: "Details & SEO", icon: ListBullets },
];

export function ProductSidebar({
  activeTab,
  setActiveTab,
  formData,
}: ProductSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white border rounded-lg overflow-hidden sticky top-24">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-xs tracking-wider text-gray-500 font-medium">
            SECTIONS
          </h3>
        </div>
        <nav className="p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Quick Preview */}
        {formData.image && (
          <div className="p-4 border-t">
            <p className="text-xs tracking-wider text-gray-500 mb-3">PREVIEW</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="relative aspect-[4/5] mb-3 bg-gray-200 rounded overflow-hidden">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
                  }}
                />
                {formData.isNew && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded">
                    NEW
                  </span>
                )}
                {formData.featured && (
                  <Star
                    className="absolute top-2 right-2 w-4 h-4 text-amber-400"
                    weight="fill"
                  />
                )}
              </div>
              <p className="font-medium text-sm truncate">
                {formData.name || "Product Name"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium text-sm">${formData.price || 0}</span>
                {formData.comparePrice &&
                  formData.comparePrice > formData.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ${formData.comparePrice}
                    </span>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
