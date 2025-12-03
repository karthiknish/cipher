"use client";
import { useEffect, useRef, useCallback } from "react";
import { useCustomerBehavior } from "@/context/CustomerBehaviorContext";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

/**
 * Hook for tracking product page views with time spent
 */
export function useProductViewTracking(
  productId: string | null,
  productName: string | null,
  category: string | null
) {
  const { trackProductView, trackPageTime } = useCustomerBehavior();
  const startTimeRef = useRef<number>(Date.now());
  const trackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!productId || !productName || !category) return;
    
    // Track the product view once
    if (!trackedRef.current) {
      trackProductView(productId, productName, category);
      trackedRef.current = true;
      startTimeRef.current = Date.now();
    }

    // Track time spent when leaving
    return () => {
      if (trackedRef.current) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        trackPageTime(`/shop/${productId}`, timeSpent);
      }
    };
  }, [productId, productName, category, trackProductView, trackPageTime]);
}

/**
 * Hook for tracking cart actions automatically
 */
export function useCartBehaviorTracking() {
  const { trackCartAction } = useCustomerBehavior();
  const { cart } = useCart();
  const previousCartRef = useRef<typeof cart>([]);

  useEffect(() => {
    const prevCart = previousCartRef.current;
    
    // Detect additions
    cart.forEach(item => {
      const prevItem = prevCart.find(
        p => p.id === item.id && p.size === item.size && p.color === item.color
      );
      
      if (!prevItem) {
        // New item added
        trackCartAction("add", item.id, item.name, item.quantity);
      } else if (item.quantity > prevItem.quantity) {
        // Quantity increased
        trackCartAction("update", item.id, item.name, item.quantity);
      }
    });
    
    // Detect removals
    prevCart.forEach(prevItem => {
      const currentItem = cart.find(
        p => p.id === prevItem.id && p.size === prevItem.size && p.color === prevItem.color
      );
      
      if (!currentItem) {
        // Item removed
        trackCartAction("remove", prevItem.id, prevItem.name, 0);
      } else if (currentItem.quantity < prevItem.quantity) {
        // Quantity decreased
        trackCartAction("update", prevItem.id, prevItem.name, currentItem.quantity);
      }
    });
    
    previousCartRef.current = [...cart];
  }, [cart, trackCartAction]);
}

/**
 * Hook for tracking search queries
 */
export function useSearchTracking() {
  const { trackSearch } = useCustomerBehavior();
  const lastSearchRef = useRef<string>("");
  
  const trackSearchQuery = useCallback((query: string) => {
    if (query && query !== lastSearchRef.current && query.length >= 2) {
      trackSearch(query);
      lastSearchRef.current = query;
    }
  }, [trackSearch]);
  
  return { trackSearchQuery };
}

/**
 * Hook for tracking page time spent
 */
export function usePageTimeTracking() {
  const pathname = usePathname();
  const { trackPageTime } = useCustomerBehavior();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(pathname);

  useEffect(() => {
    // Track time on previous page before navigating
    if (lastPathRef.current !== pathname) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackPageTime(lastPathRef.current, timeSpent);
      
      // Reset for new page
      startTimeRef.current = Date.now();
      lastPathRef.current = pathname;
    }

    // Track on unmount
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 0) {
        trackPageTime(pathname, timeSpent);
      }
    };
  }, [pathname, trackPageTime]);
}

/**
 * Hook for tracking checkout funnel
 */
export function useCheckoutTracking() {
  const { trackCheckoutStep } = useCustomerBehavior();
  const trackedStepsRef = useRef<Set<string>>(new Set());

  const trackStep = useCallback((step: string) => {
    if (!trackedStepsRef.current.has(step)) {
      trackCheckoutStep(step);
      trackedStepsRef.current.add(step);
    }
  }, [trackCheckoutStep]);

  const resetTracking = useCallback(() => {
    trackedStepsRef.current.clear();
  }, []);

  return { trackStep, resetTracking };
}

/**
 * Hook for tracking engagement patterns (scroll depth, clicks, etc.)
 */
export function useEngagementTracking() {
  const scrollDepthRef = useRef<number>(0);
  const clicksRef = useRef<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      
      if (scrollPercent > scrollDepthRef.current) {
        scrollDepthRef.current = scrollPercent;
      }
    };

    const handleClick = () => {
      clicksRef.current++;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  const getEngagementData = useCallback(() => ({
    scrollDepth: scrollDepthRef.current,
    clicks: clicksRef.current,
  }), []);

  return { getEngagementData };
}

/**
 * Composite hook that tracks all behavior automatically
 */
export function useBehaviorAutoTrack() {
  usePageTimeTracking();
  useCartBehaviorTracking();
}
