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

  // Load wishlist from Firebase or localStorage
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      
      if (user) {
        // Load from Firebase for logged-in users
        try {
          const wishlistDoc = await getDoc(doc(db, "wishlists", user.uid));
          if (wishlistDoc.exists()) {
            setWishlist(wishlistDoc.data().items || []);
          } else {
            // Check localStorage and migrate to Firebase
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
              if (stored) {
                const localItems = JSON.parse(stored);
                setWishlist(localItems);
                // Save to Firebase
                await setDoc(doc(db, "wishlists", user.uid), { items: localItems });
                localStorage.removeItem(WISHLIST_STORAGE_KEY);
              }
            }
          }
        } catch (error) {
          console.error("Error loading wishlist:", error);
        }
      } else {
        // Load from localStorage for guests
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
          if (stored) {
            try {
              setWishlist(JSON.parse(stored));
            } catch {
              console.error("Failed to parse wishlist from storage");
            }
          }
        }
      }
      
      setLoading(false);
    };

    loadWishlist();
  }, [user]);

  // Save wishlist changes
  useEffect(() => {
    if (loading) return;

    const saveWishlist = async () => {
      if (user) {
        try {
          await setDoc(doc(db, "wishlists", user.uid), { items: wishlist });
        } catch (error) {
          console.error("Error saving wishlist:", error);
        }
      } else if (typeof window !== "undefined") {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      }
    };

    saveWishlist();
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
