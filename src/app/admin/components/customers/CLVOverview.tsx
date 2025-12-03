"use client";
import { ChartLineUp, TrendUp } from "@phosphor-icons/react";
import { CLVPrediction } from "./types";

interface CLVOverviewProps {
  clvPredictions: CLVPrediction[];
  customerCount: number;
}

export function CLVOverview({ clvPredictions, customerCount }: CLVOverviewProps) {
  const totalPredictedCLV = clvPredictions.reduce((sum, p) => sum + p.predictedCLV, 0);
  const highChurnCount = clvPredictions.filter(p => p.churnRisk === "high").length;
  const avgChurnScore = clvPredictions.length > 0 
    ? Math.round(clvPredictions.reduce((sum, p) => sum + p.churnScore, 0) / clvPredictions.length)
    : 0;

  return (
    <div className="border border-gray-200 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ChartLineUp className="w-5 h-5" />
            Customer Lifetime Value Predictions
          </h3>
          <p className="text-gray-500 text-sm mt-1">AI-powered analytics for your customer base</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-xs mb-1">TOTAL PREDICTED CLV</p>
          <p className="text-3xl font-light">${totalPredictedCLV.toLocaleString()}</p>
          <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
            <TrendUp className="w-3 h-3" /> 12-month projection
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-xs mb-1">AVG CLV PER CUSTOMER</p>
          <p className="text-3xl font-light">
            ${customerCount > 0 
              ? Math.round(totalPredictedCLV / customerCount).toLocaleString() 
              : 0}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-xs mb-1">HIGH CHURN RISK</p>
          <p className="text-3xl font-light text-rose-600">{highChurnCount}</p>
          <p className="text-rose-600 text-xs mt-1">Needs attention</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-xs mb-1">AVG CHURN SCORE</p>
          <p className="text-3xl font-light">{avgChurnScore}%</p>
          <p className={`text-xs mt-1 ${avgChurnScore < 40 ? "text-emerald-600" : avgChurnScore < 60 ? "text-amber-600" : "text-rose-600"}`}>
            {avgChurnScore < 40 ? "Healthy" : avgChurnScore < 60 ? "Moderate" : "At Risk"}
          </p>
        </div>
      </div>
    </div>
  );
}
