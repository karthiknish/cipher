"use client";
import { createContext, use, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export const useWishlist = () => use(WishlistContext);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const convexItems = useQuery(
    api.wishlists.getMine,
    user ? {} : "skip"
  );
  const setItemsMutation = useMutation(api.wishlists.setItems);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const storageKey = user
      ? `${WISHLIST_STORAGE_KEY}_${user.uid}`
      : WISHLIST_STORAGE_KEY;
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    } else if (!user) {
      setWishlist([]);
    }
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    if (user && convexItems !== undefined) {
      const items = (convexItems as WishlistItem[]) ?? [];
      if (items.length > 0 || synced) {
        setWishlist(items);
        localStorage.setItem(
          `${WISHLIST_STORAGE_KEY}_${user.uid}`,
          JSON.stringify(items)
        );
      }
      setSynced(true);
    }
  }, [user, convexItems, synced]);

  const persist = useCallback(
    (items: WishlistItem[]) => {
      const storageKey = user
        ? `${WISHLIST_STORAGE_KEY}_${user.uid}`
        : WISHLIST_STORAGE_KEY;
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(items));
      }
      if (user) {
        setItemsMutation({ items }).catch(() => {});
      }
    },
    [user, setItemsMutation]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((item) => item.id === productId),
    [wishlist]
  );

  const addToWishlist = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setWishlist((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        const next = [...prev, { ...item, addedAt: Date.now() }];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const next = prev.filter((item) => item.id !== productId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleWishlist = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      if (isInWishlist(item.id)) removeFromWishlist(item.id);
      else addToWishlist(item);
    },
    [isInWishlist, removeFromWishlist, addToWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    persist([]);
  }, [persist]);

  const contextValue = useMemo(
    () => ({
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        loading: user ? loading || convexItems === undefined : loading,
      }),
    [addToWishlist, clearWishlist, isInWishlist, removeFromWishlist, toggleWishlist, wishlist]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};
