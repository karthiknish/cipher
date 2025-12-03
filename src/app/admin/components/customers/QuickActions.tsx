"use client";
import { Crown, Warning, Archive } from "@phosphor-icons/react";
import { CustomerData } from "../types";
import { CampaignType } from "./types";

interface QuickActionsProps {
  dormantCustomers: CustomerData[];
  vipCustomers: CustomerData[];
  atRiskCustomers: CustomerData[];
  onOpenCampaign: (type: CampaignType, recipients: CustomerData[]) => void;
}

export function QuickActions({ 
  dormantCustomers, 
  vipCustomers, 
  atRiskCustomers, 
  onOpenCampaign 
}: QuickActionsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <button
        onClick={() => onOpenCampaign("win-back", dormantCustomers)}
        disabled={dormantCustomers.length === 0}
        className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 flex items-center justify-center rounded-lg">
            <Archive className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium">Win-Back Campaign</p>
            <p className="text-xs text-gray-500">{dormantCustomers.length} dormant customers</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onOpenCampaign("vip-exclusive", vipCustomers)}
        disabled={vipCustomers.length === 0}
        className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 flex items-center justify-center rounded-lg">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium">VIP Exclusive Access</p>
            <p className="text-xs text-gray-500">{vipCustomers.length} VIP customers</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onOpenCampaign("re-engagement", atRiskCustomers)}
        disabled={atRiskCustomers.length === 0}
        className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-lg">
            <Warning className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-medium">Re-Engagement Campaign</p>
            <p className="text-xs text-gray-500">{atRiskCustomers.length} at-risk customers</p>
          </div>
        </div>
      </button>
    </div>
  );
}
