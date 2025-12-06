"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ChartLineUp, Envelope, CaretDown, CaretUp } from "@phosphor-icons/react";
import { CustomerData } from "../types";
import { CLVPrediction, SortBy } from "./types";

interface CLVPredictionsTableProps {
  clvPredictions: CLVPrediction[];
  onViewDetails: (prediction: CLVPrediction) => void;
  onSendEmail: (customer: CustomerData) => void;
}

export function CLVPredictionsTable({ 
  clvPredictions, 
  onViewDetails, 
  onSendEmail 
}: CLVPredictionsTableProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("predictions");
  const [sortBy, setSortBy] = useState<SortBy>("clv");

  // Sort predictions
  const sortedPredictions = [...clvPredictions].sort((a, b) => {
    switch (sortBy) {
      case "clv":
        return b.predictedCLV - a.predictedCLV;
      case "churn":
        return b.churnScore - a.churnScore;
      case "spent":
        return b.customer.totalSpent - a.customer.totalSpent;
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white border border-gray-200">
      <button
        onClick={() => setExpandedSection(expandedSection === "predictions" ? null : "predictions")}
        className="w-full p-6 border-b border-gray-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ChartLineUp className="w-5 h-5 text-purple-600" />
          <div className="text-left">
            <h3 className="font-medium">CLV Predictions & Churn Risk</h3>
            <p className="text-xs text-gray-500 mt-1">Detailed analysis for each customer</p>
          </div>
        </div>
        {expandedSection === "predictions" ? <CaretUp className="w-5 h-5" /> : <CaretDown className="w-5 h-5" />}
      </button>
      
      <AnimatePresence>
        {expandedSection === "predictions" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Sort Options */}
            <div className="p-4 border-b border-gray-100 flex gap-2">
              <button
                onClick={() => setSortBy("clv")}
                className={`px-3 py-1.5 text-xs tracking-wider ${sortBy === "clv" ? "bg-black text-white" : "border border-gray-200 hover:border-black"}`}
              >
                BY CLV
              </button>
              <button
                onClick={() => setSortBy("churn")}
                className={`px-3 py-1.5 text-xs tracking-wider ${sortBy === "churn" ? "bg-black text-white" : "border border-gray-200 hover:border-black"}`}
              >
                BY CHURN RISK
              </button>
              <button
                onClick={() => setSortBy("spent")}
                className={`px-3 py-1.5 text-xs tracking-wider ${sortBy === "spent" ? "bg-black text-white" : "border border-gray-200 hover:border-black"}`}
              >
                BY SPENT
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">CUSTOMER</th>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">SEGMENT</th>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">PREDICTED CLV</th>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">CHURN RISK</th>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">NEXT PURCHASE</th>
                    <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPredictions.slice(0, 15).map((prediction, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-6">
                        <p className="text-sm font-medium">{prediction.customer.email}</p>
                        <p className="text-xs text-gray-500">
                          {prediction.customer.orders} orders · ${prediction.customer.totalSpent.toFixed(0)} total
                        </p>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 text-xs ${prediction.segmentColor}`}>
                          {prediction.segment}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <p className="text-sm font-medium text-green-600">${prediction.predictedCLV}</p>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            prediction.churnRisk === "high" ? "bg-red-500" :
                            prediction.churnRisk === "medium" ? "bg-amber-500" :
                            "bg-green-500"
                          }`} />
                          <span className={`text-xs capitalize ${
                            prediction.churnRisk === "high" ? "text-red-600" :
                            prediction.churnRisk === "medium" ? "text-amber-600" :
                            "text-green-600"
                          }`}>
                            {prediction.churnRisk} ({prediction.churnScore}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-500">
                        {prediction.daysUntilNextPurchase > 0 
                          ? `~${prediction.daysUntilNextPurchase} days`
                          : <span className="text-red-500">Overdue</span>
                        }
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewDetails(prediction)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black"
                            title="View Details"
                          >
                            <ChartLineUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSendEmail(prediction.customer)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black"
                            title="Send Email"
                          >
                            <Envelope className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
