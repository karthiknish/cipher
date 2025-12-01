"use client";
import Image from "next/image";
import {
  Warning,
  Clock,
  CheckCircle,
  XCircle,
  TrendUp,
  TrendDown,
  Pulse,
  ChartBar,
  Pencil,
} from "@phosphor-icons/react";
import { InventoryForecastItem, CATEGORIES } from "./types";

interface InventoryTabProps {
  inventoryForecast: InventoryForecastItem[];
  editingStock: string | null;
  stockInput: string;
  restockInput: string;
  updatingStock: boolean;
  setEditingStock: (id: string | null) => void;
  setStockInput: (value: string) => void;
  setRestockInput: (value: string) => void;
  onUpdateStock: (productId: string) => void;
  onRestock: (productId: string) => void;
}

export function InventoryTab({
  inventoryForecast,
  editingStock,
  stockInput,
  restockInput,
  updatingStock,
  setEditingStock,
  setStockInput,
  setRestockInput,
  onUpdateStock,
  onRestock,
}: InventoryTabProps) {
  return (
    <div className="space-y-8">
      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 p-6">
          <Warning className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-medium text-red-700">
            {inventoryForecast.filter(i => i.daysUntilStockout < 7).length}
          </p>
          <p className="text-xs text-red-600 tracking-wider">CRITICAL (&lt;7 DAYS)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-medium text-amber-700">
            {inventoryForecast.filter(i => i.daysUntilStockout >= 7 && i.daysUntilStockout < 14).length}
          </p>
          <p className="text-xs text-amber-600 tracking-wider">LOW STOCK (7-14 DAYS)</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-6">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-medium text-green-700">
            {inventoryForecast.filter(i => i.daysUntilStockout >= 14).length}
          </p>
          <p className="text-xs text-green-600 tracking-wider">HEALTHY STOCK</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6">
          <TrendUp className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-medium text-blue-700">
            {inventoryForecast.filter(i => i.trend === "up").length}
          </p>
          <p className="text-xs text-blue-600 tracking-wider">TRENDING UP</p>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {inventoryForecast.filter(i => i.reorderSuggested).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Warning className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-medium">Reorder Suggestions</h3>
              <p className="text-sm text-gray-600">
                {inventoryForecast.filter(i => i.reorderSuggested).length} products need restocking soon
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {inventoryForecast
              .filter(i => i.reorderSuggested)
              .slice(0, 5)
              .map(item => (
                <span 
                  key={item.product.id}
                  className="bg-white px-3 py-1.5 text-sm border border-amber-200"
                >
                  {item.product.name} ({item.daysUntilStockout}d)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRODUCT</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">CURRENT STOCK</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">30D SALES</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">7D SALES</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">DAILY AVG</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">DAYS LEFT</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">TREND</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
                <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventoryForecast.map((item) => {
                let statusColor = "bg-green-100 text-green-800";
                let statusText = "HEALTHY";
                
                if (item.daysUntilStockout < 7) {
                  statusColor = "bg-red-100 text-red-800";
                  statusText = "CRITICAL";
                } else if (item.daysUntilStockout < 14) {
                  statusColor = "bg-amber-100 text-amber-800";
                  statusText = "LOW";
                }

                const isEditing = editingStock === item.product.id;

                return (
                  <tr key={item.product.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gray-100 relative overflow-hidden flex-shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={stockInput}
                            onChange={(e) => setStockInput(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 text-sm focus:border-black outline-none"
                            placeholder={String(item.currentStock)}
                          />
                          <button
                            onClick={() => onUpdateStock(item.product.id)}
                            disabled={updatingStock}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingStock(null); setStockInput(""); }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`font-medium ${item.currentStock < 10 ? "text-red-600" : ""}`}>
                          {item.currentStock}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">{item.salesLast30}</td>
                    <td className="py-4 px-6">{item.salesLast7}</td>
                    <td className="py-4 px-6">{item.avgDailySales.toFixed(1)}</td>
                    <td className="py-4 px-6">
                      <span className={`font-medium ${
                        item.daysUntilStockout < 7 ? "text-red-600" : 
                        item.daysUntilStockout < 14 ? "text-amber-600" : ""
                      }`}>
                        {item.daysUntilStockout > 100 ? "100+" : item.daysUntilStockout}d
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        {item.trend === "up" && (
                          <>
                            <TrendUp className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600">Up</span>
                          </>
                        )}
                        {item.trend === "down" && (
                          <>
                            <TrendDown className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-600">Down</span>
                          </>
                        )}
                        {item.trend === "stable" && (
                          <>
                            <Pulse className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Stable</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={restockInput}
                            onChange={(e) => setRestockInput(e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 text-sm focus:border-black outline-none"
                            placeholder="+Qty"
                          />
                          <button
                            onClick={() => onRestock(item.product.id)}
                            disabled={updatingStock || !restockInput}
                            className="text-xs bg-green-600 text-white px-2 py-1 hover:bg-green-700 disabled:opacity-50"
                          >
                            ADD
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStock(item.product.id);
                            setStockInput(String(item.currentStock));
                            setRestockInput("");
                          }}
                          className="text-xs text-gray-500 hover:text-black transition flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium">Stock Level Projections</h3>
            <p className="text-xs text-gray-500 mt-1">Estimated days until stockout by category</p>
          </div>
          <ChartBar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {CATEGORIES.map(category => {
            const categoryItems = inventoryForecast.filter(i => i.product.category === category);
            const avgDaysLeft = categoryItems.length > 0
              ? Math.min(100, categoryItems.reduce((sum, i) => sum + i.daysUntilStockout, 0) / categoryItems.length)
              : 100;
            
            let barColor = "bg-green-500";
            if (avgDaysLeft < 7) barColor = "bg-red-500";
            else if (avgDaysLeft < 14) barColor = "bg-amber-500";
            else if (avgDaysLeft < 30) barColor = "bg-blue-500";

            return (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{category}</span>
                  <span className="text-gray-500">{Math.floor(avgDaysLeft)}d avg</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${Math.min(100, avgDaysLeft)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
