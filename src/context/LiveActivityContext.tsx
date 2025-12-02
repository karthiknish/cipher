"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, addDoc, deleteDoc, query, orderBy, limit, where, serverTimestamp, setDoc, Timestamp, getDocs, writeBatch } from "firebase/firestore";

export interface LiveActivity {
  id: string;
  type: "purchase" | "like" | "view" | "cart_add";
  productId: string;
  productName: string;
  productImage?: string;
  userName: string; // anonymized or first name
  timestamp: Date;
}

export interface ViewerCount {
  productId: string;
  count: number;
}

interface LiveActivityContextType {
  recentActivities: LiveActivity[];
  viewerCounts: Record<string, number>;
  logPurchase: (productId: string, productName: string, productImage?: string) => Promise<void>;
  logLike: (productId: string, productName: string, productImage?: string) => Promise<void>;
  logCartAdd: (productId: string, productName: string, productImage?: string) => Promise<void>;
  trackProductView: (productId: string) => void;
  untrackProductView: (productId: string) => void;
  getViewerCount: (productId: string) => number;
}

const LiveActivityContext = createContext<LiveActivityContextType | undefined>(undefined);

// Generate anonymous display names for privacy
const anonymousNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Charlie", "Sam", "Jamie", "Drew", "Skyler", "Reese", "Parker", "Hayden"
];

const getAnonymousName = () => {
  const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
  const randomLocation = ["NYC", "LA", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Toronto"][Math.floor(Math.random() * 8)];
  return `${randomName} from ${randomLocation}`;
};

export function LiveActivityProvider({ children }: { children: ReactNode }) {
  const [recentActivities, setRecentActivities] = useState<LiveActivity[]>([]);
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [trackedProducts, setTrackedProducts] = useState<Set<string>>(new Set());
  const trackedProductsRef = useRef(trackedProducts);
  useEffect(() => {
    trackedProductsRef.current = trackedProducts;
  }, [trackedProducts]);

  const heartbeatIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const viewerListenersRef = useRef<Record<string, () => void>>({});

  // Generate a unique session ID for this browser session
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Subscribe to recent activities (last 10)
  useEffect(() => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const q = query(
      collection(db, "liveActivities"),
      where("timestamp", ">", Timestamp.fromDate(thirtyMinutesAgo)),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities: LiveActivity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: data.type,
          productId: data.productId,
          productName: data.productName,
          productImage: data.productImage,
          userName: data.userName,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      setRecentActivities(activities);
    }, (error) => {
      console.error("Error fetching live activities:", error);
    });

    return () => unsubscribe();
  }, []);

  const cleanupViewer = useCallback((productId: string) => {
    const heartbeat = heartbeatIntervalsRef.current[productId];
    if (heartbeat) {
      clearInterval(heartbeat);
      delete heartbeatIntervalsRef.current[productId];
    }

    const unsubscribe = viewerListenersRef.current[productId];
    if (unsubscribe) {
      unsubscribe();
      delete viewerListenersRef.current[productId];
    }

    const viewerRef = doc(db, "productViewers", productId, "viewers", sessionId);
    deleteDoc(viewerRef).catch(() => {});

    setViewerCounts(prev => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    setTrackedProducts(prev => {
      if (!prev.has(productId)) return prev;
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, [sessionId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      trackedProductsRef.current.forEach(productId => {
        cleanupViewer(productId);
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cleanupViewer]);

  // Cleanup old activities periodically (server-side would be better, but this works for demo)
  useEffect(() => {
    const cleanupOldActivities = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const q = query(
          collection(db, "liveActivities"),
          where("timestamp", "<", Timestamp.fromDate(oneHourAgo)),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot.size > 0) {
          const batch = writeBatch(db);
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      } catch (error) {
        // Silently fail - cleanup is not critical
      }
    };

    // Cleanup on mount and every 10 minutes
    cleanupOldActivities();
    const interval = setInterval(cleanupOldActivities, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const logActivity = async (
    type: LiveActivity["type"],
    productId: string,
    productName: string,
    productImage?: string
  ) => {
    try {
      const userName = auth.currentUser?.displayName?.split(" ")[0] || getAnonymousName();
      
      await addDoc(collection(db, "liveActivities"), {
        type,
        productId,
        productName,
        productImage,
        userName,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || sessionId,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const logPurchase = async (productId: string, productName: string, productImage?: string) => {
    await logActivity("purchase", productId, productName, productImage);
  };

  const logLike = async (productId: string, productName: string, productImage?: string) => {
    await logActivity("like", productId, productName, productImage);
  };

  const logCartAdd = async (productId: string, productName: string, productImage?: string) => {
    await logActivity("cart_add", productId, productName, productImage);
  };

  const trackProductView = useCallback((productId: string) => {
    if (trackedProducts.has(productId)) return;
    
    setTrackedProducts(prev => new Set(prev).add(productId));
    
    const viewerRef = doc(db, "productViewers", productId, "viewers", sessionId);
    setDoc(viewerRef, {
      sessionId,
      timestamp: serverTimestamp(),
      lastActive: serverTimestamp(),
    }).catch(console.error);

    const viewerCollectionRef = collection(db, "productViewers", productId, "viewers");
    const unsubscribeViewers = onSnapshot(viewerCollectionRef, (snapshot) => {
      setViewerCounts(prev => ({
        ...prev,
        [productId]: snapshot.size,
      }));
    }, (error) => {
      console.error("Error tracking viewer count:", error);
    });
    viewerListenersRef.current[productId] = unsubscribeViewers;

    const heartbeatInterval = setInterval(async () => {
      try {
        await setDoc(viewerRef, {
          lastActive: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    heartbeatIntervalsRef.current[productId] = heartbeatInterval;

    return () => {
      cleanupViewer(productId);
    };
  }, [trackedProducts, sessionId, cleanupViewer]);

  const untrackProductView = useCallback((productId: string) => {
    if (!trackedProducts.has(productId)) return;
    cleanupViewer(productId);
  }, [trackedProducts, cleanupViewer]);

  const getViewerCount = useCallback((productId: string): number => {
    return viewerCounts[productId] || 0;
  }, [viewerCounts]);

  return (
    <LiveActivityContext.Provider value={{
      recentActivities,
      viewerCounts,
      logPurchase,
      logLike,
      logCartAdd,
      trackProductView,
      untrackProductView,
      getViewerCount,
    }}>
      {children}
    </LiveActivityContext.Provider>
  );
}

export function useLiveActivity() {
  const context = useContext(LiveActivityContext);
  if (!context) {
    throw new Error("useLiveActivity must be used within a LiveActivityProvider");
  }
  return context;
}
