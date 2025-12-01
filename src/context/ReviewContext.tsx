"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, collection, doc, getDocs, addDoc, query, where, serverTimestamp, deleteDoc } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
}

interface ReviewContextType {
  getProductReviews: (productId: string) => Promise<Review[]>;
  addReview: (review: Omit<Review, "id" | "userId" | "userEmail" | "userName" | "createdAt" | "helpful">) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  getAverageRating: (productId: string) => Promise<{ average: number; count: number }>;
  canUserReview: (productId: string) => Promise<boolean>;
  loading: boolean;
}

const ReviewContext = createContext<ReviewContextType>({
  getProductReviews: async () => [],
  addReview: async () => false,
  deleteReview: async () => false,
  getAverageRating: async () => ({ average: 0, count: 0 }),
  canUserReview: async () => false,
  loading: false,
});

export const useReviews = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getProductReviews = useCallback(async (productId: string): Promise<Review[]> => {
    setLoading(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Review;
      });

      // Sort by most recent
      return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      // Return empty array on error (Firestore permission issues, etc.)
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addReview = useCallback(async (
    review: Omit<Review, "id" | "userId" | "userEmail" | "userName" | "createdAt" | "helpful">
  ): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Check if user already reviewed this product
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef, 
        where("productId", "==", review.productId),
        where("userId", "==", user.uid)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        return false;
      }

      await addDoc(collection(db, "reviews"), {
        ...review,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        helpful: 0,
        createdAt: serverTimestamp(),
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getAverageRating = useCallback(async (productId: string): Promise<{ average: number; count: number }> => {
    try {
      const reviews = await getProductReviews(productId);
      if (reviews.length === 0) return { average: 0, count: 0 };
      
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      return { 
        average: Math.round((sum / reviews.length) * 10) / 10,
        count: reviews.length 
      };
    } catch {
      return { average: 0, count: 0 };
    }
  }, [getProductReviews]);

  const canUserReview = useCallback(async (productId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if user already reviewed
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("productId", "==", productId),
        where("userId", "==", user.uid)
      );
      const existing = await getDocs(q);
      
      return existing.empty;
    } catch {
      return false;
    }
  }, [user]);

  return (
    <ReviewContext.Provider
      value={{
        getProductReviews,
        addReview,
        deleteReview,
        getAverageRating,
        canUserReview,
        loading,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};
