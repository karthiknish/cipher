"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useProducts, Product } from "./ProductContext";
import { useAuth } from "./AuthContext";
import { useRecentlyViewed } from "./RecentlyViewedContext";

interface RecommendationReason {
  type: "similar_category" | "complementary" | "trending" | "viewed_together" | "style_match" | "price_range" | "new_arrival";
  label: string;
}

export interface RecommendedProduct extends Product {
  score: number;
  reasons: RecommendationReason[];
}

interface UserPreferences {
  viewedCategories: Record<string, number>;
  viewedPriceRanges: { low: number; high: number }[];
  purchasedCategories: string[];
  favoriteColors: string[];
}

interface RecommendationContextType {
  getRecommendationsForProduct: (productId: string, limit?: number) => RecommendedProduct[];
  getPersonalizedRecommendations: (limit?: number) => RecommendedProduct[];
  getTrendingProducts: (limit?: number) => RecommendedProduct[];
  getNewArrivals: (limit?: number) => RecommendedProduct[];
  getComplementaryProducts: (productId: string, limit?: number) => RecommendedProduct[];
  getSimilarProducts: (productId: string, limit?: number) => RecommendedProduct[];
  trackProductInteraction: (productId: string, interactionType: "view" | "cart" | "purchase") => void;
}

// Complementary category mappings
const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  "Hoodies": ["Pants", "Tees", "Accessories"],
  "Tees": ["Pants", "Outerwear", "Accessories"],
  "Pants": ["Tees", "Hoodies", "Outerwear"],
  "Outerwear": ["Tees", "Pants", "Accessories"],
  "Accessories": ["Tees", "Hoodies", "Outerwear"],
};

// Style pairings for "complete the look"
const STYLE_PAIRINGS: Record<string, string[]> = {
  "1": ["3", "4"],      // Hoodie → Cargo Pants, Cap
  "2": ["3", "6"],      // Street Tee → Cargo Pants, Vest
  "3": ["2", "5", "6"], // Cargo Pants → Tees, Vest
  "4": ["1", "2", "5"], // Cap → Hoodie, Tees
  "5": ["3", "4", "6"], // Oversized Tee → Pants, Cap, Vest
  "6": ["3", "2", "5"], // Tactical Vest → Pants, Tees
};

const STORAGE_KEY = "cipher_recommendation_data";

const RecommendationContext = createContext<RecommendationContextType>({
  getRecommendationsForProduct: () => [],
  getPersonalizedRecommendations: () => [],
  getTrendingProducts: () => [],
  getNewArrivals: () => [],
  getComplementaryProducts: () => [],
  getSimilarProducts: () => [],
  trackProductInteraction: () => {},
});

export const useRecommendations = () => useContext(RecommendationContext);

export const RecommendationProvider = ({ children }: { children: ReactNode }) => {
  const { products, getProduct } = useProducts();
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    viewedCategories: {},
    viewedPriceRanges: [],
    purchasedCategories: [],
    favoriteColors: [],
  });

  // Load user preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recommendation data");
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((prefs: UserPreferences) => {
    setUserPreferences(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, []);

  // Track user interactions with products
  const trackProductInteraction = useCallback((productId: string, interactionType: "view" | "cart" | "purchase") => {
    const product = getProduct(productId);
    if (!product) return;

    setUserPreferences(prev => {
      const newPrefs = { ...prev };
      
      // Track category interest
      const categoryWeight = interactionType === "purchase" ? 3 : interactionType === "cart" ? 2 : 1;
      newPrefs.viewedCategories = {
        ...prev.viewedCategories,
        [product.category]: (prev.viewedCategories[product.category] || 0) + categoryWeight,
      };

      // Track price range preference
      newPrefs.viewedPriceRanges = [
        ...prev.viewedPriceRanges.slice(-19),
        { low: product.price * 0.7, high: product.price * 1.3 }
      ];

      // Track purchased categories
      if (interactionType === "purchase" && !prev.purchasedCategories.includes(product.category)) {
        newPrefs.purchasedCategories = [...prev.purchasedCategories, product.category];
      }

      savePreferences(newPrefs);
      return newPrefs;
    });
  }, [getProduct, savePreferences]);

  // Calculate similarity score between products
  const calculateSimilarityScore = useCallback((product1: Product, product2: Product): number => {
    let score = 0;
    
    // Same category
    if (product1.category === product2.category) score += 30;
    
    // Similar price (within 30%)
    const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price);
    if (priceDiff < 0.3) score += 20 * (1 - priceDiff);
    
    // Shared colors
    if (product1.colors && product2.colors) {
      const colors1 = new Set(product1.colors.map(c => c.name.toLowerCase()));
      const colors2 = new Set(product2.colors.map(c => c.name.toLowerCase()));
      const sharedColors = [...colors1].filter(c => colors2.has(c)).length;
      score += sharedColors * 5;
    }
    
    return score;
  }, []);

  // Get similar products
  const getSimilarProducts = useCallback((productId: string, limit = 4): RecommendedProduct[] => {
    const product = getProduct(productId);
    if (!product) return [];

    return products
      .filter(p => p.id !== productId)
      .map(p => ({
        ...p,
        score: calculateSimilarityScore(product, p),
        reasons: [
          ...(p.category === product.category ? [{ type: "similar_category" as const, label: `Also in ${p.category}` }] : []),
          ...(Math.abs(p.price - product.price) / product.price < 0.3 ? [{ type: "price_range" as const, label: "Similar price" }] : []),
        ],
      }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [products, getProduct, calculateSimilarityScore]);

  // Get complementary products (different category, pairs well)
  const getComplementaryProducts = useCallback((productId: string, limit = 4): RecommendedProduct[] => {
    const product = getProduct(productId);
    if (!product) return [];

    const complementaryCategories = COMPLEMENTARY_CATEGORIES[product.category] || [];
    const stylePairs = STYLE_PAIRINGS[productId] || [];

    return products
      .filter(p => p.id !== productId)
      .map(p => {
        let score = 0;
        const reasons: RecommendationReason[] = [];

        // Check if it's a style pairing
        if (stylePairs.includes(p.id)) {
          score += 50;
          reasons.push({ type: "complementary", label: "Completes the look" });
        }

        // Check complementary category
        if (complementaryCategories.includes(p.category)) {
          score += 30;
          reasons.push({ type: "complementary", label: `Pairs well with ${product.category}` });
        }

        return { ...p, score, reasons };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [products, getProduct]);

  // Get recommendations for a specific product
  const getRecommendationsForProduct = useCallback((productId: string, limit = 8): RecommendedProduct[] => {
    const similar = getSimilarProducts(productId, Math.ceil(limit / 2));
    const complementary = getComplementaryProducts(productId, Math.ceil(limit / 2));
    
    // Merge and dedupe
    const seen = new Set<string>();
    const merged: RecommendedProduct[] = [];
    
    // Interleave similar and complementary
    const maxLen = Math.max(similar.length, complementary.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < complementary.length && !seen.has(complementary[i].id)) {
        seen.add(complementary[i].id);
        merged.push(complementary[i]);
      }
      if (i < similar.length && !seen.has(similar[i].id)) {
        seen.add(similar[i].id);
        merged.push(similar[i]);
      }
    }

    return merged.slice(0, limit);
  }, [getSimilarProducts, getComplementaryProducts]);

  // Get personalized recommendations based on user behavior
  const getPersonalizedRecommendations = useCallback((limit = 8): RecommendedProduct[] => {
    // Get user's top categories
    const topCategories = Object.entries(userPreferences.viewedCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Calculate average price range
    const avgLow = userPreferences.viewedPriceRanges.reduce((sum, r) => sum + r.low, 0) / 
                   Math.max(userPreferences.viewedPriceRanges.length, 1);
    const avgHigh = userPreferences.viewedPriceRanges.reduce((sum, r) => sum + r.high, 0) / 
                    Math.max(userPreferences.viewedPriceRanges.length, 1);

    // Get recently viewed product IDs to exclude
    const recentIds = new Set(recentlyViewed.map(p => p.id));

    return products
      .filter(p => !recentIds.has(p.id))
      .map(p => {
        let score = 0;
        const reasons: RecommendationReason[] = [];

        // Boost products in preferred categories
        if (topCategories.includes(p.category)) {
          const categoryRank = topCategories.indexOf(p.category);
          score += 30 - (categoryRank * 10);
          reasons.push({ type: "style_match", label: "Matches your style" });
        }

        // Boost products in preferred price range
        if (p.price >= avgLow && p.price <= avgHigh) {
          score += 20;
          reasons.push({ type: "price_range", label: "In your price range" });
        }

        // Small random factor for variety
        score += Math.random() * 10;

        return { ...p, score, reasons };
      })
      .filter(p => p.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [products, userPreferences, recentlyViewed]);

  // Get trending products (simulated based on product attributes)
  const getTrendingProducts = useCallback((limit = 4): RecommendedProduct[] => {
    // Simulate trending score based on price and category
    return products
      .map(p => {
        // Higher score for mid-range prices and popular categories
        let score = 50;
        if (p.category === "Hoodies" || p.category === "Tees") score += 20;
        if (p.price >= 50 && p.price <= 100) score += 15;
        score += Math.random() * 20; // Add some randomness
        
        return {
          ...p,
          score,
          reasons: [{ type: "trending" as const, label: "Trending now" }],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [products]);

  // Get new arrivals
  const getNewArrivals = useCallback((limit = 4): RecommendedProduct[] => {
    return products
      .map((p, i) => ({
        ...p,
        score: products.length - i, // Later products are "newer"
        reasons: [{ type: "new_arrival" as const, label: "New arrival" }],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [products]);

  return (
    <RecommendationContext.Provider value={{
      getRecommendationsForProduct,
      getPersonalizedRecommendations,
      getTrendingProducts,
      getNewArrivals,
      getComplementaryProducts,
      getSimilarProducts,
      trackProductInteraction,
    }}>
      {children}
    </RecommendationContext.Provider>
  );
};
