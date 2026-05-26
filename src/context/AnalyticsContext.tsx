"use client";
import { createContext, use, useEffect, useCallback, useRef, ReactNode, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./AuthContext";

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
  trackPageView: (path?: string, title?: string) => void;
  trackEvent: (event: TrackEvent) => void;
  trackEcommerce: (event: EcommerceEvent) => void;
  setUserProperties: (properties: UserProperties) => void;
  identifyUser: (userId: string, properties?: Partial<UserProperties>) => void;
  getSessionId: () => string;
  getSession: () => AnalyticsSession | null;
  startTiming: (category: string, variable: string) => void;
  endTiming: (category: string, variable: string) => void;
  trackConversion: (conversionType: string, value?: number, metadata?: Record<string, unknown>) => void;
  trackSearch: (query: string, resultsCount: number) => void;
  trackError: (error: string, fatal?: boolean, metadata?: Record<string, unknown>) => void;
}

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

function cleanPayload(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function useAnalytics(): AnalyticsContextType {
  const context = use(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_KEY = "cipher_analytics_session";
const USER_PROPS_KEY = "cipher_analytics_user";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const logEvent = useMutation(api.analytics.logEvent);
  const bumpMetric = useMutation(api.analytics.bumpMetric);
  const setUserProfileMut = useMutation(api.analytics.setUserProfile);

  const sessionRef = useRef<AnalyticsSession | null>(null);
  const timingsRef = useRef<Map<string, number>>(new Map());
  const lastPageRef = useRef<{ path: string; time: number } | null>(null);
  const lastLoggedPageRef = useRef<{ path: string; time: number } | null>(null);
  const userPropertiesRef = useRef<UserProperties>({});

  const logAnalytics = useCallback(
    (category: string, data: Record<string, unknown>) => {
      logEvent({ category, payload: cleanPayload(data) }).catch((error) => {
        console.error("Analytics log error:", error);
      });
    },
    [logEvent]
  );

  const updateMetrics = useCallback(
    (metricType: string, incrementBy: number = 1) => {
      bumpMetric({ metricType, incrementBy }).catch((error) => {
        console.error("Metrics update error:", error);
      });
    },
    [bumpMetric]
  );

  const initSession = useCallback(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(SESSION_KEY);
    const now = new Date();

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const lastActivity = new Date(parsed.lastActivity);
        if (now.getTime() - lastActivity.getTime() < SESSION_TIMEOUT) {
          sessionRef.current = {
            ...parsed,
            startTime: new Date(parsed.startTime),
            lastActivity: now,
          };
          return;
        }
      } catch {
        // invalid session
      }
    }

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

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));

    const sessionData: Record<string, unknown> = {
      sessionId: sessionRef.current.id,
      device: sessionRef.current.device,
      browser: sessionRef.current.browser,
      os: sessionRef.current.os,
      startTime: now.toISOString(),
    };
    if (utmParams.source) sessionData.source = utmParams.source;
    if (utmParams.medium) sessionData.medium = utmParams.medium;
    if (utmParams.campaign) sessionData.campaign = utmParams.campaign;
    if (user?.uid) sessionData.userId = user.uid;

    logAnalytics("sessions", sessionData);
  }, [user?.uid, logAnalytics]);

  const updateSession = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.lastActivity = new Date();
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
  }, []);

  useEffect(() => {
    initSession();
    const storedUser = localStorage.getItem(USER_PROPS_KEY);
    if (storedUser) {
      try {
        userPropertiesRef.current = JSON.parse(storedUser);
      } catch {
        // ignore
      }
    }
  }, [initSession]);

  const trackPageView = useCallback(
    (path?: string, title?: string) => {
      const currentPath = path || pathname;
      const pageTitle = title || (typeof document !== "undefined" ? document.title : "");
      const now = Date.now();

      if (lastLoggedPageRef.current) {
        const { path: lastPath, time: lastTime } = lastLoggedPageRef.current;
        if (lastPath === currentPath && now - lastTime < 500) return;
      }
      lastLoggedPageRef.current = { path: currentPath, time: now };

      let duration: number | undefined;
      if (lastPageRef.current) {
        duration = now - lastPageRef.current.time;
      }
      lastPageRef.current = { path: currentPath, time: now };

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

      logAnalytics("pageviews", pageViewData);
      updateMetrics("pageviews");

      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Page View:", pageViewData);
      }
    },
    [pathname, searchParams, user?.uid, updateSession, logAnalytics, updateMetrics]
  );

  useEffect(() => {
    trackPageView();
  }, [pathname, trackPageView]);

  const trackEvent = useCallback(
    (event: TrackEvent) => {
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
      logAnalytics("events", eventData);
      updateMetrics("events");
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Event:", eventData);
      }
    },
    [pathname, user?.uid, updateSession, logAnalytics, updateMetrics]
  );

  const trackEcommerce = useCallback(
    (event: EcommerceEvent) => {
      const ecommerceData = {
        ...event,
        sessionId: sessionRef.current?.id,
        userId: user?.uid,
        currency: event.currency || "USD",
      };
      logAnalytics("ecommerce", ecommerceData);
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
          if (event.orderTotal) updateMetrics("revenue", event.orderTotal);
          break;
        case "add_to_wishlist":
          updateMetrics("wishlist_adds");
          break;
      }
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Ecommerce:", ecommerceData);
      }
    },
    [user?.uid, logAnalytics, updateMetrics]
  );

  const setUserProperties = useCallback(
    (properties: UserProperties) => {
      userPropertiesRef.current = { ...userPropertiesRef.current, ...properties };
      localStorage.setItem(USER_PROPS_KEY, JSON.stringify(userPropertiesRef.current));
      if (properties.userId) {
        setUserProfileMut({
          userId: properties.userId,
          properties,
        }).catch(console.error);
      }
    },
    [setUserProfileMut]
  );

  const identifyUser = useCallback(
    (userId: string, properties?: Partial<UserProperties>) => {
      const fullProperties: UserProperties = {
        userId,
        ...properties,
        lastVisit: new Date(),
      };
      if (!userPropertiesRef.current.firstVisit) {
        fullProperties.firstVisit = new Date();
      }
      setUserProperties(fullProperties);
      logAnalytics("identifications", {
        userId,
        sessionId: sessionRef.current?.id,
        properties: fullProperties,
      });
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Identify:", fullProperties);
      }
    },
    [setUserProperties, logAnalytics]
  );

  const getSessionId = useCallback(() => sessionRef.current?.id || "", []);
  const getSession = useCallback(() => sessionRef.current, []);

  const startTiming = useCallback((category: string, variable: string) => {
    timingsRef.current.set(`${category}:${variable}`, Date.now());
  }, []);

  const endTiming = useCallback(
    (category: string, variable: string) => {
      const key = `${category}:${variable}`;
      const startTime = timingsRef.current.get(key);
      if (startTime) {
        const duration = Date.now() - startTime;
        timingsRef.current.delete(key);
        logAnalytics("timings", {
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
    },
    [user?.uid, logAnalytics]
  );

  const trackConversion = useCallback(
    (conversionType: string, value?: number, metadata?: Record<string, unknown>) => {
      logAnalytics("conversions", {
        type: conversionType,
        value,
        metadata,
        sessionId: sessionRef.current?.id,
        userId: user?.uid,
        path: pathname,
      });
      updateMetrics(`conversion_${conversionType}`);
      if (value) updateMetrics("conversion_value", value);
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Conversion:", conversionType);
      }
    },
    [pathname, user?.uid, logAnalytics, updateMetrics]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      logAnalytics("searches", {
        query,
        resultsCount,
        sessionId: sessionRef.current?.id,
        userId: user?.uid,
        path: pathname,
      });
      updateMetrics("searches");
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Search:", query);
      }
    },
    [pathname, user?.uid, logAnalytics, updateMetrics]
  );

  const trackError = useCallback(
    (error: string, fatal: boolean = false, metadata?: Record<string, unknown>) => {
      logAnalytics("errors", {
        error,
        fatal,
        metadata,
        sessionId: sessionRef.current?.id,
        userId: user?.uid,
        path: pathname,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
      updateMetrics(fatal ? "fatal_errors" : "errors");
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Error:", error);
      }
    },
    [pathname, user?.uid, logAnalytics, updateMetrics]
  );

  useEffect(() => {
    if (user) {
      identifyUser(user.uid, { email: user.email || undefined });
    }
  }, [user, identifyUser]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPageRef.current && navigator.sendBeacon) {
        const data = JSON.stringify({
          type: "page_exit",
          path: lastPageRef.current.path,
          duration: Date.now() - lastPageRef.current.time,
          sessionId: sessionRef.current?.id,
          timestamp: new Date().toISOString(),
        });
        navigator.sendBeacon("/api/analytics", data);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const contextValue = useMemo(
    () => ({
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
      }),
    [endTiming, getSession, getSessionId, identifyUser, setUserProperties, startTiming, trackConversion, trackEcommerce, trackError, trackEvent, trackPageView, trackSearch]
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}
