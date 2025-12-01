"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  colorHex?: string;
  image: string;
  category?: string;
  bundleId?: string;
  bundleName?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string, color?: string) => void;
  updateQuantity: (id: string, size: string, quantity: number, color?: string) => void;
  clearCart: (markAsRecovered?: boolean) => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CART_STORAGE_KEY = "cipher_cart";
const CART_SESSION_KEY = "cipher_cart_session";
const FREE_SHIPPING_THRESHOLD = 150;
const TAX_RATE = 0.08; // 8% tax
const SYNC_DEBOUNCE = 5000; // 5 seconds debounce for Firebase sync

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0,
});

export const useCart = () => useContext(CartContext);

// Generate or retrieve session ID for tracking anonymous carts
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const lastSyncRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentEmail(user.email);
      } else {
        setCurrentUserId(null);
        setCurrentEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch {
          console.error("Failed to parse cart from storage");
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Sync cart to Firebase for abandoned cart tracking (debounced)
  const syncToFirebase = useCallback(async (cartItems: CartItem[], cartTotal: number) => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const cartId = currentUserId || sessionId;

    try {
      if (cartItems.length === 0) {
        // Delete the abandoned cart record if cart is empty
        await deleteDoc(doc(db, "abandonedCarts", cartId)).catch(() => {});
        return;
      }

      const cartRef = doc(db, "abandonedCarts", cartId);
      const existingCart = await getDoc(cartRef);

      const cartData = {
        sessionId,
        userId: currentUserId || null,
        email: currentEmail || "",
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color || null,
          image: item.image,
        })),
        total: cartTotal,
        updatedAt: serverTimestamp(),
        abandonedAt: serverTimestamp(),
        recovered: false,
      };

      if (existingCart.exists()) {
        await updateDoc(cartRef, cartData);
      } else {
        await setDoc(cartRef, {
          ...cartData,
          createdAt: serverTimestamp(),
          remindersSent: 0,
        });
      }
    } catch (error) {
      console.error("Failed to sync cart to Firebase:", error);
    }
  }, [currentUserId, currentEmail]);

  // Debounced sync function
  const debouncedSync = useCallback((cartItems: CartItem[], cartTotal: number) => {
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule new sync after debounce period
    syncTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastSyncRef.current >= SYNC_DEBOUNCE) {
        lastSyncRef.current = now;
        syncToFirebase(cartItems, cartTotal);
      }
    }, SYNC_DEBOUNCE);
  }, [syncToFirebase]);

  // Save cart to localStorage when it changes and sync to Firebase
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      
      // Calculate total for sync
      const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      debouncedSync(cart, cartTotal);
    }
  }, [cart, isLoaded, debouncedSync]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      // Check if same product with same size AND color exists
      const existing = prev.find(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id: string, size: string, color?: string) => {
    setCart((prev) => prev.filter(
      (item) => !(item.id === id && item.size === size && item.color === color)
    ));
  };

  const updateQuantity = (id: string, size: string, quantity: number, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.color === color 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Mark cart as recovered in Firebase when purchase is completed
  const markCartAsRecovered = useCallback(async () => {
    const sessionId = getSessionId();
    const cartId = currentUserId || sessionId;
    if (!cartId) return;

    try {
      const cartRef = doc(db, "abandonedCarts", cartId);
      await updateDoc(cartRef, {
        recovered: true,
        recoveredAt: serverTimestamp(),
      });
    } catch (error) {
      // Cart may not exist in Firebase, ignore error
      console.debug("Could not mark cart as recovered:", error);
    }
  }, [currentUserId]);

  const clearCart = async (shouldMarkAsRecovered: boolean = false) => {
    if (shouldMarkAsRecovered) {
      await markCartAsRecovered();
    }
    setCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        shipping,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
