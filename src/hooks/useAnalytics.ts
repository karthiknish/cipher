"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";

/**
 * Hook for tracking product interactions
 */
export function useProductAnalytics() {
  const { trackEcommerce, trackEvent, startTiming, endTiming } = useAnalytics();

  const trackProductView = useCallback((product: {
    id: string;
    name: string;
    category?: string;
    price: number;
  }) => {
    trackEcommerce({
      type: "view_item",
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      price: product.price,
    });
  }, [trackEcommerce]);

  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }) => {
    trackEcommerce({
      type: "add_to_cart",
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      price: product.price,
      quantity: product.quantity,
    });
  }, [trackEcommerce]);

  const trackRemoveFromCart = useCallback((product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    trackEcommerce({
      type: "remove_from_cart",
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: product.quantity,
    });
  }, [trackEcommerce]);

  const trackAddToWishlist = useCallback((product: {
    id: string;
    name: string;
    category?: string;
    price: number;
  }) => {
    trackEcommerce({
      type: "add_to_wishlist",
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      price: product.price,
    });
  }, [trackEcommerce]);

  const trackShare = useCallback((product: {
    id: string;
    name: string;
    method: string;
  }) => {
    trackEcommerce({
      type: "share",
      productId: product.id,
      productName: product.name,
      metadata: { method: product.method },
    });
  }, [trackEcommerce]);

  const trackQuickView = useCallback((productId: string, productName: string) => {
    trackEvent({
      category: "Product",
      action: "quick_view",
      label: productName,
      metadata: { productId },
    });
  }, [trackEvent]);

  const trackImageZoom = useCallback((productId: string) => {
    trackEvent({
      category: "Product",
      action: "image_zoom",
      metadata: { productId },
    });
  }, [trackEvent]);

  const trackSizeSelect = useCallback((productId: string, size: string) => {
    trackEvent({
      category: "Product",
      action: "size_select",
      label: size,
      metadata: { productId },
    });
  }, [trackEvent]);

  const trackColorSelect = useCallback((productId: string, color: string) => {
    trackEvent({
      category: "Product",
      action: "color_select",
      label: color,
      metadata: { productId },
    });
  }, [trackEvent]);

  const startProductViewTimer = useCallback((productId: string) => {
    startTiming("Product", `view_${productId}`);
  }, [startTiming]);

  const endProductViewTimer = useCallback((productId: string) => {
    endTiming("Product", `view_${productId}`);
  }, [endTiming]);

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    trackShare,
    trackQuickView,
    trackImageZoom,
    trackSizeSelect,
    trackColorSelect,
    startProductViewTimer,
    endProductViewTimer,
  };
}

/**
 * Hook for tracking checkout flow
 */
export function useCheckoutAnalytics() {
  const { trackEcommerce, trackEvent, trackConversion } = useAnalytics();

  const trackBeginCheckout = useCallback((items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>, total: number) => {
    trackEcommerce({
      type: "begin_checkout",
      items,
      orderTotal: total,
    });
  }, [trackEcommerce]);

  const trackAddShippingInfo = useCallback((shippingMethod: string, cost: number) => {
    trackEvent({
      category: "Checkout",
      action: "add_shipping_info",
      label: shippingMethod,
      value: cost,
    });
  }, [trackEvent]);

  const trackAddPaymentInfo = useCallback((paymentMethod: string) => {
    trackEvent({
      category: "Checkout",
      action: "add_payment_info",
      label: paymentMethod,
    });
  }, [trackEvent]);

  const trackApplyPromoCode = useCallback((code: string, success: boolean, discount?: number) => {
    trackEvent({
      category: "Checkout",
      action: success ? "promo_code_applied" : "promo_code_failed",
      label: code,
      value: discount,
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((order: {
    orderId: string;
    total: number;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>;
    shipping?: number;
    tax?: number;
    discount?: number;
    promoCode?: string;
  }) => {
    trackEcommerce({
      type: "purchase",
      orderId: order.orderId,
      orderTotal: order.total,
      items: order.items,
      metadata: {
        shipping: order.shipping,
        tax: order.tax,
        discount: order.discount,
        promoCode: order.promoCode,
      },
    });

    trackConversion("purchase", order.total, {
      orderId: order.orderId,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [trackEcommerce, trackConversion]);

  const trackCheckoutStep = useCallback((step: number, stepName: string) => {
    trackEvent({
      category: "Checkout",
      action: "checkout_step",
      label: stepName,
      value: step,
    });
  }, [trackEvent]);

  const trackCheckoutError = useCallback((step: string, error: string) => {
    trackEvent({
      category: "Checkout",
      action: "checkout_error",
      label: error,
      metadata: { step },
    });
  }, [trackEvent]);

  return {
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackApplyPromoCode,
    trackPurchase,
    trackCheckoutStep,
    trackCheckoutError,
  };
}

/**
 * Hook for tracking user engagement
 */
export function useEngagementAnalytics() {
  const { trackEvent, trackConversion } = useAnalytics();

  const trackSignUp = useCallback((method: string) => {
    trackEvent({
      category: "User",
      action: "sign_up",
      label: method,
    });
    trackConversion("sign_up");
  }, [trackEvent, trackConversion]);

  const trackLogin = useCallback((method: string) => {
    trackEvent({
      category: "User",
      action: "login",
      label: method,
    });
  }, [trackEvent]);

  const trackLogout = useCallback(() => {
    trackEvent({
      category: "User",
      action: "logout",
    });
  }, [trackEvent]);

  const trackNewsletterSignup = useCallback((source: string) => {
    trackEvent({
      category: "Engagement",
      action: "newsletter_signup",
      label: source,
    });
    trackConversion("newsletter_signup");
  }, [trackEvent, trackConversion]);

  const trackReviewSubmit = useCallback((productId: string, rating: number) => {
    trackEvent({
      category: "Engagement",
      action: "review_submit",
      value: rating,
      metadata: { productId },
    });
  }, [trackEvent]);

  const trackVote = useCallback((contestId: string, choice: string) => {
    trackEvent({
      category: "Engagement",
      action: "design_vote",
      label: choice,
      metadata: { contestId },
    });
  }, [trackEvent]);

  const trackContactSubmit = useCallback((subject: string) => {
    trackEvent({
      category: "Engagement",
      action: "contact_submit",
      label: subject,
    });
  }, [trackEvent]);

  const trackInfluencerApply = useCallback(() => {
    trackEvent({
      category: "Engagement",
      action: "influencer_apply",
    });
    trackConversion("influencer_apply");
  }, [trackEvent, trackConversion]);

  return {
    trackSignUp,
    trackLogin,
    trackLogout,
    trackNewsletterSignup,
    trackReviewSubmit,
    trackVote,
    trackContactSubmit,
    trackInfluencerApply,
  };
}

/**
 * Hook for tracking UI interactions
 */
export function useUIAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackClick = useCallback((element: string, location?: string) => {
    trackEvent({
      category: "UI",
      action: "click",
      label: element,
      metadata: location ? { location } : undefined,
    });
  }, [trackEvent]);

  const trackScroll = useCallback((depth: number, page: string) => {
    trackEvent({
      category: "UI",
      action: "scroll",
      value: depth,
      metadata: { page },
    });
  }, [trackEvent]);

  const trackFilterApply = useCallback((filterType: string, value: string) => {
    trackEvent({
      category: "UI",
      action: "filter_apply",
      label: `${filterType}:${value}`,
    });
  }, [trackEvent]);

  const trackSortChange = useCallback((sortBy: string) => {
    trackEvent({
      category: "UI",
      action: "sort_change",
      label: sortBy,
    });
  }, [trackEvent]);

  const trackModalOpen = useCallback((modalName: string) => {
    trackEvent({
      category: "UI",
      action: "modal_open",
      label: modalName,
    });
  }, [trackEvent]);

  const trackModalClose = useCallback((modalName: string) => {
    trackEvent({
      category: "UI",
      action: "modal_close",
      label: modalName,
    });
  }, [trackEvent]);

  const trackTabChange = useCallback((tabName: string, section?: string) => {
    trackEvent({
      category: "UI",
      action: "tab_change",
      label: tabName,
      metadata: section ? { section } : undefined,
    });
  }, [trackEvent]);

  const trackChatbotOpen = useCallback(() => {
    trackEvent({
      category: "UI",
      action: "chatbot_open",
    });
  }, [trackEvent]);

  const trackChatbotMessage = useCallback((messageType: "user" | "bot") => {
    trackEvent({
      category: "Chatbot",
      action: messageType === "user" ? "message_sent" : "message_received",
    });
  }, [trackEvent]);

  const trackVirtualTryOn = useCallback((productId: string) => {
    trackEvent({
      category: "Feature",
      action: "virtual_try_on",
      metadata: { productId },
    });
  }, [trackEvent]);

  return {
    trackClick,
    trackScroll,
    trackFilterApply,
    trackSortChange,
    trackModalOpen,
    trackModalClose,
    trackTabChange,
    trackChatbotOpen,
    trackChatbotMessage,
    trackVirtualTryOn,
  };
}

/**
 * Hook for scroll depth tracking
 */
export function useScrollDepthTracking(thresholds: number[] = [25, 50, 75, 100]) {
  const { trackEvent } = useAnalytics();
  const reachedThresholds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      thresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !reachedThresholds.current.has(threshold)) {
          reachedThresholds.current.add(threshold);
          trackEvent({
            category: "Engagement",
            action: "scroll_depth",
            value: threshold,
            label: `${threshold}%`,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [thresholds, trackEvent]);

  // Reset on page change
  useEffect(() => {
    reachedThresholds.current = new Set();
  }, []);
}

/**
 * Hook for tracking element visibility
 */
export function useVisibilityTracking(
  elementRef: React.RefObject<HTMLElement>,
  eventName: string,
  metadata?: Record<string, unknown>
) {
  const { trackEvent } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            trackEvent({
              category: "Visibility",
              action: "element_viewed",
              label: eventName,
              metadata,
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, eventName, metadata, trackEvent]);
}

/**
 * Hook for A/B testing
 */
export function useABTest(testName: string, variants: string[]): string {
  const { trackEvent } = useAnalytics();
  const variantRef = useRef<string | null>(null);

  useEffect(() => {
    if (variantRef.current) return;

    // Check for stored variant
    const storageKey = `ab_test_${testName}`;
    const stored = localStorage.getItem(storageKey);

    if (stored && variants.includes(stored)) {
      variantRef.current = stored;
    } else {
      // Assign random variant
      const variant = variants[Math.floor(Math.random() * variants.length)];
      variantRef.current = variant;
      localStorage.setItem(storageKey, variant);
    }

    // Track assignment
    trackEvent({
      category: "AB_Test",
      action: "variant_assigned",
      label: testName,
      metadata: { variant: variantRef.current },
    });
  }, [testName, variants, trackEvent]);

  return variantRef.current || variants[0];
}
