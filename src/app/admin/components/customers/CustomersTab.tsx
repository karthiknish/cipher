"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import {
  Brain,
  Users,
  TrendUp,
  TrendDown,
  ShoppingCart,
  Heart,
  Warning,
  Lightning,
  Target,
  ChartPie,
  UserCircle,
  Clock,
  CurrencyDollar,
  ArrowRight,
  Sparkle,
  CaretDown,
  CaretUp,
  Package,
  Star,
  ChartLineUp,
  ChartBar,
  UserList,
} from "@phosphor-icons/react";
import { 
  useCustomerBehavior, 
  CustomerSegment, 
  CustomerProfile, 
  BehaviorInsight,
  AggregatedInsights 
} from "@/context/CustomerBehaviorContext";
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

// Behavior Insights segment labels
const SEGMENT_LABELS: Record<CustomerSegment, { label: string; color: string; bgColor: string; description: string }> = {
  new_visitor: { label: "New Visitors", color: "text-sky-700", bgColor: "bg-sky-100", description: "First-time visitors" },
  returning_visitor: { label: "Returning Visitors", color: "text-indigo-700", bgColor: "bg-indigo-100", description: "Came back before" },
  engaged_browser: { label: "Engaged Browsers", color: "text-violet-700", bgColor: "bg-violet-100", description: "Active browsers" },
  cart_abandoner: { label: "Cart Abandoners", color: "text-amber-700", bgColor: "bg-amber-100", description: "Left cart" },
  first_time_buyer: { label: "First-Time Buyers", color: "text-emerald-700", bgColor: "bg-emerald-100", description: "First purchase" },
  repeat_customer: { label: "Repeat Customers", color: "text-teal-700", bgColor: "bg-teal-100", description: "2-4 purchases" },
  loyal_customer: { label: "Loyal Customers", color: "text-green-700", bgColor: "bg-green-100", description: "5+ purchases" },
  at_risk: { label: "At Risk", color: "text-orange-700", bgColor: "bg-orange-100", description: "Losing engagement" },
  dormant: { label: "Dormant", color: "text-rose-700", bgColor: "bg-rose-100", description: "Inactive 90+ days" },
};

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  conversion_opportunity: Target,
  churn_risk: Warning,
  upsell_opportunity: TrendUp,
  trending_product: ChartLineUp,
  declining_category: TrendDown,
  peak_time: Clock,
  cart_abandonment: ShoppingCart,
  search_pattern: Target,
  price_sensitivity: CurrencyDollar,
  engagement_drop: TrendDown,
};

type TabView = "overview" | "behavior";

export function CustomersTab({ metrics }: CustomersTabProps) {
  const [activeView, setActiveView] = useState<TabView>("overview");
  const [campaignModal, setCampaignModal] = useState<{
    isOpen: boolean;
    type: CampaignType;
    recipients: CustomerData[];
  }>({ isOpen: false, type: "win-back", recipients: [] });
  
  const [selectedCustomer, setSelectedCustomer] = useState<CLVPrediction | null>(null);
  const [showCLVDetails, setShowCLVDetails] = useState(false);

  // Behavior insights state
  const { getAggregatedInsights, getCustomersBySegment } = useCustomerBehavior();
  const [behaviorLoading, setBehaviorLoading] = useState(false);
  const [insights, setInsights] = useState<AggregatedInsights | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [segmentCustomers, setSegmentCustomers] = useState<CustomerProfile[]>([]);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Calculate CLV predictions for all customers
  const clvPredictions = metrics.customerData.map(customer => 
    calculateCLVPrediction(customer, metrics.customerData)
  );

  // Load behavior insights when switching to that view
  useEffect(() => {
    if (activeView === "behavior" && !insights) {
      loadBehaviorInsights();
    }
  }, [activeView]);

  const loadBehaviorInsights = async () => {
    setBehaviorLoading(true);
    try {
      const data = await getAggregatedInsights();
      setInsights(data);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setBehaviorLoading(false);
    }
  };

  const handleSegmentClick = async (segment: CustomerSegment) => {
    if (selectedSegment === segment) {
      setSelectedSegment(null);
      setSegmentCustomers([]);
      return;
    }
    
    setSelectedSegment(segment);
    setLoadingSegment(true);
    try {
      const customers = await getCustomersBySegment(segment);
      setSegmentCustomers(customers);
    } catch (error) {
      console.error("Error loading segment customers:", error);
    } finally {
      setLoadingSegment(false);
    }
  };

  const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return <TrendUp className="w-4 h-4 text-emerald-500" />;
      case "down": return <TrendDown className="w-4 h-4 text-rose-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-400" />;
    }
  };

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

  const totalSegmentCount = insights ? Object.values(insights.customerSegments).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("overview")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition rounded-lg ${
              activeView === "overview"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <UserList className="w-4 h-4" />
            Customer Overview
          </button>
          <button
            onClick={() => setActiveView("behavior")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition rounded-lg ${
              activeView === "behavior"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Brain className="w-4 h-4" />
            Behavior Insights
          </button>
        </div>
        
        {activeView === "behavior" && (
          <button 
            onClick={loadBehaviorInsights}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 hover:border-gray-300 transition rounded"
          >
            <Sparkle className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Overview View */}
      {activeView === "overview" && (
        <div className="space-y-8">
          <CLVOverview 
            clvPredictions={clvPredictions} 
            customerCount={metrics.customerData.length} 
          />

          <QuickActions
            dormantCustomers={metrics.customerSegments.dormant}
            vipCustomers={metrics.customerSegments.vip}
            atRiskCustomers={metrics.customerSegments.atRisk}
            onOpenCampaign={handleOpenCampaign}
          />

          <CustomerSegments customerSegments={metrics.customerSegments} />

          <CLVPredictionsTable
            clvPredictions={clvPredictions}
            onViewDetails={handleViewDetails}
            onSendEmail={openCampaignForCustomer}
          />

          <CustomerBehaviorCards
            vipCustomers={metrics.customerSegments.vip}
            atRiskCustomers={metrics.customerSegments.atRisk}
            clvPredictions={clvPredictions}
            onOpenCampaign={handleOpenCampaign}
            onSendEmailToCustomer={openCampaignForCustomer}
          />

          <AllCustomersTable
            customers={metrics.customerData}
            clvPredictions={clvPredictions}
            onSendEmail={openCampaignForCustomer}
          />
        </div>
      )}

      {/* Behavior Insights View */}
      {activeView === "behavior" && (
        <div className="space-y-8">
          {behaviorLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto text-gray-300 animate-pulse mb-4" />
                <p className="text-gray-500">Analyzing customer behavior...</p>
              </div>
            </div>
          ) : !insights ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
              <Brain className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Behavior Data Yet</h3>
              <p className="text-gray-500 text-sm">
                Customer behavior insights will appear as users interact with your store.
              </p>
            </div>
          ) : (
            <>
              {/* Behavior Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 p-5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-violet-600" />
                    <span className="text-sm text-gray-500">Tracked Users</span>
                  </div>
                  <p className="text-3xl font-semibold">{insights.totalCustomers.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{insights.activeCustomers} active this week</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-gray-200 p-5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-gray-500">Conversion Rate</span>
                  </div>
                  <p className="text-3xl font-semibold">{insights.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 mt-1">Visitors to buyers</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-gray-200 p-5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-gray-500">Cart Abandonment</span>
                  </div>
                  <p className="text-3xl font-semibold">{insights.cartAbandonmentRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 mt-1">Carts not completed</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-gray-200 p-5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollar className="w-5 h-5 text-sky-600" />
                    <span className="text-sm text-gray-500">Avg Order Value</span>
                  </div>
                  <p className="text-3xl font-semibold">${insights.averageOrderValue.toFixed(0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Per transaction</p>
                </motion.div>
              </div>

              {/* AI Insights */}
              {insights.insights.length > 0 && (
                <div className="bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-200 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightning className="w-5 h-5 text-violet-600" />
                    <h3 className="font-medium">AI-Generated Insights</h3>
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                      {insights.insights.length} insights
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {insights.insights.map((insight) => {
                      const Icon = INSIGHT_ICONS[insight.type] || Lightning;
                      const isExpanded = expandedInsight === insight.id;
                      
                      return (
                        <motion.div
                          key={insight.id}
                          layout
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                            className="w-full p-4 text-left flex items-start gap-3 hover:bg-gray-50 transition"
                          >
                            <div className={`p-2 rounded ${getImpactColor(insight.impact).split(" ").slice(0, 1).join(" ")}`}>
                              <Icon className={`w-5 h-5 ${getImpactColor(insight.impact).split(" ").slice(1, 2).join(" ")}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{insight.title}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded border ${getImpactColor(insight.impact)}`}>
                                  {insight.impact} impact
                                </span>
                                {getTrendIcon(insight.trend)}
                              </div>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-semibold">{insight.value}</span>
                              {isExpanded ? <CaretUp className="w-5 h-5 text-gray-400" /> : <CaretDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-gray-100"
                              >
                                <div className="p-4 bg-gray-50">
                                  <div className="flex items-start gap-2">
                                    <Sparkle className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendation</p>
                                      <p className="text-sm text-gray-600">{insight.recommendation}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                                    <span>Affects {insight.affectedCustomers} customers</span>
                                    <span>•</span>
                                    <span>Metric: {insight.metric}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Behavior Segments */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <ChartPie className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium">Behavior Segments</h3>
                  <span className="text-sm text-gray-400">({totalSegmentCount} tracked)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.entries(SEGMENT_LABELS) as [CustomerSegment, typeof SEGMENT_LABELS[CustomerSegment]][]).map(([segment, info]) => {
                    const count = insights.customerSegments[segment] || 0;
                    const percentage = totalSegmentCount > 0 ? ((count / totalSegmentCount) * 100).toFixed(1) : "0";
                    const isSelected = selectedSegment === segment;
                    
                    return (
                      <motion.button
                        key={segment}
                        onClick={() => handleSegmentClick(segment)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`p-4 border rounded-lg text-left transition ${
                          isSelected 
                            ? `${info.bgColor} border-2 ${info.color.replace("text", "border")}` 
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${info.bgColor} ${info.color}`}>
                            {info.label}
                          </span>
                          <span className="text-lg font-semibold">{count}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{info.description}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={`h-full ${info.bgColor.replace("100", "500")}`}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{percentage}% of total</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected Segment Details */}
                <AnimatePresence>
                  {selectedSegment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {SEGMENT_LABELS[selectedSegment].label} ({segmentCustomers.length})
                        </h4>
                        <button
                          onClick={() => { setSelectedSegment(null); setSegmentCustomers([]); }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </div>

                      {loadingSegment ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full" />
                        </div>
                      ) : segmentCustomers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No customers in this segment yet</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Customer</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Sessions</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Products Viewed</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Purchases</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Total Spent</th>
                                <th className="text-center py-2 px-3 font-medium text-gray-600">Risk</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {segmentCustomers.slice(0, 20).map(customer => (
                                <tr key={customer.userId} className="hover:bg-gray-50">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <UserCircle className="w-6 h-6 text-gray-300" />
                                      <span className="truncate max-w-32">{customer.email || customer.userId.slice(0, 8)}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right">{customer.totalSessions}</td>
                                  <td className="py-2 px-3 text-right">{customer.totalProductViews}</td>
                                  <td className="py-2 px-3 text-right">{customer.totalPurchases}</td>
                                  <td className="py-2 px-3 text-right font-medium">${customer.totalSpent.toFixed(0)}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      customer.churnRisk === "high" ? "bg-rose-100 text-rose-700" :
                                      customer.churnRisk === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                    }`}>
                                      {customer.churnRisk}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Top Categories */}
              {insights.topCategories.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium">Top Categories by Engagement</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.topCategories.map((category, i) => (
                      <div key={category.category} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-8 h-8 flex items-center justify-center bg-black text-white text-sm font-medium rounded">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-gray-500">{category.views.toLocaleString()} views</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-600">${category.revenue.toFixed(0)}</p>
                          <p className="text-xs text-gray-400">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Banner */}
              <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5" />
                  <h3 className="font-medium">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => handleOpenCampaign("win-back", metrics.customerSegments.dormant)}
                    className="p-4 bg-white/10 hover:bg-white/20 transition rounded-lg text-left"
                  >
                    <ShoppingCart className="w-6 h-6 mb-2" />
                    <p className="font-medium">Recover Abandoned Carts</p>
                    <p className="text-sm text-gray-400">{insights.customerSegments.cart_abandoner} carts waiting</p>
                  </button>
                  <button 
                    onClick={() => handleOpenCampaign("win-back", metrics.customerSegments.atRisk)}
                    className="p-4 bg-white/10 hover:bg-white/20 transition rounded-lg text-left"
                  >
                    <Heart className="w-6 h-6 mb-2" />
                    <p className="font-medium">Win Back At-Risk</p>
                    <p className="text-sm text-gray-400">{insights.customerSegments.at_risk + insights.customerSegments.dormant} to re-engage</p>
                  </button>
                  <button 
                    onClick={() => handleOpenCampaign("vip-exclusive", metrics.customerSegments.vip)}
                    className="p-4 bg-white/10 hover:bg-white/20 transition rounded-lg text-left"
                  >
                    <Star className="w-6 h-6 mb-2" />
                    <p className="font-medium">Reward Loyal Customers</p>
                    <p className="text-sm text-gray-400">{insights.customerSegments.loyal_customer} VIPs to nurture</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
