"use client";
import { Crown, Warning, Envelope } from "@phosphor-icons/react";
import { CustomerData } from "../types";
import { CLVPrediction, CampaignType } from "./types";

interface CustomerBehaviorCardsProps {
  vipCustomers: CustomerData[];
  atRiskCustomers: CustomerData[];
  clvPredictions: CLVPrediction[];
  onOpenCampaign: (type: CampaignType, recipients: CustomerData[]) => void;
  onSendEmailToCustomer: (customer: CustomerData) => void;
}

export function CustomerBehaviorCards({ 
  vipCustomers, 
  atRiskCustomers, 
  clvPredictions,
  onOpenCampaign,
  onSendEmailToCustomer 
}: CustomerBehaviorCardsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* VIP Customers */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              VIP Customers
            </h3>
            <p className="text-xs text-gray-500 mt-1">Your most valuable customers</p>
          </div>
          <button 
            onClick={() => onOpenCampaign("vip-exclusive", vipCustomers)}
            disabled={vipCustomers.length === 0}
            className="text-xs tracking-wider text-black hover:underline disabled:opacity-50"
          >
            SEND VIP EMAIL
          </button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {vipCustomers.length > 0 ? (
            vipCustomers.slice(0, 5).map((customer, i) => {
              const prediction = clvPredictions.find(p => p.customer.email === customer.email);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium">{customer.email}</p>
                    <p className="text-xs text-gray-500">
                      {customer.orders} orders · Predicted CLV: ${prediction?.predictedCLV || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-700">${customer.totalSpent.toFixed(0)}</p>
                    <button
                      onClick={() => onSendEmailToCustomer(customer)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-8">No VIP customers yet</p>
          )}
        </div>
      </div>

      {/* At-Risk Customers */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Warning className="w-5 h-5 text-amber-500" />
              At-Risk Customers
            </h3>
            <p className="text-xs text-gray-500 mt-1">Haven&apos;t ordered in 30-90 days</p>
          </div>
          <button 
            onClick={() => onOpenCampaign("re-engagement", atRiskCustomers)}
            disabled={atRiskCustomers.length === 0}
            className="bg-amber-500 text-white px-3 py-1.5 text-xs tracking-wider hover:bg-amber-600 transition disabled:opacity-50"
          >
            SEND CAMPAIGN
          </button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {atRiskCustomers.length > 0 ? (
            atRiskCustomers.slice(0, 5).map((customer, i) => {
              const prediction = clvPredictions.find(p => p.customer.email === customer.email);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium">{customer.email}</p>
                    <p className="text-xs text-gray-500">
                      Last order: {Math.floor((Date.now() - customer.lastOrder) / (24 * 60 * 60 * 1000))}d ago
                      · Churn: {prediction?.churnScore || 0}%
                    </p>
                  </div>
                  <button 
                    onClick={() => onSendEmailToCustomer(customer)}
                    className="p-2 hover:bg-amber-100 transition"
                  >
                    <Envelope className="w-4 h-4 text-amber-600" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-8">No at-risk customers</p>
          )}
        </div>
      </div>
    </div>
  );
}
