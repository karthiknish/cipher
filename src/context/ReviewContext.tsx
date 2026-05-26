"use client";
import { createContext, use, useState, useCallback, ReactNode, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export const useReviews = () => use(ReviewContext);

// ============================================
// Provider
// ============================================

function mapReview(r: {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  media?: unknown;
  images?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  adminReply?: AdminReply & { createdAt?: number | Date };
  featured: boolean;
  status: string;
  createdAt: number;
  updatedAt?: number;
}): Review {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    userEmail: r.userEmail,
    userName: r.userName,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    media: r.media as ReviewMedia[] | undefined,
    images: r.images,
    verifiedPurchase: r.verifiedPurchase,
    helpful: r.helpful,
    notHelpful: r.notHelpful,
    featured: r.featured,
    status: r.status as Review["status"],
    createdAt: new Date(r.createdAt),
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    adminReply: r.adminReply
      ? {
          ...r.adminReply,
          createdAt: new Date(r.adminReply.createdAt ?? Date.now()),
        }
      : undefined,
  };
}

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const convex = useConvex();
  const [loading, setLoading] = useState(false);

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
      let reviews = (
        await convex.query(api.reviews.listByProduct, { productId })
      ).map((r) => mapReview(r as never));

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
  }, [userRole, convex]);

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
      return await convex.query(api.reviews.canUserReview, { productId });
    } catch {
      return false;
    }
  }, [user, convex]);

  // Get user's own reviews
  const getUserReviews = useCallback(async (): Promise<Review[]> => {
    if (!user) return [];
    
    try {
      return (await convex.query(api.reviews.listByUser, {}))
        .map((r) => mapReview(r as never))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }, [user, convex]);

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

      await convex.mutation(api.reviews.create, {
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        media: review.media,
        images: review.images,
        verifiedPurchase: review.verifiedPurchase,
        userEmail: user.email ?? "",
        userName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
      });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, canUserReview, convex]);

  // Update a review
  const updateReview = useCallback(async (
    reviewId: string,
    updates: Partial<Pick<Review, "rating" | "title" | "comment" | "media">>
  ): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await convex.mutation(api.reviews.update, { id: reviewId, patch: updates });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, convex]);

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await convex.mutation(api.reviews.remove, { id: reviewId });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, userRole, convex]);

  // Vote on a review
  const voteHelpful = useCallback(async (reviewId: string, isHelpful: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await convex.mutation(api.reviews.vote, { reviewId, isHelpful });
      return true;
    } catch {
      return false;
    }
  }, [user, convex]);

  // Get user's vote on a review
  const getUserVote = useCallback(async (reviewId: string): Promise<"helpful" | "not-helpful" | null> => {
    if (!user) return null;
    
    try {
      return await convex.query(api.reviews.getUserVote, { reviewId });
    } catch {
      return null;
    }
  }, [user, convex]);

  // Admin: Get all reviews
  const getAllReviews = useCallback(async (): Promise<Review[]> => {
    if (!userRole?.isAdmin) return [];
    
    setLoading(true);
    try {
      return (await convex.query(api.reviews.listAll, {}))
        .map((r) => mapReview(r as never))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [userRole, convex]);

  // Admin: Moderate a review
  const moderateReview = useCallback(async (reviewId: string, status: "approved" | "rejected"): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      await convex.mutation(api.reviews.moderate, { id: reviewId, status });
      return true;
    } catch {
      return false;
    }
  }, [userRole, convex]);

  // Admin: Add reply to a review
  const addAdminReply = useCallback(async (reviewId: string, content: string): Promise<boolean> => {
    if (!userRole?.isAdmin || !user) return false;
    
    try {
      await convex.mutation(api.reviews.setAdminReply, {
        id: reviewId,
        content,
        authorName: user.displayName || "Cipher Team",
      });
      return true;
    } catch {
      return false;
    }
  }, [userRole, user, convex]);

  // Admin: Delete reply from a review
  const deleteAdminReply = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      await convex.mutation(api.reviews.clearAdminReply, { id: reviewId });
      return true;
    } catch {
      return false;
    }
  }, [userRole, convex]);

  // Admin: Feature/unfeature a review
  const featureReview = useCallback(async (reviewId: string, featured: boolean): Promise<boolean> => {
    if (!userRole?.isAdmin) return false;
    
    try {
      await convex.mutation(api.reviews.setFeatured, { id: reviewId, featured });
      return true;
    } catch {
      return false;
    }
  }, [userRole, convex]);

  const contextValue = useMemo(
    () => ({
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
      }),
    [addAdminReply, addReview, canUserReview, deleteAdminReply, deleteReview, featureReview, getAllReviews, getAverageRating, getProductReviews, getReviewStats, getUserReviews, getUserVote, loading, moderateReview, updateReview, voteHelpful]
  );

  return (
    <ReviewContext.Provider value={contextValue}>
      {children}
    </ReviewContext.Provider>
  );
};
