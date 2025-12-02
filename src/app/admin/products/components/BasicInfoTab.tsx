"use client";
import {
  CurrencyDollar,
  CaretDown,
  CheckCircle,
  Star,
  TextT,
  Sparkle,
  SpinnerGap,
  MagicWand,
} from "@phosphor-icons/react";
import { ProductFormProps, CATEGORIES } from "./types";

interface BasicInfoTabProps extends ProductFormProps {
  isGeneratingAI: boolean;
  onGenerateAI: () => void;
}

export function BasicInfoTab({
  formData,
  setFormData,
  isGeneratingAI,
  onGenerateAI,
}: BasicInfoTabProps) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <TextT className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Basic Information</h2>
          <p className="text-sm text-gray-500">Core product details</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs tracking-wider text-gray-500 mb-2">
            PRODUCT NAME *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition text-lg"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs tracking-wider text-gray-500">
              SHORT DESCRIPTION
            </label>
            <button
              type="button"
              onClick={onGenerateAI}
              disabled={isGeneratingAI || !formData.name.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-full hover:from-sky-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAI ? (
                <>
                  <SpinnerGap className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MagicWand className="w-3 h-3" />
                  AI Fill All
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            value={formData.shortDescription || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                shortDescription: e.target.value,
              }))
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
            placeholder="Brief one-line description for listings"
            maxLength={150}
          />
          <p className="text-xs text-gray-400 mt-1">
            {(formData.shortDescription || "").length}/150 characters
          </p>
        </div>

        <div>
          <label className="block text-xs tracking-wider text-gray-500 mb-2">
            FULL DESCRIPTION *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition resize-none"
            placeholder="Detailed product description..."
            rows={6}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              PRICE ($) *
            </label>
            <div className="relative">
              <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              COMPARE PRICE
            </label>
            <div className="relative">
              <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.comparePrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    comparePrice: Number(e.target.value),
                  }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                placeholder="Original price"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Shows as strikethrough</p>
          </div>
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              CATEGORY *
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition bg-white appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Status Flags */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xs tracking-wider text-gray-500 font-medium mb-4">
            STATUS & VISIBILITY
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${formData.inStock ? "text-green-500" : "text-gray-300"}`}
                  weight={formData.inStock ? "fill" : "regular"}
                />
                <span className="text-sm">In Stock</span>
              </div>
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, inStock: e.target.checked }))
                }
                className="w-5 h-5 accent-black"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
              <div className="flex items-center gap-3">
                <Star
                  className={`w-5 h-5 ${formData.featured ? "text-amber-500" : "text-gray-300"}`}
                  weight={formData.featured ? "fill" : "regular"}
                />
                <span className="text-sm">Featured</span>
              </div>
              <input
                type="checkbox"
                checked={formData.featured || false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                }
                className="w-5 h-5 accent-black"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
              <div className="flex items-center gap-3">
                <Sparkle
                  className={`w-5 h-5 ${formData.isNew ? "text-blue-500" : "text-gray-300"}`}
                  weight={formData.isNew ? "fill" : "regular"}
                />
                <span className="text-sm">New Arrival</span>
              </div>
              <input
                type="checkbox"
                checked={formData.isNew || false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isNew: e.target.checked }))
                }
                className="w-5 h-5 accent-black"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
