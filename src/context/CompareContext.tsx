"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CompareItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  sizes: string[];
  material?: string;
  fit?: string;
}

interface CompareContextType {
  compareItems: CompareItem[];
  addToCompare: (item: CompareItem) => boolean;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
}

const MAX_COMPARE_ITEMS = 3;

const CompareContext = createContext<CompareContextType>({
  compareItems: [],
  addToCompare: () => false,
  removeFromCompare: () => {},
  isInCompare: () => false,
  clearCompare: () => {},
  canAddMore: true,
});

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  const canAddMore = compareItems.length < MAX_COMPARE_ITEMS;

  const isInCompare = useCallback((productId: string) => {
    return compareItems.some(item => item.id === productId);
  }, [compareItems]);

  const addToCompare = useCallback((item: CompareItem): boolean => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) return false;
    if (isInCompare(item.id)) return false;
    
    setCompareItems(prev => [...prev, item]);
    return true;
  }, [compareItems.length, isInCompare]);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
