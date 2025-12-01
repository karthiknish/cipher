"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  addedAt: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (item: Omit<WishlistItem, "addedAt">) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: Omit<WishlistItem, "addedAt">) => void;
  clearWishlist: () => void;
  loading: boolean;
}

const WISHLIST_STORAGE_KEY = "cipher_wishlist";

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  isInWishlist: () => false,
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  toggleWishlist: () => {},
  clearWishlist: () => {},
  loading: true,
});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage first, then try Firebase
  useEffect(() => {
    const loadWishlist = async () => {
      // Always load from localStorage first (instant)
      if (typeof window !== "undefined") {
        const storageKey = user ? `${WISHLIST_STORAGE_KEY}_${user.uid}` : WISHLIST_STORAGE_KEY;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setWishlist(JSON.parse(stored));
          } catch {
            // Invalid data
          }
        }
      }
      setLoading(false);
      
      // Then try to sync with Firebase in background (non-blocking)
      if (user) {
        try {
          const wishlistDoc = await getDoc(doc(db, "wishlists", user.uid));
          if (wishlistDoc.exists()) {
            const firebaseItems = wishlistDoc.data().items || [];
            setWishlist(firebaseItems);
            // Update localStorage cache
            localStorage.setItem(`${WISHLIST_STORAGE_KEY}_${user.uid}`, JSON.stringify(firebaseItems));
          }
        } catch {
          // Silently fail - use localStorage data
        }
      }
    };

    loadWishlist();
  }, [user]);

  // Save wishlist changes
  useEffect(() => {
    if (loading) return;

    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      const storageKey = user ? `${WISHLIST_STORAGE_KEY}_${user.uid}` : WISHLIST_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    }

    // Sync to Firebase in background (non-blocking)
    if (user) {
      setDoc(doc(db, "wishlists", user.uid), { items: wishlist }).catch(() => {
        // Silently fail - localStorage is the source of truth
      });
    }
  }, [wishlist, user, loading]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  const addToWishlist = useCallback((item: Omit<WishlistItem, "addedAt">) => {
    setWishlist(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  }, []);

  const toggleWishlist = useCallback((item: Omit<WishlistItem, "addedAt">) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
