import { createContext, use, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "./AuthContext";

export interface LiveActivity {
  id: string;
  type: "purchase" | "like" | "view" | "cart_add";
  productId: string;
  productName: string;
  productImage?: string;
  userName: string;
  timestamp: Date;
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

const anonymousNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Charlie", "Sam", "Jamie", "Drew", "Skyler", "Reese", "Parker", "Hayden",
];

const getAnonymousName = () => {
  const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
  const randomLocation = ["NYC", "LA", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Toronto"][
    Math.floor(Math.random() * 8)
  ];
  return `${randomName} from ${randomLocation}`;
};

function TrackedProductViewers({
  productId,
  sessionId,
  onCount,
}: {
  productId: string;
  sessionId: string;
  onCount: (productId: string, count: number) => void;
}) {
  const count = useQuery(api.liveActivity.getViewerCount, { productId });
  const ping = useMutation(api.liveActivity.pingViewer);
  const leave = useMutation(api.liveActivity.leaveViewer);

  useEffect(() => {
    ping({ productId, sessionId }).catch(console.error);
    const interval = setInterval(() => {
      ping({ productId, sessionId }).catch(console.error);
    }, 30000);
    return () => {
      clearInterval(interval);
      leave({ productId, sessionId }).catch(() => {});
    };
  }, [productId, sessionId, ping, leave]);

  useEffect(() => {
    onCount(productId, count ?? 0);
  }, [productId, count, onCount]);

  return null;
}

export function LiveActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const convexActivities = useQuery(api.liveActivity.listRecent);
  const logActivityMut = useMutation(api.liveActivity.logActivity);
  const pruneMut = useMutation(api.liveActivity.pruneStale);

  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [trackedProductIds, setTrackedProductIds] = useState<string[]>([]);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const recentActivities: LiveActivity[] = (convexActivities ?? []).map((a) => ({
    id: a.id,
    type: a.type as LiveActivity["type"],
    productId: a.productId,
    productName: a.productName,
    productImage: a.productImage,
    userName: a.userName,
    timestamp: new Date(a.timestamp),
  }));

  useEffect(() => {
    pruneMut({}).catch(() => {});
    const interval = setInterval(() => pruneMut({}).catch(() => {}), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pruneMut]);

  const handleViewerCount = useCallback((productId: string, count: number) => {
    setViewerCounts((prev) => ({ ...prev, [productId]: count }));
  }, []);

  const logActivity = async (
    type: LiveActivity["type"],
    productId: string,
    productName: string,
    productImage?: string
  ) => {
    try {
      const userName = user?.displayName?.split(" ")[0] || getAnonymousName();
      await logActivityMut({
        type,
        productId,
        productName,
        productImage,
        userName,
        userId: user?.uid || sessionId,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const logPurchase = (productId: string, productName: string, productImage?: string) =>
    logActivity("purchase", productId, productName, productImage);
  const logLike = (productId: string, productName: string, productImage?: string) =>
    logActivity("like", productId, productName, productImage);
  const logCartAdd = (productId: string, productName: string, productImage?: string) =>
    logActivity("cart_add", productId, productName, productImage);

  const trackProductView = useCallback((productId: string) => {
    setTrackedProductIds((prev) =>
      prev.includes(productId) ? prev : [...prev, productId]
    );
  }, []);

  const untrackProductView = useCallback((productId: string) => {
    setTrackedProductIds((prev) => prev.filter((id) => id !== productId));
    setViewerCounts((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const getViewerCount = useCallback(
    (productId: string) => viewerCounts[productId] || 0,
    [viewerCounts]
  );

  const contextValue = useMemo(
    () => ({
        recentActivities,
        viewerCounts,
        logPurchase,
        logLike,
        logCartAdd,
        trackProductView,
        untrackProductView,
        getViewerCount,
      }),
    [getViewerCount, logCartAdd, logLike, logPurchase, recentActivities, trackProductView, untrackProductView, viewerCounts]
  );

  return (
    <LiveActivityContext.Provider value={contextValue}>
      {trackedProductIds.map((productId) => (
        <TrackedProductViewers
          key={productId}
          productId={productId}
          sessionId={sessionId}
          onCount={handleViewerCount}
        />
      ))}
      {children}
    </LiveActivityContext.Provider>
  );
}

export function useLiveActivity() {
  const context = use(LiveActivityContext);
  if (!context) {
    throw new Error("useLiveActivity must be used within a LiveActivityProvider");
  }
  return context;
}
