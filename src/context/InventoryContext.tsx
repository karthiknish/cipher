"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface InventoryAlert {
  productId: string;
  stock: number;
  viewerCount: number;
  lastPurchased?: number; // timestamp
}

interface InventoryContextType {
  getInventoryAlert: (productId: string) => InventoryAlert | null;
  trackProductView: (productId: string) => void;
  simulatePurchase: (productId: string) => void;
}

// Simulated inventory data (in real app, this would come from backend)
const INITIAL_INVENTORY: Record<string, { stock: number; baseViewers: number }> = {
  // Low stock items for urgency
  "prod_1": { stock: 3, baseViewers: 8 },
  "prod_2": { stock: 5, baseViewers: 12 },
  "prod_3": { stock: 2, baseViewers: 15 },
  "prod_4": { stock: 8, baseViewers: 6 },
  "prod_5": { stock: 4, baseViewers: 10 },
  "prod_6": { stock: 1, baseViewers: 18 },
  "prod_7": { stock: 6, baseViewers: 7 },
  "prod_8": { stock: 3, baseViewers: 14 },
};

const InventoryContext = createContext<InventoryContextType>({
  getInventoryAlert: () => null,
  trackProductView: () => {},
  simulatePurchase: () => {},
});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventory, setInventory] = useState<Record<string, InventoryAlert>>({});
  const [activeViewers, setActiveViewers] = useState<Record<string, number>>({});

  // Initialize inventory on mount
  useEffect(() => {
    const initialData: Record<string, InventoryAlert> = {};
    Object.entries(INITIAL_INVENTORY).forEach(([id, data]) => {
      initialData[id] = {
        productId: id,
        stock: data.stock,
        viewerCount: data.baseViewers + Math.floor(Math.random() * 5),
        lastPurchased: Date.now() - Math.floor(Math.random() * 3600000), // Random time in last hour
      };
    });
    setInventory(initialData);
  }, []);

  // Simulate live viewer fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setInventory(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const baseViewers = INITIAL_INVENTORY[id]?.baseViewers || 5;
          updated[id] = {
            ...updated[id],
            viewerCount: Math.max(1, Math.min(baseViewers + 10, updated[id].viewerCount + change)),
          };
        });
        return updated;
      });
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Track when user views a product
  const trackProductView = useCallback((productId: string) => {
    setActiveViewers(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));

    // Simulate viewer leaving after some time
    setTimeout(() => {
      setActiveViewers(prev => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) - 1),
      }));
    }, 30000 + Math.random() * 60000); // 30-90 seconds
  }, []);

  // Simulate a purchase (reduces stock)
  const simulatePurchase = useCallback((productId: string) => {
    setInventory(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          stock: Math.max(0, prev[productId].stock - 1),
          lastPurchased: Date.now(),
        },
      };
    });
  }, []);

  const getInventoryAlert = useCallback((productId: string): InventoryAlert | null => {
    const data = inventory[productId];
    if (!data) {
      // Return random data for products not in the initial list
      return {
        productId,
        stock: 5 + Math.floor(Math.random() * 10),
        viewerCount: 3 + Math.floor(Math.random() * 8),
      };
    }
    return {
      ...data,
      viewerCount: data.viewerCount + (activeViewers[productId] || 0),
    };
  }, [inventory, activeViewers]);

  return (
    <InventoryContext.Provider
      value={{
        getInventoryAlert,
        trackProductView,
        simulatePurchase,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
