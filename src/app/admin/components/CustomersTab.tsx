"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Star,
  Users,
  Lightning,
  Warning,
  Archive,
  Envelope,
  TrendUp,
  TrendDown,
  ChartLineUp,
  X,
  SpinnerGap,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretUp,
  Target,
  Wallet,
  Clock,
  PaperPlaneTilt,
  Sparkle,
} from "@phosphor-icons/react";
import { Metrics, CustomerData } from "./types";

interface CustomersTabProps {
  metrics: Metrics;
}

// CLV Prediction Model
interface CLVPrediction {
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
type CampaignType = "win-back" | "vip-exclusive" | "cart-abandonment" | "re-engagement" | "custom";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CampaignType;
  recipients: CustomerData[];
  onSend: (type: CampaignType, recipients: string[]) => Promise<void>;
}

// Calculate CLV Prediction
function calculateCLVPrediction(customer: CustomerData, allCustomers: CustomerData[]): CLVPrediction {
  const daysSinceLastOrder = Math.floor((Date.now() - customer.lastOrder) / (24 * 60 * 60 * 1000));
  
  // Calculate average purchase frequency (days between orders)
  const avgPurchaseFrequency = customer.orders > 1 
    ? 365 / customer.orders // Simplified: assume orders spread over a year
    : 90; // Default for single-order customers
  
  // Churn scoring (0-100, higher = more likely to churn)
  let churnScore = 0;
  if (daysSinceLastOrder > 90) churnScore += 40;
  else if (daysSinceLastOrder > 60) churnScore += 25;
  else if (daysSinceLastOrder > 30) churnScore += 10;
  
  if (customer.orders === 1) churnScore += 30;
  else if (customer.orders === 2) churnScore += 15;
  
  if (customer.avgOrderValue < 50) churnScore += 15;
  else if (customer.avgOrderValue > 150) churnScore -= 10;
  
  churnScore = Math.max(0, Math.min(100, churnScore));
  
  const churnRisk: "low" | "medium" | "high" = 
    churnScore < 30 ? "low" : churnScore < 60 ? "medium" : "high";
  
  // Next purchase probability (inverse of churn)
  const nextPurchaseProbability = Math.max(0, 100 - churnScore);
  
  // Predicted days until next purchase
  const daysUntilNextPurchase = Math.max(
    0, 
    Math.round(avgPurchaseFrequency - daysSinceLastOrder)
  );
  
  // Calculate predicted CLV (12-month projection)
  // CLV = (Avg Order Value × Purchase Frequency × Retention Rate)
  const retentionRate = (100 - churnScore) / 100;
  const monthlyPurchases = 12 / avgPurchaseFrequency;
  const predictedCLV = Math.round(
    customer.avgOrderValue * monthlyPurchases * 12 * retentionRate
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (churnRisk === "high") {
    recommendations.push("Send win-back email with 25% discount");
    recommendations.push("Offer free shipping on next order");
  } else if (churnRisk === "medium") {
    recommendations.push("Send personalized product recommendations");
    recommendations.push("Invite to loyalty program");
  }
  
  if (customer.avgOrderValue < 100) {
    recommendations.push("Suggest bundle deals to increase order value");
  }
  
  if (customer.totalSpent > 500) {
    recommendations.push("Upgrade to VIP tier with exclusive perks");
  }
  
  if (daysSinceLastOrder > 60 && customer.orders > 1) {
    recommendations.push("Re-engagement email with 'new arrivals' focus");
  }
  
  // Determine segment
  let segment = "Regular";
  let segmentColor = "bg-gray-100 text-gray-700";
  
  if (customer.totalSpent >= 500 || customer.orders >= 5) {
    segment = "VIP";
    segmentColor = "bg-amber-100 text-amber-700";
  } else if (customer.orders >= 3 && daysSinceLastOrder < 60) {
    segment = "Loyal";
    segmentColor = "bg-purple-100 text-purple-700";
  } else if (daysSinceLastOrder < 30 && customer.orders === 1) {
    segment = "New";
    segmentColor = "bg-green-100 text-green-700";
  } else if (daysSinceLastOrder >= 30 && daysSinceLastOrder < 90) {
    segment = "At Risk";
    segmentColor = "bg-orange-100 text-orange-700";
  } else if (daysSinceLastOrder >= 90) {
    segment = "Dormant";
    segmentColor = "bg-gray-100 text-gray-500";
  }
  
  return {
    customer,
    predictedCLV,
    churnRisk,
    churnScore,
    nextPurchaseProbability,
    daysUntilNextPurchase,
    recommendations,
    segment,
    segmentColor,
  };
}

// Campaign Modal Component
function CampaignModal({ isOpen, onClose, type, recipients, onSend }: CampaignModalProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const campaignInfo: Record<CampaignType, { title: string; description: string; defaultSubject: string }> = {
    "win-back": {
      title: "Win-Back Campaign",
      description: "Send a special offer to bring dormant customers back",
      defaultSubject: "We miss you! Here's 20% off your next order",
    },
    "vip-exclusive": {
      title: "VIP Exclusive Access",
      description: "Give VIP customers early access to new collections",
      defaultSubject: "VIP Early Access: New Collection Drops Tomorrow",
    },
    "cart-abandonment": {
      title: "Cart Abandonment Recovery",
      description: "Remind customers about their abandoned carts",
      defaultSubject: "Did you forget something? Your cart is waiting",
    },
    "re-engagement": {
      title: "Re-Engagement Campaign",
      description: "Reconnect with customers who haven't purchased recently",
      defaultSubject: "A lot has changed since you've been away",
    },
    "custom": {
      title: "Custom Campaign",
      description: "Send a custom message to selected customers",
      defaultSubject: "",
    },
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await onSend(type, recipients.map(r => r.email));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

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
        className="bg-white w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight">{campaignInfo[type].title}</h2>
              <p className="text-sm text-gray-500 mt-1">{campaignInfo[type].description}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
              </div>
              <h3 className="text-lg font-medium mb-2">Campaign Sent!</h3>
              <p className="text-gray-500">
                Successfully sent to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={onClose}
                className="mt-6 bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-800"
              >
                CLOSE
              </button>
            </div>
          ) : (
            <>
              {/* Recipients Preview */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">
                  RECIPIENTS ({recipients.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1">
                  {recipients.slice(0, 5).map((r, i) => (
                    <p key={i} className="text-sm text-gray-600">{r.email}</p>
                  ))}
                  {recipients.length > 5 && (
                    <p className="text-sm text-gray-400">+{recipients.length - 5} more</p>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">SUBJECT LINE</label>
                <input
                  type="text"
                  value={customSubject || campaignInfo[type].defaultSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
                  placeholder="Email subject..."
                />
              </div>

              {type === "custom" && (
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">MESSAGE</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none resize-none"
                    placeholder="Your message..."
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <XCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" />
                    SENDING...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="w-4 h-4" />
                    SEND CAMPAIGN
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// CLV Details Modal
function CLVDetailsModal({ 
  prediction, 
  isOpen, 
  onClose,
  onSendEmail 
}: { 
  prediction: CLVPrediction | null; 
  isOpen: boolean; 
  onClose: () => void;
  onSendEmail: (customer: CustomerData) => void;
}) {
  if (!isOpen || !prediction) return null;

  const { customer, predictedCLV, churnRisk, churnScore, nextPurchaseProbability, daysUntilNextPurchase, recommendations, segment, segmentColor } = prediction;

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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">PREDICTED CLV</span>
              </div>
              <p className="text-2xl font-medium text-green-700">${predictedCLV}</p>
              <p className="text-xs text-green-600 mt-1">12-month projection</p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              churnRisk === "high" ? "bg-red-50 border-red-100" :
              churnRisk === "medium" ? "bg-amber-50 border-amber-100" :
              "bg-green-50 border-green-100"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Warning className={`w-4 h-4 ${
                  churnRisk === "high" ? "text-red-600" :
                  churnRisk === "medium" ? "text-amber-600" :
                  "text-green-600"
                }`} />
                <span className={`text-xs font-medium ${
                  churnRisk === "high" ? "text-red-600" :
                  churnRisk === "medium" ? "text-amber-600" :
                  "text-green-600"
                }`}>CHURN RISK</span>
              </div>
              <p className={`text-2xl font-medium capitalize ${
                churnRisk === "high" ? "text-red-700" :
                churnRisk === "medium" ? "text-amber-700" :
                "text-green-700"
              }`}>{churnRisk}</p>
              <p className="text-xs text-gray-500 mt-1">{churnScore}% score</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">PURCHASE PROB.</span>
              </div>
              <p className="text-2xl font-medium text-blue-700">{nextPurchaseProbability}%</p>
              <p className="text-xs text-blue-600 mt-1">Next 30 days</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">NEXT PURCHASE</span>
              </div>
              <p className="text-2xl font-medium text-purple-700">
                {daysUntilNextPurchase > 0 ? `${daysUntilNextPurchase}d` : "Overdue"}
              </p>
              <p className="text-xs text-purple-600 mt-1">Expected in</p>
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
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkle className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-purple-900">AI Retention Recommendations</h4>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChartLineUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-purple-800">{rec}</span>
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

export function CustomersTab({ metrics }: CustomersTabProps) {
  const [campaignModal, setCampaignModal] = useState<{
    isOpen: boolean;
    type: CampaignType;
    recipients: CustomerData[];
  }>({ isOpen: false, type: "win-back", recipients: [] });
  
  const [selectedCustomer, setSelectedCustomer] = useState<CLVPrediction | null>(null);
  const [showCLVDetails, setShowCLVDetails] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("predictions");
  const [sortBy, setSortBy] = useState<"clv" | "churn" | "spent">("clv");

  // Calculate CLV predictions for all customers
  const clvPredictions = metrics.customerData.map(customer => 
    calculateCLVPrediction(customer, metrics.customerData)
  );

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

  // Aggregate stats
  const totalPredictedCLV = clvPredictions.reduce((sum, p) => sum + p.predictedCLV, 0);
  const highChurnCount = clvPredictions.filter(p => p.churnRisk === "high").length;
  const avgChurnScore = clvPredictions.length > 0 
    ? Math.round(clvPredictions.reduce((sum, p) => sum + p.churnScore, 0) / clvPredictions.length)
    : 0;

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

  const getSegmentForCustomer = (customer: CustomerData): { segment: string; segmentColor: string } => {
    const prediction = clvPredictions.find(p => p.customer.email === customer.email);
    if (prediction) {
      return { segment: prediction.segment, segmentColor: prediction.segmentColor };
    }
    return { segment: "Regular", segmentColor: "bg-gray-100 text-gray-700" };
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

  return (
    <div className="space-y-8">
      {/* CLV Predictions Overview */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ChartLineUp className="w-5 h-5" />
              Customer Lifetime Value Predictions
            </h3>
            <p className="text-white/60 text-sm mt-1">AI-powered analytics for your customer base</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <p className="text-white/60 text-xs mb-1">TOTAL PREDICTED CLV</p>
            <p className="text-3xl font-light">${totalPredictedCLV.toLocaleString()}</p>
            <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
              <TrendUp className="w-3 h-3" /> 12-month projection
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <p className="text-white/60 text-xs mb-1">AVG CLV PER CUSTOMER</p>
            <p className="text-3xl font-light">
              ${metrics.customerData.length > 0 
                ? Math.round(totalPredictedCLV / metrics.customerData.length).toLocaleString() 
                : 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <p className="text-white/60 text-xs mb-1">HIGH CHURN RISK</p>
            <p className="text-3xl font-light text-red-400">{highChurnCount}</p>
            <p className="text-red-400 text-xs mt-1">Needs attention</p>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <p className="text-white/60 text-xs mb-1">AVG CHURN SCORE</p>
            <p className="text-3xl font-light">{avgChurnScore}%</p>
            <p className={`text-xs mt-1 ${avgChurnScore < 40 ? "text-green-400" : avgChurnScore < 60 ? "text-amber-400" : "text-red-400"}`}>
              {avgChurnScore < 40 ? "Healthy" : avgChurnScore < 60 ? "Moderate" : "At Risk"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => setCampaignModal({
            isOpen: true,
            type: "win-back",
            recipients: metrics.customerSegments.dormant,
          })}
          disabled={metrics.customerSegments.dormant.length === 0}
          className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-lg">
              <Archive className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">Win-Back Campaign</p>
              <p className="text-xs text-gray-500">{metrics.customerSegments.dormant.length} dormant customers</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCampaignModal({
            isOpen: true,
            type: "vip-exclusive",
            recipients: metrics.customerSegments.vip,
          })}
          disabled={metrics.customerSegments.vip.length === 0}
          className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 flex items-center justify-center rounded-lg">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">VIP Exclusive Access</p>
              <p className="text-xs text-gray-500">{metrics.customerSegments.vip.length} VIP customers</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCampaignModal({
            isOpen: true,
            type: "re-engagement",
            recipients: metrics.customerSegments.atRisk,
          })}
          disabled={metrics.customerSegments.atRisk.length === 0}
          className="bg-white border border-gray-200 p-4 text-left hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 flex items-center justify-center rounded-lg">
              <Warning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Re-Engagement Campaign</p>
              <p className="text-xs text-gray-500">{metrics.customerSegments.atRisk.length} at-risk customers</p>
            </div>
          </div>
        </button>
      </div>

      {/* Segment Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: "vip", label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", description: "$500+ spent or 5+ orders" },
          { key: "loyal", label: "Loyal", icon: Star, color: "bg-purple-100 text-purple-700", description: "3+ orders, active" },
          { key: "regular", label: "Regular", icon: Users, color: "bg-blue-100 text-blue-700", description: "2+ orders" },
          { key: "newCustomers", label: "New", icon: Lightning, color: "bg-green-100 text-green-700", description: "First order <30d" },
          { key: "atRisk", label: "At Risk", icon: Warning, color: "bg-orange-100 text-orange-700", description: "30-90d inactive" },
          { key: "dormant", label: "Dormant", icon: Archive, color: "bg-gray-100 text-gray-700", description: "90d+ inactive" },
        ].map(segment => (
          <motion.div
            key={segment.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 border border-gray-200 ${segment.color.split(" ")[0]}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <segment.icon className={`w-4 h-4 ${segment.color.split(" ")[1]}`} />
              <span className={`text-xs font-medium ${segment.color.split(" ")[1]}`}>{segment.label}</span>
            </div>
            <p className="text-2xl font-medium">
              {metrics.customerSegments[segment.key as keyof typeof metrics.customerSegments].length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
          </motion.div>
        ))}
      </div>

      {/* CLV Predictions Table */}
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
                              onClick={() => {
                                setSelectedCustomer(prediction);
                                setShowCLVDetails(true);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black"
                              title="View Details"
                            >
                              <ChartLineUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openCampaignForCustomer(prediction.customer)}
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

      {/* Customer Behavior Insights */}
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
              onClick={() => setCampaignModal({
                isOpen: true,
                type: "vip-exclusive",
                recipients: metrics.customerSegments.vip,
              })}
              disabled={metrics.customerSegments.vip.length === 0}
              className="text-xs tracking-wider text-black hover:underline disabled:opacity-50"
            >
              SEND VIP EMAIL
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.customerSegments.vip.length > 0 ? (
              metrics.customerSegments.vip.slice(0, 5).map((customer, i) => {
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
                        onClick={() => openCampaignForCustomer(customer)}
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
                <Warning className="w-5 h-5 text-orange-500" />
                At-Risk Customers
              </h3>
              <p className="text-xs text-gray-500 mt-1">Haven&apos;t ordered in 30-90 days</p>
            </div>
            <button 
              onClick={() => setCampaignModal({
                isOpen: true,
                type: "re-engagement",
                recipients: metrics.customerSegments.atRisk,
              })}
              disabled={metrics.customerSegments.atRisk.length === 0}
              className="bg-orange-500 text-white px-3 py-1.5 text-xs tracking-wider hover:bg-orange-600 transition disabled:opacity-50"
            >
              SEND CAMPAIGN
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.customerSegments.atRisk.length > 0 ? (
              metrics.customerSegments.atRisk.slice(0, 5).map((customer, i) => {
                const prediction = clvPredictions.find(p => p.customer.email === customer.email);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100">
                    <div>
                      <p className="text-sm font-medium">{customer.email}</p>
                      <p className="text-xs text-gray-500">
                        Last order: {Math.floor((Date.now() - customer.lastOrder) / (24 * 60 * 60 * 1000))}d ago
                        · Churn: {prediction?.churnScore || 0}%
                      </p>
                    </div>
                    <button 
                      onClick={() => openCampaignForCustomer(customer)}
                      className="p-2 hover:bg-orange-100 transition"
                    >
                      <Envelope className="w-4 h-4 text-orange-600" />
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

      {/* All Customers Table */}
      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-medium">All Customers</h3>
          <p className="text-xs text-gray-500 mt-1">{metrics.customerData.length} total customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">EMAIL</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ORDERS</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">TOTAL SPENT</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">AVG ORDER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">LAST ORDER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">SEGMENT</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.customerData.slice(0, 10).map((customer, i) => {
                const { segment, segmentColor } = getSegmentForCustomer(customer);

                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-6 text-sm">{customer.email}</td>
                    <td className="py-3 px-6 text-sm">{customer.orders}</td>
                    <td className="py-3 px-6 text-sm font-medium">${customer.totalSpent.toFixed(0)}</td>
                    <td className="py-3 px-6 text-sm">${customer.avgOrderValue.toFixed(0)}</td>
                    <td className="py-3 px-6 text-sm text-gray-500">
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 text-xs ${segmentColor}`}>{segment}</span>
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => openCampaignForCustomer(customer)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Envelope className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
