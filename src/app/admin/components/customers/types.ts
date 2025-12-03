import { CustomerData, Metrics } from "../types";

// CLV Prediction Model
export interface CLVPrediction {
  customer: CustomerData;
  predictedCLV: number;
  churnRisk: "low" | "medium" | "high";
  churnScore: number;
  nextPurchaseProbability: number;
  daysUntilNextPurchase: number;
  recommendations: string[];
  segment: string;
  segmentColor: string;
}

// Email Campaign Types
export type CampaignType = "win-back" | "vip-exclusive" | "cart-abandonment" | "re-engagement" | "custom";

export interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CampaignType;
  recipients: CustomerData[];
  onSend: (type: CampaignType, recipients: string[]) => Promise<void>;
}

export interface CustomersTabProps {
  metrics: Metrics;
}

export type SortBy = "clv" | "churn" | "spent";
