"use client";
import { createContext, useContext, useEffect, useCallback, useRef, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { db, collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, getDoc } from "@/lib/firebase";

// ============================================
// Types
// ============================================

export interface PageViewEvent {
  path: string;
  title: string;
  referrer: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  duration?: number;
}

export interface TrackEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface EcommerceEvent {
  type: "view_item" | "add_to_cart" | "remove_from_cart" | "begin_checkout" | "purchase" | "add_to_wishlist" | "share";
  productId?: string;
  productName?: string;
  productCategory?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  orderId?: string;
  orderTotal?: number;
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  isInfluencer?: boolean;
  customerSegment?: string;
  lifetimeValue?: number;
  ordersCount?: number;
  firstVisit?: Date;
  lastVisit?: Date;
}

export interface AnalyticsSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  events: number;
  source?: string;
  medium?: string;
  campaign?: string;
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
}

interface AnalyticsContextType {
  // Page tracking
  trackPageView: (path?: string, title?: string) => void;
  
  // Event tracking
  trackEvent: (event: TrackEvent) => void;
  
  // Ecommerce tracking
  trackEcommerce: (event: EcommerceEvent) => void;
  
  // User tracking
  setUserProperties: (properties: UserProperties) => void;
  identifyUser: (userId: string, properties?: Partial<UserProperties>) => void;
  
  // Session info
  getSessionId: () => string;
  getSession: () => AnalyticsSession | null;
  
  // Timing
  startTiming: (category: string, variable: string) => void;
  endTiming: (category: string, variable: string) => void;
  
  // Conversion tracking
  trackConversion: (conversionType: string, value?: number, metadata?: Record<string, unknown>) => void;
  
  // Search tracking
  trackSearch: (query: string, resultsCount: number) => void;
  
  // Error tracking
  trackError: (error: string, fatal?: boolean, metadata?: Record<string, unknown>) => void;
}

// ============================================
// Utilities
// ============================================

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getBrowserInfo(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Opera")) return "Opera";
  return "unknown";
}

function getOSInfo(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "unknown";
}

function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
  };
}

// ============================================
// Context
// ============================================

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = "cipher_analytics_session";
const USER_PROPS_KEY = "cipher_analytics_user";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const sessionRef = useRef<AnalyticsSession | null>(null);
  const timingsRef = useRef<Map<string, number>>(new Map());
  const lastPageRef = useRef<{ path: string; time: number } | null>(null);
  const lastLoggedPageRef = useRef<{ path: string; time: number } | null>(null);
  const userPropertiesRef = useRef<UserProperties>({});

  // Initialize or restore session
  const initSession = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const stored = localStorage.getItem(SESSION_KEY);
    const now = new Date();
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const lastActivity = new Date(parsed.lastActivity);
        
        // Check if session is still valid
        if (now.getTime() - lastActivity.getTime() < SESSION_TIMEOUT) {
          sessionRef.current = {
            ...parsed,
            startTime: new Date(parsed.startTime),
            lastActivity: now,
          };
          return;
        }
      } catch {
        // Invalid stored session
      }
    }
    
    // Create new session
    const utmParams = getUTMParams();
    sessionRef.current = {
      id: generateSessionId(),
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      events: 0,
      source: utmParams.source,
      medium: utmParams.medium,
      campaign: utmParams.campaign,
      device: getDeviceType(),
      browser: getBrowserInfo(),
      os: getOSInfo(),
    };
    
    // Store new session
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
    
    // Log session start to Firestore (filter out undefined values)
    const sessionData: Record<string, unknown> = {
      sessionId: sessionRef.current.id,
      device: sessionRef.current.device,
      browser: sessionRef.current.browser,
      os: sessionRef.current.os,
      startTime: serverTimestamp(),
    };
    
    // Only add defined UTM params
    if (utmParams.source) sessionData.source = utmParams.source;
    if (utmParams.medium) sessionData.medium = utmParams.medium;
    if (utmParams.campaign) sessionData.campaign = utmParams.campaign;
    if (user?.uid) sessionData.userId = user.uid;
    
    logToFirestore("sessions", sessionData);
  }, [user?.uid]);

  // Update session activity
  const updateSession = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.lastActivity = new Date();
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initSession();
    
    // Restore user properties
    const storedUser = localStorage.getItem(USER_PROPS_KEY);
    if (storedUser) {
      try {
        userPropertiesRef.current = JSON.parse(storedUser);
      } catch {
        // Invalid stored user properties
      }
    }
  }, [initSession]);

  // Log to Firestore (filters out undefined values)
  const logToFirestore = async (collectionName: string, data: Record<string, unknown>) => {
    try {
      // Filter out undefined values - Firestore doesn't accept them
      const cleanedData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      }
      
      await addDoc(collection(db, "analytics", "events", collectionName), {
        ...cleanedData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      // Silently ignore "Document already exists" errors - these can happen 
      // due to Firestore offline persistence replaying writes
      if (error instanceof Error && error.message.includes("already exists")) {
        return;
      }
      console.error("Analytics log error:", error);
    }
  };

  // Update aggregated metrics
  const updateMetrics = async (metricType: string, incrementBy: number = 1) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const metricRef = doc(db, "analytics", "metrics", metricType, today);
      
      // Use setDoc with merge to handle race conditions atomically
      await setDoc(metricRef, {
        count: increment(incrementBy),
        date: today,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Metrics update error:", error);
    }
  };

  // Track page view
  const trackPageView = useCallback((path?: string, title?: string) => {
    const currentPath = path || pathname;
    const pageTitle = title || (typeof document !== "undefined" ? document.title : "");
    const now = Date.now();
    
    // Prevent duplicate page view logs within 500ms for the same path
    if (lastLoggedPageRef.current) {
      const { path: lastPath, time: lastTime } = lastLoggedPageRef.current;
      if (lastPath === currentPath && now - lastTime < 500) {
        return; // Skip duplicate log
      }
    }
    
    // Update last logged page reference
    lastLoggedPageRef.current = { path: currentPath, time: now };
    
    // Calculate time on previous page
    let duration: number | undefined;
    if (lastPageRef.current) {
      duration = now - lastPageRef.current.time;
    }
    
    // Update last page reference
    lastPageRef.current = { path: currentPath, time: now };
    
    // Update session
    if (sessionRef.current) {
      sessionRef.current.pageViews++;
      updateSession();
    }
    
    const pageViewData = {
      path: currentPath,
      title: pageTitle,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      duration,
      device: sessionRef.current?.device,
      searchParams: searchParams.toString() || undefined,
    };
    
    // Log to Firestore
    logToFirestore("pageviews", pageViewData);
    updateMetrics("pageviews");
    
    // Console log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Page View:", pageViewData);
    }
  }, [pathname, searchParams, user?.uid, updateSession]);

  // Auto-track page views on route change
  useEffect(() => {
    trackPageView();
  }, [pathname, trackPageView]);

  // Track custom event
  const trackEvent = useCallback((event: TrackEvent) => {
    if (sessionRef.current) {
      sessionRef.current.events++;
      updateSession();
    }
    
    const eventData = {
      ...event,
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      path: pathname,
    };
    
    logToFirestore("events", eventData);
    updateMetrics("events");
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Event:", eventData);
    }
  }, [pathname, user?.uid, updateSession]);

  // Track ecommerce events
  const trackEcommerce = useCallback((event: EcommerceEvent) => {
    const ecommerceData = {
      ...event,
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      currency: event.currency || "USD",
    };
    
    logToFirestore("ecommerce", ecommerceData);
    
    // Update specific metrics based on event type
    switch (event.type) {
      case "view_item":
        updateMetrics("product_views");
        break;
      case "add_to_cart":
        updateMetrics("add_to_cart");
        break;
      case "begin_checkout":
        updateMetrics("checkout_started");
        break;
      case "purchase":
        updateMetrics("purchases");
        if (event.orderTotal) {
          updateMetrics("revenue", event.orderTotal);
        }
        break;
      case "add_to_wishlist":
        updateMetrics("wishlist_adds");
        break;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Ecommerce:", ecommerceData);
    }
  }, [user?.uid]);

  // Set user properties
  const setUserProperties = useCallback((properties: UserProperties) => {
    userPropertiesRef.current = { ...userPropertiesRef.current, ...properties };
    localStorage.setItem(USER_PROPS_KEY, JSON.stringify(userPropertiesRef.current));
    
    // Update user document in Firestore
    if (properties.userId) {
      const userAnalyticsRef = doc(db, "analytics", "users", "profiles", properties.userId);
      setDoc(userAnalyticsRef, {
        ...properties,
        lastUpdated: serverTimestamp(),
      }, { merge: true }).catch(console.error);
    }
  }, []);

  // Identify user
  const identifyUser = useCallback((userId: string, properties?: Partial<UserProperties>) => {
    const fullProperties: UserProperties = {
      userId,
      ...properties,
      lastVisit: new Date(),
    };
    
    // Check if first visit
    if (!userPropertiesRef.current.firstVisit) {
      fullProperties.firstVisit = new Date();
    }
    
    setUserProperties(fullProperties);
    
    // Log identification event
    logToFirestore("identifications", {
      userId,
      sessionId: sessionRef.current?.id,
      properties: fullProperties,
    });
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Identify:", fullProperties);
    }
  }, [setUserProperties]);

  // Get session ID
  const getSessionId = useCallback(() => {
    return sessionRef.current?.id || "";
  }, []);

  // Get session
  const getSession = useCallback(() => {
    return sessionRef.current;
  }, []);

  // Start timing
  const startTiming = useCallback((category: string, variable: string) => {
    const key = `${category}:${variable}`;
    timingsRef.current.set(key, Date.now());
  }, []);

  // End timing
  const endTiming = useCallback((category: string, variable: string) => {
    const key = `${category}:${variable}`;
    const startTime = timingsRef.current.get(key);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      timingsRef.current.delete(key);
      
      logToFirestore("timings", {
        category,
        variable,
        duration,
        sessionId: sessionRef.current?.id,
        userId: user?.uid,
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] Timing: ${category}/${variable} = ${duration}ms`);
      }
    }
  }, [user?.uid]);

  // Track conversion
  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: Record<string, unknown>) => {
    const conversionData = {
      type: conversionType,
      value,
      metadata,
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      path: pathname,
    };
    
    logToFirestore("conversions", conversionData);
    updateMetrics(`conversion_${conversionType}`);
    
    if (value) {
      updateMetrics("conversion_value", value);
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Conversion:", conversionData);
    }
  }, [pathname, user?.uid]);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    const searchData = {
      query,
      resultsCount,
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      path: pathname,
    };
    
    logToFirestore("searches", searchData);
    updateMetrics("searches");
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Search:", searchData);
    }
  }, [pathname, user?.uid]);

  // Track error
  const trackError = useCallback((error: string, fatal: boolean = false, metadata?: Record<string, unknown>) => {
    const errorData = {
      error,
      fatal,
      metadata,
      sessionId: sessionRef.current?.id,
      userId: user?.uid,
      path: pathname,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
    
    logToFirestore("errors", errorData);
    updateMetrics(fatal ? "fatal_errors" : "errors");
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Error:", errorData);
    }
  }, [pathname, user?.uid]);

  // Track user on auth change
  useEffect(() => {
    if (user) {
      identifyUser(user.uid, {
        email: user.email || undefined,
      });
    }
  }, [user, identifyUser]);

  // Track page exit time
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPageRef.current) {
        const duration = Date.now() - lastPageRef.current.time;
        // Use sendBeacon for reliable delivery on page exit
        if (navigator.sendBeacon) {
          const data = JSON.stringify({
            type: "page_exit",
            path: lastPageRef.current.path,
            duration,
            sessionId: sessionRef.current?.id,
            timestamp: new Date().toISOString(),
          });
          navigator.sendBeacon("/api/analytics", data);
        }
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const value: AnalyticsContextType = {
    trackPageView,
    trackEvent,
    trackEcommerce,
    setUserProperties,
    identifyUser,
    getSessionId,
    getSession,
    startTiming,
    endTiming,
    trackConversion,
    trackSearch,
    trackError,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
