"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  recentlyViewed: RecentlyViewedItem[];
  addToRecentlyViewed: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearRecentlyViewed: () => void;
}

const STORAGE_KEY = "cipher_recently_viewed";
const MAX_ITEMS = 10;

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
  recentlyViewed: [],
  addToRecentlyViewed: () => {},
  clearRecentlyViewed: () => {},
});

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);

export const RecentlyViewedProvider = ({ children }: { children: ReactNode }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setRecentlyViewed(JSON.parse(stored));
        } catch {
          console.error("Failed to parse recently viewed from storage");
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    }
  }, [recentlyViewed, isLoaded]);

  const addToRecentlyViewed = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(i => i.id !== item.id);
      // Add to beginning with timestamp
      const newItem = { ...item, viewedAt: Date.now() };
      // Keep only MAX_ITEMS
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
};
