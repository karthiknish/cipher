"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { db, collection, doc, setDoc, getDoc, serverTimestamp, firebaseConfigured } from "@/lib/firebase";
import { onSnapshot, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";

// ============================================
// Types
// ============================================

export interface BrowsingSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  pagesViewed: string[];
  productsViewed: string[];
  searchQueries: string[];
  cartActions: CartAction[];
  device: string;
  source?: string;
}

export interface CartAction {
  action: "add" | "remove" | "update";
  productId: string;
  productName: string;
  quantity: number;
  timestamp: Date;
}

export interface CustomerProfile {
  userId: string;
  email?: string;
  firstSeen: Date;
  lastSeen: Date;
  totalSessions: number;
  totalPageViews: number;
  totalProductViews: number;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: CategoryPreference[];
  browsedProducts: ProductInteraction[];
  purchasedProducts: string[];
  abandonedCarts: number;
  conversionRate: number;
  customerSegment: CustomerSegment;
  behaviorScore: number;
  predictedNextPurchase?: Date;
  churnRisk: "low" | "medium" | "high";
  lifetimeValueTier: "bronze" | "silver" | "gold" | "platinum";
}

export interface CategoryPreference {
  category: string;
  views: number;
  purchases: number;
  score: number;
}

export interface ProductInteraction {
  productId: string;
  productName: string;
  category: string;
  views: number;
  lastViewed: Date;
  addedToCart: boolean;
  purchased: boolean;
  timeSpent: number; // seconds
}

export type CustomerSegment = 
  | "new_visitor"
  | "returning_visitor"
  | "engaged_browser"
  | "cart_abandoner"
  | "first_time_buyer"
  | "repeat_customer"
  | "loyal_customer"
  | "at_risk"
  | "dormant";

export interface BehaviorInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  metric: string;
  value: number;
  change?: number;
  trend: "up" | "down" | "stable";
  recommendation: string;
  affectedCustomers: number;
  generatedAt: Date;
}

export type InsightType = 
  | "conversion_opportunity"
  | "churn_risk"
  | "upsell_opportunity"
  | "trending_product"
  | "declining_category"
  | "peak_time"
  | "cart_abandonment"
  | "search_pattern"
  | "price_sensitivity"
  | "engagement_drop";

export interface PurchasePrediction {
  userId: string;
  predictedProducts: Array<{
    productId: string;
    productName: string;
    probability: number;
    recommendedAt: Date;
  }>;
  predictedNextPurchaseDate: Date;
  confidence: number;
}

export interface AggregatedInsights {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; views: number; conversions: number }>;
  topCategories: Array<{ category: string; views: number; revenue: number }>;
  customerSegments: Record<CustomerSegment, number>;
  peakHours: Array<{ hour: number; sessions: number }>;
  deviceDistribution: Record<string, number>;
  trafficSources: Record<string, number>;
  searchTerms: Array<{ term: string; count: number; conversions: number }>;
  insights: BehaviorInsight[];
}

interface CustomerBehaviorContextType {
  // Customer profile
  currentProfile: CustomerProfile | null;
  loading: boolean;
  
  // Tracking
  trackProductView: (productId: string, productName: string, category: string) => void;
  trackSearch: (query: string) => void;
  trackCartAction: (action: CartAction["action"], productId: string, productName: string, quantity: number) => void;
  trackPageTime: (pagePath: string, timeSpent: number) => void;
  trackCheckoutStep: (step: string) => void;
  
  // Profile management
  getCustomerProfile: (userId: string) => Promise<CustomerProfile | null>;
  updateCustomerSegment: (userId: string) => Promise<CustomerSegment>;
  
  // Insights & Analytics (Admin)
  getAggregatedInsights: () => Promise<AggregatedInsights>;
  generateInsights: () => Promise<BehaviorInsight[]>;
  getPurchasePredictions: (userId: string) => Promise<PurchasePrediction | null>;
  
  // Customer segments
  getCustomersBySegment: (segment: CustomerSegment) => Promise<CustomerProfile[]>;
  
  // Real-time behavior
  getRecentBehavior: (limit?: number) => Promise<BrowsingSession[]>;
}

// ============================================
// Context
// ============================================

const CustomerBehaviorContext = createContext<CustomerBehaviorContextType | undefined>(undefined);

export function useCustomerBehavior(): CustomerBehaviorContextType {
  const context = useContext(CustomerBehaviorContext);
  if (!context) {
    throw new Error("useCustomerBehavior must be used within CustomerBehaviorProvider");
  }
  return context;
}

// ============================================
// Analysis Algorithms
// ============================================

function calculateBehaviorScore(profile: Partial<CustomerProfile>): number {
  let score = 0;
  
  // Recency (last seen within days)
  const daysSinceLastSeen = profile.lastSeen 
    ? (Date.now() - new Date(profile.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  if (daysSinceLastSeen <= 1) score += 30;
  else if (daysSinceLastSeen <= 7) score += 25;
  else if (daysSinceLastSeen <= 30) score += 15;
  else if (daysSinceLastSeen <= 90) score += 5;
  
  // Frequency (sessions)
  const sessions = profile.totalSessions || 0;
  if (sessions >= 20) score += 25;
  else if (sessions >= 10) score += 20;
  else if (sessions >= 5) score += 15;
  else if (sessions >= 2) score += 10;
  else score += 5;
  
  // Monetary (total spent)
  const spent = profile.totalSpent || 0;
  if (spent >= 1000) score += 30;
  else if (spent >= 500) score += 25;
  else if (spent >= 200) score += 20;
  else if (spent >= 50) score += 10;
  
  // Engagement (product views / page views ratio)
  const viewRatio = (profile.totalProductViews || 0) / Math.max(profile.totalPageViews || 1, 1);
  if (viewRatio >= 0.5) score += 15;
  else if (viewRatio >= 0.3) score += 10;
  else if (viewRatio >= 0.1) score += 5;
  
  return Math.min(score, 100);
}

function determineSegment(profile: Partial<CustomerProfile>): CustomerSegment {
  const purchases = profile.totalPurchases || 0;
  const sessions = profile.totalSessions || 0;
  const daysSinceLastSeen = profile.lastSeen 
    ? (Date.now() - new Date(profile.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const abandonedCarts = profile.abandonedCarts || 0;
  const spent = profile.totalSpent || 0;
  
  // Dormant - no activity in 90+ days
  if (daysSinceLastSeen > 90 && purchases > 0) return "dormant";
  
  // At risk - previous customer, no purchase in 60+ days
  if (daysSinceLastSeen > 60 && purchases > 0) return "at_risk";
  
  // Loyal customer - 5+ purchases, recent activity
  if (purchases >= 5 && daysSinceLastSeen <= 30) return "loyal_customer";
  
  // Repeat customer - 2-4 purchases
  if (purchases >= 2 && purchases < 5) return "repeat_customer";
  
  // First time buyer - exactly 1 purchase
  if (purchases === 1) return "first_time_buyer";
  
  // Cart abandoner - multiple abandoned carts, no purchase
  if (abandonedCarts >= 2 && purchases === 0) return "cart_abandoner";
  
  // Engaged browser - multiple sessions, product views, no purchase
  if (sessions >= 3 && profile.totalProductViews && profile.totalProductViews >= 10 && purchases === 0) {
    return "engaged_browser";
  }
  
  // Returning visitor - 2+ sessions
  if (sessions >= 2) return "returning_visitor";
  
  // New visitor
  return "new_visitor";
}

function calculateChurnRisk(profile: Partial<CustomerProfile>): "low" | "medium" | "high" {
  const daysSinceLastSeen = profile.lastSeen 
    ? (Date.now() - new Date(profile.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const purchases = profile.totalPurchases || 0;
  const behaviorScore = profile.behaviorScore || 0;
  
  if (purchases === 0) return "low"; // Can't churn if never purchased
  
  if (daysSinceLastSeen > 60 || behaviorScore < 30) return "high";
  if (daysSinceLastSeen > 30 || behaviorScore < 50) return "medium";
  return "low";
}

function calculateLifetimeTier(spent: number): "bronze" | "silver" | "gold" | "platinum" {
  if (spent >= 1000) return "platinum";
  if (spent >= 500) return "gold";
  if (spent >= 200) return "silver";
  return "bronze";
}

function predictNextPurchase(profile: Partial<CustomerProfile>): Date | undefined {
  const purchases = profile.totalPurchases || 0;
  if (purchases < 2) return undefined;
  
  // Simple prediction based on average purchase frequency
  const firstSeen = profile.firstSeen ? new Date(profile.firstSeen).getTime() : Date.now();
  const daysSinceFirst = (Date.now() - firstSeen) / (1000 * 60 * 60 * 24);
  const avgDaysBetweenPurchases = daysSinceFirst / purchases;
  
  const lastSeen = profile.lastSeen ? new Date(profile.lastSeen).getTime() : Date.now();
  const predictedDate = new Date(lastSeen + avgDaysBetweenPurchases * 24 * 60 * 60 * 1000);
  
  return predictedDate;
}

// ============================================
// Provider
// ============================================

export function CustomerBehaviorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionRef = useRef<BrowsingSession | null>(null);
  const productViewTimesRef = useRef<Map<string, number>>(new Map());
  
  // Initialize session
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionRef.current = {
      sessionId,
      userId: user?.uid,
      startTime: new Date(),
      pagesViewed: [],
      productsViewed: [],
      searchQueries: [],
      cartActions: [],
      device: getDeviceType(),
      source: getTrafficSource(),
    };
    
    // Save session start to Firestore
    if (firebaseConfigured) {
      const sessionDoc = doc(db, "customerBehavior", "sessions", "active", sessionId);
      // Filter out undefined values - Firestore doesn't accept them
      const sessionData: Record<string, unknown> = {
        sessionId: sessionRef.current.sessionId,
        startTime: serverTimestamp(),
        pagesViewed: sessionRef.current.pagesViewed,
        productsViewed: sessionRef.current.productsViewed,
        searchQueries: sessionRef.current.searchQueries,
        cartActions: sessionRef.current.cartActions,
        device: sessionRef.current.device,
      };
      if (user?.uid) sessionData.userId = user.uid;
      if (sessionRef.current.source) sessionData.source = sessionRef.current.source;
      
      setDoc(sessionDoc, sessionData).catch(console.error);
    }
    
    // Cleanup on unmount
    return () => {
      if (sessionRef.current && firebaseConfigured) {
        const endSession = async () => {
          const sessionDoc = doc(db, "customerBehavior", "sessions", "completed", sessionRef.current!.sessionId);
          const endData: Record<string, unknown> = {
            sessionId: sessionRef.current!.sessionId,
            endTime: serverTimestamp(),
            pagesViewed: sessionRef.current!.pagesViewed,
            productsViewed: sessionRef.current!.productsViewed,
            searchQueries: sessionRef.current!.searchQueries,
            cartActions: sessionRef.current!.cartActions,
            device: sessionRef.current!.device,
          };
          if (sessionRef.current!.userId) endData.userId = sessionRef.current!.userId;
          if (sessionRef.current!.source) endData.source = sessionRef.current!.source;
          
          await setDoc(sessionDoc, endData).catch(console.error);
        };
        endSession();
      }
    };
  }, [user?.uid]);
  
  // Load current user profile
  useEffect(() => {
    if (!user?.uid || !firebaseConfigured) {
      setCurrentProfile(null);
      setLoading(false);
      return;
    }
    
    const profileRef = doc(db, "customerBehavior", "profiles", "users", user.uid);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentProfile({
          ...data,
          userId: user.uid,
          firstSeen: data.firstSeen?.toDate?.() || new Date(),
          lastSeen: data.lastSeen?.toDate?.() || new Date(),
        } as CustomerProfile);
      } else {
        // Create new profile
        const newProfile: Partial<CustomerProfile> = {
          userId: user.uid,
          email: user.email || undefined,
          firstSeen: new Date(),
          lastSeen: new Date(),
          totalSessions: 1,
          totalPageViews: 0,
          totalProductViews: 0,
          totalPurchases: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          favoriteCategories: [],
          browsedProducts: [],
          purchasedProducts: [],
          abandonedCarts: 0,
          conversionRate: 0,
          customerSegment: "new_visitor",
          behaviorScore: 0,
          churnRisk: "low",
          lifetimeValueTier: "bronze",
        };
        
        setDoc(profileRef, {
          ...newProfile,
          firstSeen: serverTimestamp(),
          lastSeen: serverTimestamp(),
        }).catch(console.error);
        
        setCurrentProfile(newProfile as CustomerProfile);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user?.uid, user?.email]);
  
  // Track product view
  const trackProductView = useCallback((productId: string, productName: string, category: string) => {
    const startTime = Date.now();
    productViewTimesRef.current.set(productId, startTime);
    
    if (sessionRef.current) {
      sessionRef.current.productsViewed.push(productId);
    }
    
    if (!user?.uid || !firebaseConfigured) return;
    
    // Update profile with product interaction
    const profileRef = doc(db, "customerBehavior", "profiles", "users", user.uid);
    getDoc(profileRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const browsedProducts: ProductInteraction[] = data.browsedProducts || [];
        
        const existingIndex = browsedProducts.findIndex(p => p.productId === productId);
        if (existingIndex >= 0) {
          browsedProducts[existingIndex].views++;
          browsedProducts[existingIndex].lastViewed = new Date();
        } else {
          browsedProducts.push({
            productId,
            productName,
            category,
            views: 1,
            lastViewed: new Date(),
            addedToCart: false,
            purchased: false,
            timeSpent: 0,
          });
        }
        
        // Update category preferences
        const categories: CategoryPreference[] = data.favoriteCategories || [];
        const catIndex = categories.findIndex(c => c.category === category);
        if (catIndex >= 0) {
          categories[catIndex].views++;
          categories[catIndex].score = categories[catIndex].views * 1 + categories[catIndex].purchases * 5;
        } else {
          categories.push({ category, views: 1, purchases: 0, score: 1 });
        }
        
        // Sort by score
        categories.sort((a, b) => b.score - a.score);
        
        setDoc(profileRef, {
          browsedProducts: browsedProducts.slice(0, 100), // Keep last 100
          favoriteCategories: categories.slice(0, 10), // Keep top 10
          totalProductViews: (data.totalProductViews || 0) + 1,
          lastSeen: serverTimestamp(),
        }, { merge: true }).catch(console.error);
      }
    });
    
    // Log to analytics collection
    const analyticsRef = doc(collection(db, "customerBehavior", "analytics", "productViews"));
    const productViewData: Record<string, unknown> = {
      userId: user.uid,
      productId,
      productName,
      category,
      timestamp: serverTimestamp(),
    };
    if (sessionRef.current?.sessionId) productViewData.sessionId = sessionRef.current.sessionId;
    setDoc(analyticsRef, productViewData).catch(console.error);
  }, [user?.uid]);
  
  // Track page time
  const trackPageTime = useCallback((pagePath: string, timeSpent: number) => {
    if (!user?.uid || !firebaseConfigured) return;
    
    const analyticsRef = doc(collection(db, "customerBehavior", "analytics", "pageTime"));
    const pageTimeData: Record<string, unknown> = {
      userId: user.uid,
      pagePath,
      timeSpent,
      timestamp: serverTimestamp(),
    };
    if (sessionRef.current?.sessionId) pageTimeData.sessionId = sessionRef.current.sessionId;
    setDoc(analyticsRef, pageTimeData).catch(console.error);
  }, [user?.uid]);
  
  // Track search
  const trackSearch = useCallback((queryText: string) => {
    if (sessionRef.current) {
      sessionRef.current.searchQueries.push(queryText);
    }
    
    if (!firebaseConfigured) return;
    
    const analyticsRef = doc(collection(db, "customerBehavior", "analytics", "searches"));
    const searchData: Record<string, unknown> = {
      userId: user?.uid || "anonymous",
      query: queryText,
      timestamp: serverTimestamp(),
    };
    if (sessionRef.current?.sessionId) searchData.sessionId = sessionRef.current.sessionId;
    setDoc(analyticsRef, searchData).catch(console.error);
  }, [user?.uid]);
  
  // Track cart action
  const trackCartAction = useCallback((action: CartAction["action"], productId: string, productName: string, quantity: number) => {
    const cartAction: CartAction = {
      action,
      productId,
      productName,
      quantity,
      timestamp: new Date(),
    };
    
    if (sessionRef.current) {
      sessionRef.current.cartActions.push(cartAction);
    }
    
    if (!firebaseConfigured) return;
    
    // Log cart action
    const analyticsRef = doc(collection(db, "customerBehavior", "analytics", "cartActions"));
    const cartData: Record<string, unknown> = {
      userId: user?.uid || "anonymous",
      action: cartAction.action,
      productId: cartAction.productId,
      productName: cartAction.productName,
      quantity: cartAction.quantity,
      timestamp: serverTimestamp(),
    };
    if (sessionRef.current?.sessionId) cartData.sessionId = sessionRef.current.sessionId;
    setDoc(analyticsRef, cartData).catch(console.error);
    
    // Update product interaction if user is logged in
    if (user?.uid && action === "add") {
      const profileRef = doc(db, "customerBehavior", "profiles", "users", user.uid);
      getDoc(profileRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const browsedProducts: ProductInteraction[] = data.browsedProducts || [];
          const existingIndex = browsedProducts.findIndex(p => p.productId === productId);
          if (existingIndex >= 0) {
            browsedProducts[existingIndex].addedToCart = true;
          }
          setDoc(profileRef, { browsedProducts }, { merge: true }).catch(console.error);
        }
      });
    }
  }, [user?.uid]);
  
  // Track checkout step
  const trackCheckoutStep = useCallback((step: string) => {
    if (!firebaseConfigured) return;
    
    const analyticsRef = doc(collection(db, "customerBehavior", "analytics", "checkoutSteps"));
    const checkoutData: Record<string, unknown> = {
      userId: user?.uid || "anonymous",
      step,
      timestamp: serverTimestamp(),
    };
    if (sessionRef.current?.sessionId) checkoutData.sessionId = sessionRef.current.sessionId;
    setDoc(analyticsRef, checkoutData).catch(console.error);
  }, [user?.uid]);
  
  // Get customer profile
  const getCustomerProfile = useCallback(async (userId: string): Promise<CustomerProfile | null> => {
    if (!firebaseConfigured) return null;
    
    const profileRef = doc(db, "customerBehavior", "profiles", "users", userId);
    const snapshot = await getDoc(profileRef);
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return {
      ...data,
      userId,
      firstSeen: data.firstSeen?.toDate?.() || new Date(),
      lastSeen: data.lastSeen?.toDate?.() || new Date(),
    } as CustomerProfile;
  }, []);
  
  // Update customer segment
  const updateCustomerSegment = useCallback(async (userId: string): Promise<CustomerSegment> => {
    const profile = await getCustomerProfile(userId);
    if (!profile) return "new_visitor";
    
    const segment = determineSegment(profile);
    const behaviorScore = calculateBehaviorScore(profile);
    const churnRisk = calculateChurnRisk({ ...profile, behaviorScore });
    const lifetimeValueTier = calculateLifetimeTier(profile.totalSpent);
    const predictedNextPurchase = predictNextPurchase(profile);
    
    if (firebaseConfigured) {
      const profileRef = doc(db, "customerBehavior", "profiles", "users", userId);
      await setDoc(profileRef, {
        customerSegment: segment,
        behaviorScore,
        churnRisk,
        lifetimeValueTier,
        predictedNextPurchase,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
    }
    
    return segment;
  }, [getCustomerProfile]);
  
  // Get aggregated insights
  const getAggregatedInsights = useCallback(async (): Promise<AggregatedInsights> => {
    if (!firebaseConfigured) {
      return getEmptyInsights();
    }
    
    try {
      // Get all profiles
      const profilesRef = collection(db, "customerBehavior", "profiles", "users");
      const profilesSnapshot = await getDocs(profilesRef);
      
      const profiles: CustomerProfile[] = profilesSnapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id,
        firstSeen: doc.data().firstSeen?.toDate?.() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate?.() || new Date(),
      })) as CustomerProfile[];
      
      // Calculate aggregated metrics
      const totalCustomers = profiles.length;
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      
      const activeCustomers = profiles.filter(p => 
        new Date(p.lastSeen).getTime() > weekAgo
      ).length;
      
      const newCustomersToday = profiles.filter(p => 
        new Date(p.firstSeen).getTime() > dayAgo
      ).length;
      
      // Calculate segment distribution
      const customerSegments: Record<CustomerSegment, number> = {
        new_visitor: 0,
        returning_visitor: 0,
        engaged_browser: 0,
        cart_abandoner: 0,
        first_time_buyer: 0,
        repeat_customer: 0,
        loyal_customer: 0,
        at_risk: 0,
        dormant: 0,
      };
      
      profiles.forEach(p => {
        const segment = p.customerSegment || determineSegment(p);
        customerSegments[segment]++;
      });
      
      // Calculate averages
      const totalSpent = profiles.reduce((sum, p) => sum + (p.totalSpent || 0), 0);
      const totalPurchases = profiles.reduce((sum, p) => sum + (p.totalPurchases || 0), 0);
      const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
      
      const customersWithPurchases = profiles.filter(p => (p.totalPurchases || 0) > 0).length;
      const conversionRate = totalCustomers > 0 ? (customersWithPurchases / totalCustomers) * 100 : 0;
      
      const totalAbandonedCarts = profiles.reduce((sum, p) => sum + (p.abandonedCarts || 0), 0);
      const cartAbandonmentRate = totalAbandonedCarts > 0 
        ? (totalAbandonedCarts / (totalAbandonedCarts + totalPurchases)) * 100 
        : 0;
      
      // Aggregate category preferences
      const categoryMap = new Map<string, { views: number; revenue: number }>();
      profiles.forEach(p => {
        (p.favoriteCategories || []).forEach(cat => {
          const existing = categoryMap.get(cat.category) || { views: 0, revenue: 0 };
          categoryMap.set(cat.category, {
            views: existing.views + cat.views,
            revenue: existing.revenue + cat.purchases * (p.averageOrderValue || 0),
          });
        });
      });
      
      const topCategories = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
      
      // Generate insights
      const insights = await generateInsightsInternal(profiles, customerSegments);
      
      return {
        totalCustomers,
        activeCustomers,
        newCustomersToday,
        averageSessionDuration: 0, // Would need session data
        bounceRate: 0, // Would need page view data
        conversionRate,
        cartAbandonmentRate,
        averageOrderValue,
        topProducts: [], // Would need product analytics
        topCategories,
        customerSegments,
        peakHours: [], // Would need timestamp analysis
        deviceDistribution: {},
        trafficSources: {},
        searchTerms: [],
        insights,
      };
    } catch (error) {
      console.error("Error getting aggregated insights:", error);
      return getEmptyInsights();
    }
  }, []);
  
  // Generate insights internally
  const generateInsightsInternal = async (
    profiles: CustomerProfile[], 
    segments: Record<CustomerSegment, number>
  ): Promise<BehaviorInsight[]> => {
    const insights: BehaviorInsight[] = [];
    const now = new Date();
    
    // Cart abandonment insight
    const cartAbandoners = segments.cart_abandoner;
    if (cartAbandoners > 0) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: "cart_abandonment",
        title: "Cart Abandonment Alert",
        description: `${cartAbandoners} customers have abandoned their carts without completing purchase.`,
        impact: cartAbandoners > 10 ? "high" : cartAbandoners > 5 ? "medium" : "low",
        metric: "cart_abandoners",
        value: cartAbandoners,
        trend: "stable",
        recommendation: "Consider sending targeted email reminders with incentives to recover these carts.",
        affectedCustomers: cartAbandoners,
        generatedAt: now,
      });
    }
    
    // Churn risk insight
    const atRiskCount = segments.at_risk + segments.dormant;
    if (atRiskCount > 0) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: "churn_risk",
        title: "Customers at Risk of Churning",
        description: `${atRiskCount} previous customers haven't engaged recently.`,
        impact: atRiskCount > 20 ? "high" : atRiskCount > 10 ? "medium" : "low",
        metric: "at_risk_customers",
        value: atRiskCount,
        trend: "down",
        recommendation: "Launch a win-back campaign with exclusive offers for returning customers.",
        affectedCustomers: atRiskCount,
        generatedAt: now,
      });
    }
    
    // Loyal customers insight
    const loyalCount = segments.loyal_customer;
    if (loyalCount > 0) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: "upsell_opportunity",
        title: "Loyal Customer Opportunity",
        description: `${loyalCount} loyal customers are prime candidates for VIP programs.`,
        impact: "high",
        metric: "loyal_customers",
        value: loyalCount,
        trend: "up",
        recommendation: "Consider launching a VIP loyalty program with exclusive early access and rewards.",
        affectedCustomers: loyalCount,
        generatedAt: now,
      });
    }
    
    // Engaged browsers (high intent, no conversion)
    const engagedBrowsers = segments.engaged_browser;
    if (engagedBrowsers > 0) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: "conversion_opportunity",
        title: "High-Intent Browsers Not Converting",
        description: `${engagedBrowsers} engaged browsers have viewed many products but haven't purchased.`,
        impact: engagedBrowsers > 15 ? "high" : "medium",
        metric: "engaged_browsers",
        value: engagedBrowsers,
        trend: "stable",
        recommendation: "Offer a first-purchase discount or free shipping to convert these engaged browsers.",
        affectedCustomers: engagedBrowsers,
        generatedAt: now,
      });
    }
    
    // New visitors insight
    const newVisitors = segments.new_visitor;
    const returningRate = profiles.length > 0 
      ? ((profiles.length - newVisitors) / profiles.length) * 100 
      : 0;
    insights.push({
      id: `insight_${Date.now()}_5`,
      type: "engagement_drop",
      title: "Visitor Return Rate",
      description: `${returningRate.toFixed(1)}% of visitors return after their first visit.`,
      impact: returningRate < 30 ? "high" : returningRate < 50 ? "medium" : "low",
      metric: "return_rate",
      value: returningRate,
      trend: returningRate > 40 ? "up" : "down",
      recommendation: returningRate < 40 
        ? "Improve first-visit experience and implement email capture for nurturing."
        : "Great return rate! Focus on converting returning visitors.",
      affectedCustomers: newVisitors,
      generatedAt: now,
    });
    
    return insights;
  };
  
  // Generate insights (public method)
  const generateInsights = useCallback(async (): Promise<BehaviorInsight[]> => {
    const aggregated = await getAggregatedInsights();
    return aggregated.insights;
  }, [getAggregatedInsights]);
  
  // Get purchase predictions
  const getPurchasePredictions = useCallback(async (userId: string): Promise<PurchasePrediction | null> => {
    const profile = await getCustomerProfile(userId);
    if (!profile || profile.totalPurchases < 2) return null;
    
    // Simple collaborative filtering based on category preferences
    const predictedProducts: PurchasePrediction["predictedProducts"] = [];
    
    // Products in favorite categories that haven't been purchased
    profile.browsedProducts
      .filter(p => !p.purchased)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .forEach(p => {
        predictedProducts.push({
          productId: p.productId,
          productName: p.productName,
          probability: Math.min(0.95, 0.3 + (p.views * 0.1) + (p.addedToCart ? 0.3 : 0)),
          recommendedAt: new Date(),
        });
      });
    
    return {
      userId,
      predictedProducts,
      predictedNextPurchaseDate: predictNextPurchase(profile) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      confidence: profile.totalPurchases >= 5 ? 0.8 : profile.totalPurchases >= 3 ? 0.6 : 0.4,
    };
  }, [getCustomerProfile]);
  
  // Get customers by segment
  const getCustomersBySegment = useCallback(async (segment: CustomerSegment): Promise<CustomerProfile[]> => {
    if (!firebaseConfigured) return [];
    
    const profilesRef = collection(db, "customerBehavior", "profiles", "users");
    const q = query(profilesRef, where("customerSegment", "==", segment), limit(100));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      userId: doc.id,
      firstSeen: doc.data().firstSeen?.toDate?.() || new Date(),
      lastSeen: doc.data().lastSeen?.toDate?.() || new Date(),
    })) as CustomerProfile[];
  }, []);
  
  // Get recent behavior
  const getRecentBehavior = useCallback(async (limitCount: number = 50): Promise<BrowsingSession[]> => {
    if (!firebaseConfigured) return [];
    
    const sessionsRef = collection(db, "customerBehavior", "sessions", "completed");
    const q = query(sessionsRef, orderBy("endTime", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      startTime: doc.data().startTime?.toDate?.() || new Date(),
      endTime: doc.data().endTime?.toDate?.() || new Date(),
    })) as BrowsingSession[];
  }, []);
  
  const value: CustomerBehaviorContextType = {
    currentProfile,
    loading,
    trackProductView,
    trackSearch,
    trackCartAction,
    trackPageTime,
    trackCheckoutStep,
    getCustomerProfile,
    updateCustomerSegment,
    getAggregatedInsights,
    generateInsights,
    getPurchasePredictions,
    getCustomersBySegment,
    getRecentBehavior,
  };
  
  return (
    <CustomerBehaviorContext.Provider value={value}>
      {children}
    </CustomerBehaviorContext.Provider>
  );
}

// ============================================
// Utilities
// ============================================

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function getTrafficSource(): string {
  if (typeof window === "undefined") return "direct";
  const referrer = document.referrer;
  if (!referrer) return "direct";
  if (referrer.includes("google")) return "google";
  if (referrer.includes("facebook")) return "facebook";
  if (referrer.includes("instagram")) return "instagram";
  if (referrer.includes("twitter") || referrer.includes("x.com")) return "twitter";
  return "referral";
}

function getEmptyInsights(): AggregatedInsights {
  return {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersToday: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    cartAbandonmentRate: 0,
    averageOrderValue: 0,
    topProducts: [],
    topCategories: [],
    customerSegments: {
      new_visitor: 0,
      returning_visitor: 0,
      engaged_browser: 0,
      cart_abandoner: 0,
      first_time_buyer: 0,
      repeat_customer: 0,
      loyal_customer: 0,
      at_risk: 0,
      dormant: 0,
    },
    peakHours: [],
    deviceDistribution: {},
    trafficSources: {},
    searchTerms: [],
    insights: [],
  };
}
