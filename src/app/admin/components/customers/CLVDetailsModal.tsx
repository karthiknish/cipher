"use client";
import { motion } from "@/lib/motion";
import {
  Warning,
  Envelope,
  ChartLineUp,
  X,
  Target,
  Wallet,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";
import { CustomerData } from "../types";
import { CLVPrediction } from "./types";

interface CLVDetailsModalProps {
  prediction: CLVPrediction | null;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (customer: CustomerData) => void;
}

export function CLVDetailsModal({ 
  prediction, 
  isOpen, 
  onClose,
  onSendEmail 
}: CLVDetailsModalProps) {
  if (!isOpen || !prediction) return null;

  const { 
    customer, 
    predictedCLV, 
    churnRisk, 
    churnScore, 
    nextPurchaseProbability, 
    daysUntilNextPurchase, 
    recommendations, 
    segment, 
    segmentColor 
  } = prediction;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-light tracking-tight">{customer.email}</h2>
                <span className={`px-2 py-1 text-xs ${segmentColor}`}>{segment}</span>
              </div>
              <p className="text-sm text-gray-500">Customer Lifetime Value Analysis</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 p-4 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-600 font-medium">PREDICTED CLV</span>
              </div>
              <p className="text-2xl font-medium text-emerald-700">${predictedCLV}</p>
              <p className="text-xs text-emerald-600 mt-1">12-month projection</p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              churnRisk === "high" ? "bg-rose-50 border-rose-100" :
              churnRisk === "medium" ? "bg-amber-50 border-amber-100" :
              "bg-emerald-50 border-emerald-100"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Warning className={`w-4 h-4 ${
                  churnRisk === "high" ? "text-rose-600" :
                  churnRisk === "medium" ? "text-amber-600" :
                  "text-emerald-600"
                }`} />
                <span className={`text-xs font-medium ${
                  churnRisk === "high" ? "text-rose-600" :
                  churnRisk === "medium" ? "text-amber-600" :
                  "text-emerald-600"
                }`}>CHURN RISK</span>
              </div>
              <p className={`text-2xl font-medium capitalize ${
                churnRisk === "high" ? "text-rose-700" :
                churnRisk === "medium" ? "text-amber-700" :
                "text-emerald-700"
              }`}>{churnRisk}</p>
              <p className="text-xs text-gray-500 mt-1">{churnScore}% score</p>
            </div>
            
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-sky-600" />
                <span className="text-xs text-sky-600 font-medium">PURCHASE PROB.</span>
              </div>
              <p className="text-2xl font-medium text-sky-700">{nextPurchaseProbability}%</p>
              <p className="text-xs text-sky-600 mt-1">Next 30 days</p>
            </div>
            
            <div className="bg-violet-50 p-4 rounded-lg border border-violet-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-violet-600" />
                <span className="text-xs text-violet-600 font-medium">NEXT PURCHASE</span>
              </div>
              <p className="text-2xl font-medium text-violet-700">
                {daysUntilNextPurchase > 0 ? `${daysUntilNextPurchase}d` : "Overdue"}
              </p>
              <p className="text-xs text-violet-600 mt-1">Expected in</p>
            </div>
          </div>

          {/* Historical Data */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-4">Purchase History</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="font-medium">{customer.orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Spent</span>
                  <span className="font-medium">${customer.totalSpent.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Avg Order Value</span>
                  <span className="font-medium">${customer.avgOrderValue.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Order</span>
                  <span className="font-medium">{new Date(customer.lastOrder).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-4">Category Preferences</h4>
              <div className="space-y-2">
                {customer.categories.length > 0 ? (
                  customer.categories.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-black rounded-full" />
                      <span className="text-sm">{cat}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No category data</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-r from-sky-50 to-sky-100 p-4 rounded-lg border border-sky-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkle className="w-5 h-5 text-sky-600" />
              <h4 className="font-medium text-sky-900">AI Retention Recommendations</h4>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChartLineUp className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-sky-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onSendEmail(customer)}
              className="flex-1 bg-black text-white py-3 text-sm tracking-wider font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Envelope className="w-4 h-4" />
              SEND PERSONALIZED EMAIL
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
