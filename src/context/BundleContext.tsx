"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useProducts, Product } from "./ProductContext";

export interface Bundle {
  id: string;
  name: string;
  description: string;
  tagline: string;
  image: string;
  productIds: string[];
  discountPercent: number;
  featured: boolean;
  category: "casual" | "street" | "essentials" | "seasonal";
  createdAt: number;
}

export interface BundleWithProducts extends Bundle {
  products: Product[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
}

export type BundleFormData = Omit<Bundle, "id" | "createdAt">;

interface BundleContextType {
  bundles: Bundle[];
  getBundleWithProducts: (bundleId: string) => BundleWithProducts | null;
  getAllBundlesWithProducts: () => BundleWithProducts[];
  getFeaturedBundles: () => BundleWithProducts[];
  getBundlesByCategory: (category: Bundle["category"]) => BundleWithProducts[];
  getBundlesContainingProduct: (productId: string) => BundleWithProducts[];
  addBundle: (data: BundleFormData) => Bundle;
  updateBundle: (id: string, data: Partial<BundleFormData>) => Bundle | null;
  deleteBundle: (id: string) => boolean;
}

// Curated bundles
const DEFAULT_BUNDLES: Bundle[] = [
  {
    id: "bundle-1",
    name: "The Essentials Kit",
    description: "Everything you need to build a solid streetwear foundation. This carefully curated set includes our best-selling hoodie, versatile street tee, and classic cap.",
    tagline: "Start your collection right",
    image: "https://placehold.co/800x600/1a1a1a/ffffff?text=Essentials+Kit",
    productIds: ["1", "2", "4"], // Hoodie, Street Tee, Cap
    discountPercent: 15,
    featured: true,
    category: "essentials",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: "bundle-2",
    name: "Street Ready Set",
    description: "Complete your urban look with this head-to-toe outfit. Featuring our cargo pants, oversized tee, and tactical vest for maximum functionality.",
    tagline: "Full look, one click",
    image: "https://placehold.co/800x600/1a1a1a/ffffff?text=Street+Ready",
    productIds: ["3", "5", "6"], // Cargo Pants, Oversized Tee, Tactical Vest
    discountPercent: 20,
    featured: true,
    category: "street",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: "bundle-3",
    name: "Casual Comfort Pack",
    description: "Laid-back essentials for everyday wear. Our softest tees paired with comfortable cargo pants for an effortlessly cool look.",
    tagline: "Comfort meets style",
    image: "https://placehold.co/800x600/1a1a1a/ffffff?text=Casual+Comfort",
    productIds: ["2", "5", "3"], // Street Tee, Oversized Tee, Cargo Pants
    discountPercent: 12,
    featured: false,
    category: "casual",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: "bundle-4",
    name: "The Minimalist",
    description: "Clean, simple, timeless. Two essential tees and a cap for those who appreciate understated style.",
    tagline: "Less is more",
    image: "https://placehold.co/800x600/1a1a1a/ffffff?text=The+Minimalist",
    productIds: ["2", "5", "4"], // Street Tee, Oversized Tee, Cap
    discountPercent: 10,
    featured: false,
    category: "essentials",
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
  {
    id: "bundle-5",
    name: "Urban Explorer",
    description: "Built for the city adventurer. Technical outerwear meets functional pants for those who move through the urban landscape.",
    tagline: "Adventure awaits",
    image: "https://placehold.co/800x600/1a1a1a/ffffff?text=Urban+Explorer",
    productIds: ["6", "3", "4"], // Tactical Vest, Cargo Pants, Cap
    discountPercent: 18,
    featured: true,
    category: "street",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

const BUNDLES_STORAGE_KEY = "cipher_bundles";

const BundleContext = createContext<BundleContextType>({
  bundles: [],
  getBundleWithProducts: () => null,
  getAllBundlesWithProducts: () => [],
  getFeaturedBundles: () => [],
  getBundlesByCategory: () => [],
  getBundlesContainingProduct: () => [],
  addBundle: () => ({ id: "", name: "", description: "", tagline: "", image: "", productIds: [], discountPercent: 0, featured: false, category: "essentials", createdAt: 0 }),
  updateBundle: () => null,
  deleteBundle: () => false,
});

export const useBundles = () => useContext(BundleContext);

export const BundleProvider = ({ children }: { children: ReactNode }) => {
  const { products, getProduct } = useProducts();
  const [bundles, setBundles] = useState<Bundle[]>(DEFAULT_BUNDLES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load bundles from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(BUNDLES_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBundles(parsed);
        } catch {
          // Use default bundles if parsing fails
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save bundles to localStorage when they change
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(bundles));
    }
  }, [bundles, isInitialized]);

  const getBundleWithProducts = useCallback((bundleId: string): BundleWithProducts | null => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return null;

    const bundleProducts = bundle.productIds
      .map(id => getProduct(id))
      .filter((p): p is Product => p !== undefined);

    if (bundleProducts.length === 0) return null;

    const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const bundlePrice = originalPrice * (1 - bundle.discountPercent / 100);
    const savings = originalPrice - bundlePrice;

    return {
      ...bundle,
      products: bundleProducts,
      originalPrice,
      bundlePrice,
      savings,
    };
  }, [bundles, getProduct]);

  const getAllBundlesWithProducts = useCallback((): BundleWithProducts[] => {
    return bundles
      .map(b => getBundleWithProducts(b.id))
      .filter((b): b is BundleWithProducts => b !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [bundles, getBundleWithProducts]);

  const getFeaturedBundles = useCallback((): BundleWithProducts[] => {
    return getAllBundlesWithProducts().filter(b => b.featured);
  }, [getAllBundlesWithProducts]);

  const getBundlesByCategory = useCallback((category: Bundle["category"]): BundleWithProducts[] => {
    return getAllBundlesWithProducts().filter(b => b.category === category);
  }, [getAllBundlesWithProducts]);

  const getBundlesContainingProduct = useCallback((productId: string): BundleWithProducts[] => {
    return getAllBundlesWithProducts().filter(b => b.productIds.includes(productId));
  }, [getAllBundlesWithProducts]);

  const addBundle = useCallback((data: BundleFormData): Bundle => {
    const newBundle: Bundle = {
      ...data,
      id: `bundle-${Date.now()}`,
      createdAt: Date.now(),
    };
    setBundles(prev => [...prev, newBundle]);
    return newBundle;
  }, []);

  const updateBundle = useCallback((id: string, data: Partial<BundleFormData>): Bundle | null => {
    let updatedBundle: Bundle | null = null;
    setBundles(prev => prev.map(bundle => {
      if (bundle.id === id) {
        updatedBundle = { ...bundle, ...data };
        return updatedBundle;
      }
      return bundle;
    }));
    return updatedBundle;
  }, []);

  const deleteBundle = useCallback((id: string): boolean => {
    let found = false;
    setBundles(prev => {
      const filtered = prev.filter(bundle => {
        if (bundle.id === id) {
          found = true;
          return false;
        }
        return true;
      });
      return filtered;
    });
    return found;
  }, []);

  return (
    <BundleContext.Provider value={{
      bundles,
      getBundleWithProducts,
      getAllBundlesWithProducts,
      getFeaturedBundles,
      getBundlesByCategory,
      getBundlesContainingProduct,
      addBundle,
      updateBundle,
      deleteBundle,
    }}>
      {children}
    </BundleContext.Provider>
  );
};
