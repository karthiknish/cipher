"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, collection, doc, getDocs, addDoc, query, where, serverTimestamp, deleteDoc, updateDoc, getDoc, setDoc } from "@/lib/firebase";
import { Timestamp, increment } from "firebase/firestore";

// ============================================
// Types
// ============================================

export interface ReviewMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export interface AdminReply {
  id: string;
  content: string;
  authorName: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  media?: ReviewMedia[];
  images?: string[]; // Legacy support
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  adminReply?: AdminReply;
  featured?: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  withMedia: number;
  verified: number;
}

interface ReviewContextType {
  // Read
  getProductReviews: (productId: string, options?: { 
    sortBy?: "recent" | "helpful" | "rating-high" | "rating-low";
    filterRating?: number;
    verifiedOnly?: boolean;
    withMediaOnly?: boolean;
  }) => Promise<Review[]>;
  getReviewStats: (productId: string) => Promise<ReviewStats>;
  canUserReview: (productId: string) => Promise<boolean>;
  getUserReviews: () => Promise<Review[]>;
  
  // Write
  addReview: (review: Omit<Review, "id" | "userId" | "userEmail" | "userName" | "createdAt" | "helpful" | "notHelpful" | "status" | "updatedAt">) => Promise<boolean>;
  updateReview: (reviewId: string, updates: Partial<Pick<Review, "rating" | "title" | "comment" | "media">>) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  
  // Voting
  voteHelpful: (reviewId: string, isHelpful: boolean) => Promise<boolean>;
  getUserVote: (reviewId: string) => Promise<"helpful" | "not-helpful" | null>;
  
  // Admin
  getAllReviews: () => Promise<Review[]>;
  moderateReview: (reviewId: string, status: "approved" | "rejected") => Promise<boolean>;
  addAdminReply: (reviewId: string, content: string) => Promise<boolean>;
  deleteAdminReply: (reviewId: string) => Promise<boolean>;
  featureReview: (reviewId: string, featured: boolean) => Promise<boolean>;
  
  // Legacy compatibility
  getAverageRating: (productId: string) => Promise<{ average: number; count: number }>;
  
  loading: boolean;
}

// ============================================
// Context
// ============================================

const ReviewContext = createContext<ReviewContextType>({
  getProductReviews: async () => [],
  getReviewStats: async () => ({ average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, withMedia: 0, verified: 0 }),
  canUserReview: async () => false,
  getUserReviews: async () => [],
  addReview: async () => false,
  updateReview: async () => false,
  deleteReview: async () => false,
  voteHelpful: async () => false,
  getUserVote: async () => null,
  getAllReviews: async () => [],
  moderateReview: async () => false,
  addAdminReply: async () => false,
  deleteAdminReply: async () => false,
  featureReview: async () => false,
  getAverageRating: async () => ({ average: 0, count: 0 }),
  loading: false,
});

export const useReviews = () => useContext(ReviewContext);

// ============================================
// Provider
// ============================================

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Helper to convert Firestore document to Review
  const docToReview = useCallback((docSnapshot: { id: string; data: () => Record<string, unknown> }): Review => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      productId: data.productId as string,
      userId: data.userId as string,
      userEmail: data.userEmail as string,
      userName: data.userName as string,
      rating: data.rating as number,
      title: data.title as string,
      comment: data.comment as string,
      media: data.media as ReviewMedia[] | undefined,
      images: data.images as string[] | undefined,
      verifiedPurchase: data.verifiedPurchase as boolean || false,
      helpful: data.helpful as number || 0,
      notHelpful: data.notHelpful as number || 0,
      adminReply: data.adminReply ? {
        ...data.adminReply as AdminReply,
        createdAt: (data.adminReply as { createdAt: Timestamp }).createdAt instanceof Timestamp 
          ? (data.adminReply as { createdAt: Timestamp }).createdAt.toDate() 
          : new Date((data.adminReply as { createdAt: string | number | Date }).createdAt),
      } : undefined,
      featured: data.featured as boolean || false,
      status: data.status as Review["status"] || "approved",
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string | number | Date),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt as string | number | Date) : undefined,
    };
  }, []);

  // Get reviews for a product with filtering/sorting
  const getProductReviews = useCallback(async (
    productId: string,
    options?: {
      sortBy?: "recent" | "helpful" | "rating-high" | "rating-low";
      filterRating?: number;
      verifiedOnly?: boolean;
      withMediaOnly?: boolean;
    }
  ): Promise<Review[]> => {
    setLoading(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      
      let reviews = snapshot.docs.map(docToReview);

      // Filter only approved reviews for non-admins
      if (!userRole?.isAdmin) {
        reviews = reviews.filter(r => r.status === "approved" || r.status === undefined);
      }

      // Apply filters
      if (options?.filterRating) {
        reviews = reviews.filter(r => r.rating === options.filterRating);
      }
      if (options?.verifiedOnly) {
        reviews = reviews.filter(r => r.verifiedPurchase);
      }
      if (options?.withMediaOnly) {
        reviews = reviews.filter(r => (r.media && r.media.length > 0) || (r.images && r.images.length > 0));
      }

      // Apply sorting
      const sortBy = options?.sortBy || "recent";
      switch (sortBy) {
        case "helpful":
          reviews.sort((a, b) => b.helpful - a.helpful);
          break;
        case "rating-high":
          reviews.sort((a, b) => b.rating - a.rating);
          break;
        case "rating-low":
          reviews.sort((a, b) => a.rating - b.rating);
          break;
        case "recent":
        default:
          reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return reviews;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [userRole, docToReview]);

  // Get review statistics for a product
  const getReviewStats = useCallback(async (productId: string): Promise<ReviewStats> => {
    try {
      const reviews = await getProductReviews(productId);
      
      if (reviews.length === 0) {
        return {
          average: 0,
          count: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          withMedia: 0,
          verified: 0,
        };
      }

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sum = 0;
      let withMedia = 0;
      let verified = 0;

      reviews.forEach(review => {
        sum += review.rating;
        distribution[review.rating as keyof typeof distribution]++;
        if ((review.media && review.media.length > 0) || (review.images && review.images.length > 0)) withMedia++;
        if (review.verifiedPurchase) verified++;
      });

      return {
        average: Math.round((sum / reviews.length) * 10) / 10,
        count: reviews.length,
        distribution,
        withMedia,
        verified,
      };
    } catch {
      return {
        average: 0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        withMedia: 0,
        verified: 0,
      };
    }
  }, [getProductReviews]);

  // Legacy compatibility
  const getAverageRating = useCallback(async (productId: string): Promise<{ average: number; count: number }> => {
    const stats = await getReviewStats(productId);
    return { average: stats.average, count: stats.count };
  }, [getReviewStats]);

  // Check if user has purchased and can review
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

  // Get user's own reviews
  const getUserReviews = useCallback(async (): Promise<Review[]> => {
    if (!user) return [];
    
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docToReview).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }, [user, docToReview]);

  // Add a new review
  const addReview = useCallback(async (
    review: Omit<Review, "id" | "userId" | "userEmail" | "userName" | "createdAt" | "helpful" | "notHelpful" | "status" | "updatedAt">
  ): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Check if user already reviewed this product
      const canReview = await canUserReview(review.productId);
      if (!canReview) return false;

      // Check if user has purchased this product (verified purchase)
      let verifiedPurchase = review.verifiedPurchase;
      try {
        const ordersRef = collection(db, "orders");
        const ordersQuery = query(ordersRef, where("userId", "==", user.uid));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        verifiedPurchase = ordersSnapshot.docs.some(docSnap => {
          const orderData = docSnap.data();
          return orderData.items?.some((item: { productId: string }) => item.productId === review.productId);
        });
      } catch {
        // If we can't verify, keep the original value
      }

      await addDoc(collection(db, "reviews"), {
        ...review,
        verifiedPurchase,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        helpful: 0,
        notHelpful: 0,
        status: "approved", // Auto-approve for now, could be "pending" for moderation
        createdAt: serverTimestamp(),
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, canUserReview]);

  // Update a review
  const updateReview = useCallback(async (
    reviewId: string,
    updates: Partial<Pick<Review, "rating" | "title" | "comment" | "media">>
  ): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewSnap = await getDoc(reviewRef);
      
      if (!reviewSnap.exists() || reviewSnap.data().userId !== user.uid) {
        return false;
      }

      await updateDoc(reviewRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const reviewSnap = await getDoc(reviewRef);
      
      // User can delete their own review, admin can delete any
      if (!reviewSnap.exists()) return false;
      if (reviewSnap.data().userId !== user.uid && !userRole?.isAdmin) {
        return false;
      }

      await deleteDoc(reviewRef);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  // Vote on a review
  const voteHelpful = useCallback(async (reviewId: string, isHelpful: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const voteRef = doc(db, "reviewVotes", `${user.uid}_${reviewId}`);
      const voteSnap = await getDoc(voteRef);
      const reviewRef = doc(db, "reviews", reviewId);

      if (voteSnap.exists()) {
        const existingVote = voteSnap.data().helpful as boolean;
        
        if (existingVote === isHelpful) {
          // Remove vote
          await deleteDoc(voteRef);
          await updateDoc(reviewRef, {
            [isHelpful ? "helpful" : "notHelpful"]: increment(-1),
          });
        } else {
          // Change vote
          await setDoc(voteRef, { helpful: isHelpful, odId: user.uid, reviewId });
          await updateDoc(reviewRef, {
            [isHelpful ? "helpful" : "notHelpful"]: increment(1),
            [!isHelpful ? "helpful" : "notHelpful"]: increment(-1),
          });
        }
      } else {
        // New vote
        await setDoc(voteRef, { helpful: isHelpful, odId: user.uid, reviewId });
        await updateDoc(reviewRef, {
          [isHelpful ? "helpful" : "notHelpful"]: increment(1),
        });
      }

      return true;
    } catch {
      return false;
    }
  }, [user]);

  // Get user's vote on a review
  const getUserVote = useCallback(async (reviewId: string): Promise<"helpful" | "not-helpful" | null> => {
    if (!user) return null;
    
    try {
      const voteRef = doc(db, "reviewVotes", `${user.uid}_${reviewId}`);
      const voteSnap = await getDoc(voteRef);
      
      if (!voteSnap.exists()) return null;
      return voteSnap.data().helpful ? "helpful" : "not-helpful";
    } catch {
      return null;
    }
  }, [user]);

  // Admin: Get all reviews
  const getAllReviews = useCallback(async (): Promise<Review[]> => {
    if (!userRole?.isAdmin) return [];
    
    setLoading(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const snapshot = await getDocs(reviewsRef);
      
      return snapshot.docs.map(docToReview).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [userRole, docToReview]);

  // Admin: Moderate a review
  const moderateReview = useCallback(async (reviewId: string, status: "approved" | "rejected"): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, { status, updatedAt: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  }, [userRole]);

  // Admin: Add reply to a review
  const addAdminReply = useCallback(async (reviewId: string, content: string): Promise<boolean> => {
    if (!userRole?.isAdmin || !user) return false;
    
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, {
        adminReply: {
          id: `reply_${Date.now()}`,
          content,
          authorName: user.displayName || "Cipher Team",
          createdAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch {
      return false;
    }
  }, [userRole, user]);

  // Admin: Delete reply from a review
  const deleteAdminReply = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, {
        adminReply: null,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch {
      return false;
    }
  }, [userRole]);

  // Admin: Feature/unfeature a review
  const featureReview = useCallback(async (reviewId: string, featured: boolean): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, { featured, updatedAt: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  }, [userRole]);

  return (
    <ReviewContext.Provider
      value={{
        getProductReviews,
        getReviewStats,
        canUserReview,
        getUserReviews,
        addReview,
        updateReview,
        deleteReview,
        voteHelpful,
        getUserVote,
        getAllReviews,
        moderateReview,
        addAdminReply,
        deleteAdminReply,
        featureReview,
        getAverageRating,
        loading,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};
