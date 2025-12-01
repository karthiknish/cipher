"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CartItem } from "./CartContext";

// Threshold for considering a cart as abandoned (in milliseconds)
const ABANDONMENT_THRESHOLD = 30 * 60 * 1000; // 30 minutes
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
  getStats: () => ({ total: 0, potentialRevenue: 0, remindersSent: 0, recovered: 0, hotLeads: 0 }),
});

export const useAbandonedCart = () => useContext(AbandonedCartContext);

// Generate or retrieve session ID for anonymous users
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export const AbandonedCartProvider = ({ children }: { children: ReactNode }) => {
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentEmail(user.email);
        
        // Check if user is admin
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
      } else {
        setCurrentUserId(null);
        setCurrentEmail(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch abandoned carts (admin only)
  const fetchAbandonedCarts = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const cartsRef = collection(db, "abandonedCarts");
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all non-recovered carts from the last 30 days
      const q = query(
        cartsRef,
        where("recovered", "==", false)
      );
      
      const snapshot = await getDocs(q);
      const carts: AbandonedCart[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const abandonedAt = data.abandonedAt?.toDate?.() || data.abandonedAt;
        
        // Only include carts abandoned in the last 30 days
        if (abandonedAt && new Date(abandonedAt) > thirtyDaysAgo) {
          carts.push({
            id: doc.id,
            sessionId: data.sessionId,
            userId: data.userId,
            email: data.email,
            items: data.items || [],
            total: data.total || 0,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            abandonedAt: abandonedAt,
            remindersSent: data.remindersSent || 0,
            lastReminderAt: data.lastReminderAt?.toDate?.(),
            recovered: data.recovered || false,
            recoveredAt: data.recoveredAt?.toDate?.(),
          });
        }
      });

      // Sort by abandonedAt descending (most recent first)
      carts.sort((a, b) => 
        new Date(b.abandonedAt).getTime() - new Date(a.abandonedAt).getTime()
      );

      setAbandonedCarts(carts);
    } catch (error) {
      console.error("Failed to fetch abandoned carts:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAbandonedCarts();
    }
  }, [isAdmin, fetchAbandonedCarts]);

  // Sync current cart to Firebase for tracking
  const syncCart = useCallback(async (items: CartItem[], total: number, email?: string) => {
    // Debounce syncing - don't sync more than once every 5 seconds
    const now = Date.now();
    if (now - lastSyncTime < 5000) return;
    setLastSyncTime(now);

    if (items.length === 0) {
      // If cart is empty, delete any existing abandoned cart record
      const sessionId = getSessionId();
      if (sessionId) {
        try {
          await deleteDoc(doc(db, "abandonedCarts", sessionId));
        } catch {
          // Ignore errors when deleting non-existent cart
        }
      }
      return;
    }

    const userEmail = email || currentEmail || "";
    const sessionId = getSessionId();
    
    if (!sessionId) return;

    try {
      const cartRef = doc(db, "abandonedCarts", currentUserId || sessionId);
      const existingCart = await getDoc(cartRef);
      
      const cartData = {
        sessionId,
        userId: currentUserId || null,
        email: userEmail,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
        })),
        total,
        updatedAt: serverTimestamp(),
        recovered: false,
      };

      if (existingCart.exists()) {
        await updateDoc(cartRef, {
          ...cartData,
          abandonedAt: serverTimestamp(), // Reset abandonment time on activity
        });
      } else {
        await setDoc(cartRef, {
          ...cartData,
          createdAt: serverTimestamp(),
          abandonedAt: serverTimestamp(),
          remindersSent: 0,
        });
      }
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  }, [currentUserId, currentEmail, lastSyncTime]);

  // Mark a cart as recovered (when user completes purchase)
  const markCartAsRecovered = useCallback(async (cartId: string) => {
    try {
      const cartRef = doc(db, "abandonedCarts", cartId);
      await updateDoc(cartRef, {
        recovered: true,
        recoveredAt: serverTimestamp(),
      });
      
      // Update local state
      setAbandonedCarts(prev => 
        prev.filter(cart => cart.id !== cartId)
      );
    } catch (error) {
      console.error("Failed to mark cart as recovered:", error);
    }
  }, []);

  // Send reminder email for a specific cart
  const sendReminder = useCallback(async (cartId: string): Promise<{ success: boolean; message: string }> => {
    const cart = abandonedCarts.find(c => c.id === cartId);
    if (!cart) {
      return { success: false, message: "Cart not found" };
    }

    if (!cart.email) {
      return { success: false, message: "No email address available" };
    }

    // Check if already sent 3 reminders
    if (cart.remindersSent >= 3) {
      return { success: false, message: "Maximum reminders already sent" };
    }

    try {
      // Call the email API endpoint
      const response = await fetch("/api/cart-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          email: cart.email,
          items: cart.items,
          total: cart.total,
          reminderNumber: cart.remindersSent + 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reminder");
      }

      // Update reminder count in Firestore
      const cartRef = doc(db, "abandonedCarts", cartId);
      await updateDoc(cartRef, {
        remindersSent: cart.remindersSent + 1,
        lastReminderAt: serverTimestamp(),
      });

      // Update local state
      setAbandonedCarts(prev =>
        prev.map(c =>
          c.id === cartId
            ? { ...c, remindersSent: c.remindersSent + 1, lastReminderAt: new Date() }
            : c
        )
      );

      return { success: true, message: "Reminder sent successfully" };
    } catch (error) {
      console.error("Failed to send reminder:", error);
      return { success: false, message: "Failed to send reminder email" };
    }
  }, [abandonedCarts]);

  // Send reminders to all carts that haven't received one yet
  const sendBulkReminders = useCallback(async (): Promise<{ sent: number; failed: number }> => {
    const cartsToNotify = abandonedCarts.filter(
      cart => cart.email && cart.remindersSent === 0
    );

    let sent = 0;
    let failed = 0;

    for (const cart of cartsToNotify) {
      const result = await sendReminder(cart.id);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
      // Add small delay between emails
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { sent, failed };
  }, [abandonedCarts, sendReminder]);

  // Delete an abandoned cart
  const deleteAbandonedCart = useCallback(async (cartId: string) => {
    try {
      await deleteDoc(doc(db, "abandonedCarts", cartId));
      setAbandonedCarts(prev => prev.filter(cart => cart.id !== cartId));
    } catch (error) {
      console.error("Failed to delete abandoned cart:", error);
    }
  }, []);

  // Get stats for the admin dashboard
  const getStats = useCallback(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    return {
      total: abandonedCarts.length,
      potentialRevenue: abandonedCarts.reduce((sum, cart) => sum + cart.total, 0),
      remindersSent: abandonedCarts.filter(cart => cart.remindersSent > 0).length,
      recovered: abandonedCarts.filter(cart => cart.recovered).length,
      hotLeads: abandonedCarts.filter(
        cart => new Date(cart.abandonedAt).getTime() > twentyFourHoursAgo
      ).length,
    };
  }, [abandonedCarts]);

  return (
    <AbandonedCartContext.Provider
      value={{
        abandonedCarts,
        loading,
        syncCart,
        markCartAsRecovered,
        sendReminder,
        sendBulkReminders,
        deleteAbandonedCart,
        refreshCarts: fetchAbandonedCarts,
        getStats,
      }}
    >
      {children}
    </AbandonedCartContext.Provider>
  );
};
