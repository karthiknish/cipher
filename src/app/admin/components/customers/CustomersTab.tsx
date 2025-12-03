"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CustomerData } from "../types";
import { CLVPrediction, CampaignType, CustomersTabProps } from "./types";
import { calculateCLVPrediction } from "./clvUtils";
import { CampaignModal } from "./CampaignModal";
import { CLVDetailsModal } from "./CLVDetailsModal";
import { CLVOverview } from "./CLVOverview";
import { QuickActions } from "./QuickActions";
import { CustomerSegments } from "./CustomerSegments";
import { CLVPredictionsTable } from "./CLVPredictionsTable";
import { CustomerBehaviorCards } from "./CustomerBehaviorCards";
import { AllCustomersTable } from "./AllCustomersTable";

export function CustomersTab({ metrics }: CustomersTabProps) {
  const [campaignModal, setCampaignModal] = useState<{
    isOpen: boolean;
    type: CampaignType;
    recipients: CustomerData[];
  }>({ isOpen: false, type: "win-back", recipients: [] });
  
  const [selectedCustomer, setSelectedCustomer] = useState<CLVPrediction | null>(null);
  const [showCLVDetails, setShowCLVDetails] = useState(false);

  // Calculate CLV predictions for all customers
  const clvPredictions = metrics.customerData.map(customer => 
    calculateCLVPrediction(customer, metrics.customerData)
  );

  const sendCampaign = async (type: CampaignType, emails: string[]) => {
    const response = await fetch("/api/email-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        recipients: emails.map(email => ({ email })),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send campaign");
    }

    return response.json();
  };

  const openCampaignForCustomer = (customer: CustomerData) => {
    const prediction = clvPredictions.find(p => p.customer.email === customer.email);
    let campaignType: CampaignType = "custom";
    
    if (prediction) {
      if (prediction.churnRisk === "high") {
        campaignType = "win-back";
      } else if (prediction.segment === "VIP") {
        campaignType = "vip-exclusive";
      } else if (prediction.churnRisk === "medium") {
        campaignType = "re-engagement";
      }
    }
    
    setCampaignModal({
      isOpen: true,
      type: campaignType,
      recipients: [customer],
    });
  };

  const handleOpenCampaign = (type: CampaignType, recipients: CustomerData[]) => {
    setCampaignModal({ isOpen: true, type, recipients });
  };

  const handleViewDetails = (prediction: CLVPrediction) => {
    setSelectedCustomer(prediction);
    setShowCLVDetails(true);
  };

  return (
    <div className="space-y-8">
      {/* CLV Predictions Overview */}
      <CLVOverview 
        clvPredictions={clvPredictions} 
        customerCount={metrics.customerData.length} 
      />

      {/* Quick Actions */}
      <QuickActions
        dormantCustomers={metrics.customerSegments.dormant}
        vipCustomers={metrics.customerSegments.vip}
        atRiskCustomers={metrics.customerSegments.atRisk}
        onOpenCampaign={handleOpenCampaign}
      />

      {/* Segment Overview */}
      <CustomerSegments customerSegments={metrics.customerSegments} />

      {/* CLV Predictions Table */}
      <CLVPredictionsTable
        clvPredictions={clvPredictions}
        onViewDetails={handleViewDetails}
        onSendEmail={openCampaignForCustomer}
      />

      {/* Customer Behavior Insights */}
      <CustomerBehaviorCards
        vipCustomers={metrics.customerSegments.vip}
        atRiskCustomers={metrics.customerSegments.atRisk}
        clvPredictions={clvPredictions}
        onOpenCampaign={handleOpenCampaign}
        onSendEmailToCustomer={openCampaignForCustomer}
      />

      {/* All Customers Table */}
      <AllCustomersTable
        customers={metrics.customerData}
        clvPredictions={clvPredictions}
        onSendEmail={openCampaignForCustomer}
      />

      {/* Campaign Modal */}
      <AnimatePresence>
        <CampaignModal
          isOpen={campaignModal.isOpen}
          onClose={() => setCampaignModal({ ...campaignModal, isOpen: false })}
          type={campaignModal.type}
          recipients={campaignModal.recipients}
          onSend={sendCampaign}
        />
      </AnimatePresence>

      {/* CLV Details Modal */}
      <AnimatePresence>
        <CLVDetailsModal
          prediction={selectedCustomer}
          isOpen={showCLVDetails}
          onClose={() => {
            setShowCLVDetails(false);
            setSelectedCustomer(null);
          }}
          onSendEmail={openCampaignForCustomer}
        />
      </AnimatePresence>
    </div>
  );
}
