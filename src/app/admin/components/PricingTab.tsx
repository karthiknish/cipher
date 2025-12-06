"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  Fire,
  Percent,
  Timer,
  TrendUp,
  X,
} from "@phosphor-icons/react";
import { Product } from "@/context/ProductContext";
import { PricingRule } from "@/context/DynamicPricingContext";
import { CATEGORIES } from "./types";

interface PricingTabProps {
  products: Product[];
  pricingRules: PricingRule[];
  activeFlashSalesCount: number;
  onCreateRule: (rule: Omit<PricingRule, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
}

export function PricingTab({
  products,
  pricingRules,
  activeFlashSalesCount,
  onCreateRule,
  onToggleRule,
  onDeleteRule,
}: PricingTabProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    type: "flash_sale",
    discountPercent: 20,
    isActive: true,
    priority: 1,
  });

  const typeLabels: Record<string, string> = {
    flash_sale: "Flash Sale",
    demand_surge: "Demand Surge",
    low_stock: "Low Stock",
    time_based: "Time-Based",
    bulk_discount: "Bulk Discount",
    happy_hour: "Happy Hour"
  };
  
  const typeColors: Record<string, string> = {
    flash_sale: "bg-rose-100 text-rose-700",
    demand_surge: "bg-violet-100 text-violet-700",
    low_stock: "bg-amber-100 text-amber-700",
    time_based: "bg-sky-100 text-sky-700",
    bulk_discount: "bg-emerald-100 text-emerald-700",
    happy_hour: "bg-violet-100 text-violet-700"
  };

  const handleCreateRule = async () => {
    if (!newRule.type || newRule.isActive === undefined || newRule.priority === undefined) return;
    setCreatingRule(true);
    try {
      await onCreateRule({
        type: newRule.type,
        isActive: newRule.isActive,
        priority: newRule.priority,
        productId: newRule.productId,
        category: newRule.category,
        discountPercent: newRule.discountPercent,
        discountAmount: newRule.discountAmount,
        multiplier: newRule.multiplier,
        minQuantity: newRule.minQuantity,
        startTime: newRule.startTime,
        endTime: newRule.endTime,
        conditions: newRule.conditions,
      });
      setShowPricingModal(false);
      setNewRule({
        type: 'flash_sale',
        discountPercent: 20,
        isActive: true,
        priority: 10
      });
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setCreatingRule(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Dynamic Pricing Rules</h2>
          <p className="text-sm text-gray-500">Manage flash sales, demand-based pricing, and promotional discounts</p>
        </div>
        <button
          onClick={() => setShowPricingModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Fire className="w-4 h-4" />
            Active Flash Sales
          </div>
          <p className="text-2xl font-light">{activeFlashSalesCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Percent className="w-4 h-4" />
            Total Rules
          </div>
          <p className="text-2xl font-light">{pricingRules.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Timer className="w-4 h-4" />
            Time-Based Active
          </div>
          <p className="text-2xl font-light">{pricingRules.filter(r => r.isActive && (r.type === 'time_based' || r.type === 'happy_hour')).length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendUp className="w-4 h-4" />
            Demand Surge Rules
          </div>
          <p className="text-2xl font-light">{pricingRules.filter(r => r.type === 'demand_surge').length}</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="font-medium">All Pricing Rules</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Target</th>
                <th className="text-left p-4">Discount/Multiplier</th>
                <th className="text-left p-4">Schedule</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pricingRules.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No pricing rules yet. Create your first rule to get started.
                  </td>
                </tr>
              )}
              {pricingRules.map(rule => {
                const targetProduct = rule.productId ? products.find(p => p.id === rule.productId) : null;

                return (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded ${typeColors[rule.type]}`}>
                        {typeLabels[rule.type]}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {targetProduct ? (
                        <span>{targetProduct.name}</span>
                      ) : rule.category ? (
                        <span className="text-gray-600">Category: {rule.category}</span>
                      ) : (
                        <span className="text-gray-400">All Products</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {rule.discountPercent ? (
                        <span className="text-emerald-600">-{rule.discountPercent}%</span>
                      ) : rule.discountAmount ? (
                        <span className="text-emerald-600">-${rule.discountAmount}</span>
                      ) : rule.multiplier ? (
                        <span className={rule.multiplier > 1 ? "text-rose-600" : "text-emerald-600"}>
                          {rule.multiplier > 1 ? "+" : ""}{((rule.multiplier - 1) * 100).toFixed(0)}%
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {rule.startTime && rule.endTime ? (
                        <div className="text-xs">
                          <div>{new Date(rule.startTime).toLocaleDateString()}</div>
                          <div>to {new Date(rule.endTime).toLocaleDateString()}</div>
                        </div>
                      ) : rule.conditions?.hourStart !== undefined && rule.conditions?.hourEnd !== undefined ? (
                        <span>{rule.conditions.hourStart}:00 - {rule.conditions.hourEnd}:00</span>
                      ) : (
                        "Always"
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="text-gray-600">{rule.priority}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleRule(rule.id)}
                          className={`p-1.5 rounded ${rule.isActive ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                          title={rule.isActive ? "Deactivate" : "Activate"}
                        >
                          {rule.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-600"
                          title="Delete Rule"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Pricing Rule Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPricingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-medium">Create Pricing Rule</h3>
                <button onClick={() => setShowPricingModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Rule Type</label>
                  <select
                    value={newRule.type}
                    onChange={e => setNewRule({ ...newRule, type: e.target.value as typeof newRule.type })}
                    className="w-full border border-gray-200 p-2 text-sm"
                  >
                    <option value="flash_sale">Flash Sale</option>
                    <option value="demand_surge">Demand Surge (Price Increase)</option>
                    <option value="low_stock">Low Stock Discount</option>
                    <option value="time_based">Time-Based Sale</option>
                    <option value="bulk_discount">Bulk Discount</option>
                    <option value="happy_hour">Happy Hour</option>
                  </select>
                </div>

                {/* Target */}
                <div>
                  <label className="block text-sm font-medium mb-2">Apply To</label>
                  <div className="space-y-2">
                    <select
                      value={newRule.productId || ""}
                      onChange={e => setNewRule({ ...newRule, productId: e.target.value || undefined, category: undefined })}
                      className="w-full border border-gray-200 p-2 text-sm"
                    >
                      <option value="">All Products / Select Category</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {!newRule.productId && (
                      <select
                        value={newRule.category || ""}
                        onChange={e => setNewRule({ ...newRule, category: e.target.value || undefined })}
                        className="w-full border border-gray-200 p-2 text-sm"
                      >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Discount/Multiplier */}
                {newRule.type === 'demand_surge' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Multiplier</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="3"
                      value={newRule.multiplier || 1.2}
                      onChange={e => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) })}
                      className="w-full border border-gray-200 p-2 text-sm"
                      placeholder="e.g., 1.2 = 20% increase"
                    />
                    <p className="text-xs text-gray-500 mt-1">1.2 = 20% price increase, 1.5 = 50% increase</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newRule.discountPercent || ""}
                        onChange={e => setNewRule({ ...newRule, discountPercent: e.target.value ? parseFloat(e.target.value) : undefined, discountAmount: undefined })}
                        className="w-full border border-gray-200 p-2 text-sm"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Or Fixed Amount $</label>
                      <input
                        type="number"
                        min="0"
                        value={newRule.discountAmount || ""}
                        onChange={e => setNewRule({ ...newRule, discountAmount: e.target.value ? parseFloat(e.target.value) : undefined, discountPercent: undefined })}
                        className="w-full border border-gray-200 p-2 text-sm"
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>
                )}

                {/* Bulk Discount Min Quantity */}
                {newRule.type === 'bulk_discount' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Quantity</label>
                    <input
                      type="number"
                      min="2"
                      value={newRule.minQuantity || 3}
                      onChange={e => setNewRule({ ...newRule, minQuantity: parseInt(e.target.value) })}
                      className="w-full border border-gray-200 p-2 text-sm"
                    />
                  </div>
                )}

                {/* Happy Hour */}
                {newRule.type === 'happy_hour' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Hour (24h)</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={newRule.conditions?.hourStart ?? 14}
                        onChange={e => setNewRule({ 
                          ...newRule, 
                          conditions: { 
                            ...newRule.conditions, 
                            hourStart: parseInt(e.target.value)
                          } 
                        })}
                        className="w-full border border-gray-200 p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Hour (24h)</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={newRule.conditions?.hourEnd ?? 18}
                        onChange={e => setNewRule({ 
                          ...newRule, 
                          conditions: { 
                            ...newRule.conditions, 
                            hourEnd: parseInt(e.target.value)
                          } 
                        })}
                        className="w-full border border-gray-200 p-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Time-Based Schedule */}
                {(newRule.type === 'flash_sale' || newRule.type === 'time_based') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="datetime-local"
                        value={newRule.startTime ? new Date(newRule.startTime).toISOString().slice(0, 16) : ""}
                        onChange={e => setNewRule({ ...newRule, startTime: new Date(e.target.value) })}
                        className="w-full border border-gray-200 p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <input
                        type="datetime-local"
                        value={newRule.endTime ? new Date(newRule.endTime).toISOString().slice(0, 16) : ""}
                        onChange={e => setNewRule({ ...newRule, endTime: new Date(e.target.value) })}
                        className="w-full border border-gray-200 p-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-2">Priority (higher = more important)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newRule.priority}
                    onChange={e => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 p-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">When multiple rules apply, higher priority wins</p>
                </div>

                {/* Active */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRule.isActive}
                    onChange={e => setNewRule({ ...newRule, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Activate immediately</span>
                </label>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={creatingRule || (!newRule.discountPercent && !newRule.discountAmount && !newRule.multiplier)}
                  className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingRule ? "Creating..." : "Create Rule"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
