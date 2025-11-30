"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, doc, getDoc, setDoc, collection } from "@/lib/firebase";
import { onSnapshot, query, where, getDocs } from "firebase/firestore";

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  email: string;
  userId?: string;
  size?: string;
  createdAt: number;
  notified: boolean;
  notifiedAt?: number;
}

export interface BackInStockAlert {
  productId: string;
  productName: string;
  productImage: string;
  isAvailable: boolean;
  notifiedAt: number;
}

interface StockNotificationContextType {
  // User's notification subscriptions
  subscriptions: StockNotification[];
  // Alerts for products that are back in stock
  alerts: BackInStockAlert[];
  // Subscribe to notifications for a product
  subscribeToStock: (product: { id: string; name: string; image: string }, email: string, size?: string) => Promise<boolean>;
  // Unsubscribe from notifications
  unsubscribeFromStock: (productId: string, size?: string) => Promise<boolean>;
  // Check if user is subscribed to a product
  isSubscribed: (productId: string, size?: string) => boolean;
  // Mark alert as seen
  dismissAlert: (productId: string) => void;
  // Loading state
  loading: boolean;
}

const STORAGE_KEY = "cipher_stock_notifications";

const StockNotificationContext = createContext<StockNotificationContextType>({
  subscriptions: [],
  alerts: [],
  subscribeToStock: async () => false,
  unsubscribeFromStock: async () => false,
  isSubscribed: () => false,
  dismissAlert: () => {},
  loading: true,
});

export const useStockNotification = () => useContext(StockNotificationContext);

export const StockNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<StockNotification[]>([]);
  const [alerts, setAlerts] = useState<BackInStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      setLoading(true);

      if (user) {
        try {
          // Load from Firebase for logged-in users
          const userSubsDoc = await getDoc(doc(db, "stockNotifications", user.uid));
          if (userSubsDoc.exists()) {
            setSubscriptions(userSubsDoc.data().subscriptions || []);
          } else {
            // Migrate from localStorage if exists
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem(STORAGE_KEY);
              if (stored) {
                const localSubs = JSON.parse(stored);
                // Update with user info
                const updatedSubs = localSubs.map((sub: StockNotification) => ({
                  ...sub,
                  userId: user.uid,
                  email: user.email || sub.email,
                }));
                setSubscriptions(updatedSubs);
                await setDoc(doc(db, "stockNotifications", user.uid), { subscriptions: updatedSubs });
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          }
        } catch (error) {
          console.error("Error loading stock notifications:", error);
        }
      } else {
        // Load from localStorage for guests
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setSubscriptions(JSON.parse(stored));
            } catch {
              console.error("Failed to parse stock notifications");
            }
          }
        }
      }

      setLoading(false);
    };

    loadSubscriptions();
  }, [user]);

  // Save subscriptions
  useEffect(() => {
    if (loading) return;

    const saveSubscriptions = async () => {
      if (user) {
        try {
          await setDoc(doc(db, "stockNotifications", user.uid), { subscriptions });
        } catch (error) {
          console.error("Error saving stock notifications:", error);
        }
      } else if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
      }
    };

    saveSubscriptions();
  }, [subscriptions, user, loading]);

  // Simulate checking for back-in-stock products (in real app, this would be server-side)
  useEffect(() => {
    // Check periodically if subscribed products are back in stock
    const checkStock = () => {
      // In a real implementation, this would query the products collection
      // For demo, we'll randomly mark some as available
      const newAlerts: BackInStockAlert[] = [];
      
      subscriptions.forEach(sub => {
        if (!sub.notified && Math.random() > 0.8) {
          newAlerts.push({
            productId: sub.productId,
            productName: sub.productName,
            productImage: sub.productImage,
            isAvailable: true,
            notifiedAt: Date.now(),
          });
        }
      });

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts]);
        // Mark subscriptions as notified
        setSubscriptions(prev => 
          prev.map(sub => 
            newAlerts.some(a => a.productId === sub.productId)
              ? { ...sub, notified: true, notifiedAt: Date.now() }
              : sub
          )
        );
      }
    };

    // Check every 30 seconds (for demo purposes)
    const interval = setInterval(checkStock, 30000);
    
    // Initial check
    checkStock();

    return () => clearInterval(interval);
  }, [subscriptions]);

  const subscribeToStock = useCallback(async (
    product: { id: string; name: string; image: string },
    email: string,
    size?: string
  ): Promise<boolean> => {
    try {
      const newSubscription: StockNotification = {
        id: `${product.id}-${size || "all"}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        email,
        userId: user?.uid,
        size,
        createdAt: Date.now(),
        notified: false,
      };

      setSubscriptions(prev => {
        // Check if already subscribed
        const exists = prev.some(
          s => s.productId === product.id && s.size === size && !s.notified
        );
        if (exists) return prev;
        return [...prev, newSubscription];
      });

      return true;
    } catch (error) {
      console.error("Error subscribing to stock notification:", error);
      return false;
    }
  }, [user]);

  const unsubscribeFromStock = useCallback(async (
    productId: string,
    size?: string
  ): Promise<boolean> => {
    try {
      setSubscriptions(prev =>
        prev.filter(sub => !(sub.productId === productId && sub.size === size))
      );
      return true;
    } catch (error) {
      console.error("Error unsubscribing from stock notification:", error);
      return false;
    }
  }, []);

  const isSubscribed = useCallback((productId: string, size?: string): boolean => {
    return subscriptions.some(
      sub => sub.productId === productId && sub.size === size && !sub.notified
    );
  }, [subscriptions]);

  const dismissAlert = useCallback((productId: string) => {
    setAlerts(prev => prev.filter(alert => alert.productId !== productId));
  }, []);

  return (
    <StockNotificationContext.Provider
      value={{
        subscriptions,
        alerts,
        subscribeToStock,
        unsubscribeFromStock,
        isSubscribed,
        dismissAlert,
        loading,
      }}
    >
      {children}
    </StockNotificationContext.Provider>
  );
};
