"use client";
import { Package, Barcode, Scales } from "@phosphor-icons/react";
import { ProductFormProps } from "./types";

interface InventoryTabProps extends ProductFormProps {}

export function InventoryTab({ formData, setFormData }: InventoryTabProps) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Inventory</h2>
          <p className="text-sm text-gray-500">Stock and shipping details</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              SKU (Stock Keeping Unit)
            </label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.sku || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sku: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition font-mono"
                placeholder="CIP-HOO-001"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Unique identifier for inventory tracking
            </p>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              WEIGHT (grams)
            </label>
            <div className="relative">
              <Scales className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    weight: Number(e.target.value),
                  }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                placeholder="500"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used for shipping calculations
            </p>
          </div>
        </div>

        {/* Stock Summary */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Stock Summary
          </h3>

          {formData.sizeStock && formData.sizeStock.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {formData.sizeStock.map((ss) => (
                  <div
                    key={ss.size}
                    className="flex justify-between items-center py-2 border-b border-gray-200"
                  >
                    <span className="text-sm">{ss.size}</span>
                    <span
                      className={`font-mono text-sm ${
                        ss.stock < 5
                          ? "text-red-500"
                          : ss.stock < 10
                            ? "text-amber-500"
                            : "text-green-600"
                      }`}
                    >
                      {ss.stock} units
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-black">
                <span className="font-medium">Total Stock</span>
                <span className="font-mono font-bold">
                  {formData.sizeStock.reduce((sum, ss) => sum + ss.stock, 0)} units
                </span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              No sizes configured. Go to Colors & Sizes tab.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
