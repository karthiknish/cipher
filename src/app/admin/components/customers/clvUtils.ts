import { CustomerData } from "../types";
import { CLVPrediction } from "./types";

// Calculate CLV Prediction for a single customer
export function calculateCLVPrediction(customer: CustomerData, allCustomers: CustomerData[]): CLVPrediction {
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
    segmentColor = "bg-violet-100 text-violet-700";
  } else if (daysSinceLastOrder < 30 && customer.orders === 1) {
    segment = "New";
    segmentColor = "bg-emerald-100 text-emerald-700";
  } else if (daysSinceLastOrder >= 30 && daysSinceLastOrder < 90) {
    segment = "At Risk";
    segmentColor = "bg-amber-100 text-amber-700";
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

// Get segment info for a customer
export function getSegmentForCustomer(
  customer: CustomerData, 
  clvPredictions: CLVPrediction[]
): { segment: string; segmentColor: string } {
  const prediction = clvPredictions.find(p => p.customer.email === customer.email);
  if (prediction) {
    return { segment: prediction.segment, segmentColor: prediction.segmentColor };
  }
  return { segment: "Regular", segmentColor: "bg-gray-100 text-gray-700" };
}
