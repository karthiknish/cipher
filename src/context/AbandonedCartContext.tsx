import { createContext, use, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "./AuthContext";
import { CartItem } from "./CartContext";
import { adminFetch } from "@/lib/admin-api";

const STORAGE_KEY = "cipher_cart_session";

export interface AbandonedCart {
  id: string;
  sessionId: string;
  userId?: string;
  email: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
  abandonedAt: Date;
  remindersSent: number;
  lastReminderAt?: Date;
  recovered: boolean;
  recoveredAt?: Date;
}

interface AbandonedCartContextType {
  abandonedCarts: AbandonedCart[];
  loading: boolean;
  syncCart: (items: CartItem[], total: number, email?: string) => Promise<void>;
  markCartAsRecovered: (cartId: string) => Promise<void>;
  sendReminder: (cartId: string) => Promise<{ success: boolean; message: string }>;
  sendBulkReminders: () => Promise<{ sent: number; failed: number }>;
  deleteAbandonedCart: (cartId: string) => Promise<void>;
  refreshCarts: () => Promise<void>;
  getStats: () => {
    total: number;
    potentialRevenue: number;
    remindersSent: number;
    recovered: number;
    hotLeads: number;
  };
}

const AbandonedCartContext = createContext<AbandonedCartContextType>({
  abandonedCarts: [],
  loading: true,
  syncCart: async () => {},
  markCartAsRecovered: async () => {},
  sendReminder: async () => ({ success: false, message: "" }),
  sendBulkReminders: async () => ({ sent: 0, failed: 0 }),
  deleteAbandonedCart: async () => {},
  refreshCarts: async () => {},
  getStats: () => ({
    total: 0,
    potentialRevenue: 0,
    remindersSent: 0,
    recovered: 0,
    hotLeads: 0,
  }),
});

export const useAbandonedCart = () => use(AbandonedCartContext);

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export const AbandonedCartProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const isAdmin = userRole?.isAdmin ?? false;

  const convexCarts = useQuery(
    api.abandonedCarts.listActive,
    isAdmin ? {} : "skip"
  );
  const upsertCart = useMutation(api.abandonedCarts.upsert);
  const markRecoveredMutation = useMutation(api.abandonedCarts.markRecovered);
  const recordReminder = useMutation(api.abandonedCarts.recordReminder);
  const removeCart = useMutation(api.abandonedCarts.remove);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState(0);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.uid);
      setCurrentEmail(user.email);
    } else {
      setCurrentUserId(null);
      setCurrentEmail(null);
    }
  }, [user?.uid, user?.email]);

  const abandonedCarts: AbandonedCart[] =
    convexCarts === undefined
      ? []
      : convexCarts.map((c) => ({
          id: c.id,
          sessionId: c.sessionId,
          userId: c.userId,
          email: c.email,
          items: c.items as CartItem[],
          total: c.total,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          abandonedAt: new Date(c.abandonedAt),
          remindersSent: c.remindersSent,
          lastReminderAt: c.lastReminderAt
            ? new Date(c.lastReminderAt)
            : undefined,
          recovered: c.recovered,
          recoveredAt: c.recoveredAt ? new Date(c.recoveredAt) : undefined,
        }));

  const loading = isAdmin ? convexCarts === undefined : false;

  const syncCart = useCallback(
    async (items: CartItem[], total: number, email?: string) => {
      const now = Date.now();
      if (now - lastSyncTime < 5000) return;
      setLastSyncTime(now);

      const sessionId = getSessionId();
      if (!sessionId) return;

      const cartKey = currentUserId || sessionId;

      await upsertCart({
        cartKey,
        sessionId,
        userId: currentUserId,
        email: email || currentEmail || null,
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color ?? null,
          image: item.image,
        })),
        total,
      });
    },
    [currentUserId, currentEmail, lastSyncTime, upsertCart]
  );

  const markCartAsRecovered = useCallback(
    async (cartId: string) => {
      await markRecoveredMutation({ cartKey: cartId });
    },
    [markRecoveredMutation]
  );

  const sendReminder = useCallback(
    async (cartId: string): Promise<{ success: boolean; message: string }> => {
      const cart = abandonedCarts.find((c) => c.id === cartId);
      if (!cart) return { success: false, message: "Cart not found" };
      if (!cart.email) return { success: false, message: "No email address available" };
      if (cart.remindersSent >= 3) {
        return { success: false, message: "Maximum reminders already sent" };
      }

      try {
        const response = await adminFetch("/api/cart-reminder", {
          method: "POST",
          body: JSON.stringify({
            cartId,
            email: cart.email,
            items: cart.items,
            total: cart.total,
            reminderNumber: cart.remindersSent + 1,
          }),
        });

        if (!response.ok) throw new Error("Failed to send reminder");

        await recordReminder({ cartKey: cartId });
        return { success: true, message: "Reminder sent successfully" };
      } catch (error) {
        console.error("Failed to send reminder:", error);
        return { success: false, message: "Failed to send reminder email" };
      }
    },
    [abandonedCarts, recordReminder]
  );

  const sendBulkReminders = useCallback(async () => {
    const cartsToNotify = abandonedCarts.filter(
      (cart) => cart.email && cart.remindersSent === 0
    );

    const outcomes = await Promise.all(
      cartsToNotify.map((cart) => sendReminder(cart.id))
    );
    const sent = outcomes.filter((r) => r.success).length;
    const failed = outcomes.length - sent;

    return { sent, failed };
  }, [abandonedCarts, sendReminder]);

  const deleteAbandonedCart = useCallback(
    async (cartId: string) => {
      await removeCart({ cartKey: cartId });
    },
    [removeCart]
  );

  const refreshCarts = useCallback(async () => {
    /* Convex useQuery refreshes automatically */
  }, []);

  const getStats = useCallback(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    return {
      total: abandonedCarts.length,
      potentialRevenue: abandonedCarts.reduce((sum, cart) => sum + cart.total, 0),
      remindersSent: abandonedCarts.filter((cart) => cart.remindersSent > 0).length,
      recovered: abandonedCarts.filter((cart) => cart.recovered).length,
      hotLeads: abandonedCarts.filter(
        (cart) => new Date(cart.abandonedAt).getTime() > twentyFourHoursAgo
      ).length,
    };
  }, [abandonedCarts]);

  const contextValue = useMemo(
    () => ({
        abandonedCarts,
        loading,
        syncCart,
        markCartAsRecovered,
        sendReminder,
        sendBulkReminders,
        deleteAbandonedCart,
        refreshCarts,
        getStats,
      }),
    [abandonedCarts, deleteAbandonedCart, getStats, loading, markCartAsRecovered, refreshCarts, sendBulkReminders, sendReminder, syncCart]
  );

  return (
    <AbandonedCartContext.Provider value={contextValue}>
      {children}
    </AbandonedCartContext.Provider>
  );
};
