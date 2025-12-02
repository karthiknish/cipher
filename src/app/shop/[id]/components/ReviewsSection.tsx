"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Star, X, SpinnerGap } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useReviews, Review } from "@/context/ReviewContext";
import StarRating from "./StarRating";
import ReviewCard from "./ReviewCard";
import ReviewFormModal from "./ReviewFormModal";

interface ReviewsSectionProps {
  productId: string;
  reviews: Review[];
  avgRating: { average: number; count: number };
  canReview: boolean;
  onReviewAdded: () => void;
}

export default function ReviewsSection({ 
  productId, 
  reviews: initialReviews, 
  avgRating, 
  canReview, 
  onReviewAdded 
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const { getProductReviews, getReviewStats } = useReviews();
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getReviewStats>> | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating-high" | "rating-low">("recent");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [withMediaOnly, setWithMediaOnly] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getReviewStats(productId).then(setStats);
  }, [productId, getReviewStats]);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleFilterChange = useCallback(async () => {
    setIsLoading(true);
    const filtered = await getProductReviews(productId, {
      sortBy,
      filterRating: filterRating || undefined,
      verifiedOnly,
      withMediaOnly,
    });
    setReviews(filtered);
    setIsLoading(false);
  }, [productId, sortBy, filterRating, verifiedOnly, withMediaOnly, getProductReviews]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const handleReviewAdded = () => {
    onReviewAdded();
    getReviewStats(productId).then(setStats);
    setIsReviewModalOpen(false);
  };

  const refreshReviews = () => {
    handleFilterChange();
    getReviewStats(productId).then(setStats);
  };

  return (
    <div>
      {/* Write Review Button */}
      {user && canReview && (
        <button 
          onClick={() => setIsReviewModalOpen(true)} 
          className="mb-8 bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition flex items-center gap-2"
        >
          <Star className="w-4 h-4" /> WRITE A REVIEW
        </button>
      )}
      {!user && (
        <p className="mb-8 text-gray-500">
          <Link href="/login" className="underline">Log in</Link> to write a review.
        </p>
      )}

      {/* Stats Section */}
      {stats && stats.count > 0 && (
        <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
          {/* Overall Rating */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-light">{stats.average.toFixed(1)}</div>
              <StarRating rating={Math.round(stats.average)} size="md" />
              <p className="text-sm text-gray-500 mt-1">{stats.count} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`flex items-center gap-2 w-full group ${
                    filterRating === star ? "text-black" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span className="text-xs w-3">{star}</span>
                  <Star className="w-3 h-3" weight={filterRating === star ? "fill" : "regular"} />
                  <div className="flex-1 h-2 bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all"
                      style={{ 
                        width: `${stats.count > 0 ? (stats.distribution[star as keyof typeof stats.distribution] / stats.count) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs w-6 text-right">{stats.distribution[star as keyof typeof stats.distribution]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
              <div className="text-xl font-medium text-green-600">{stats.verified}</div>
              <p className="text-xs text-gray-500">Verified Purchases</p>
            </div>
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
              <div className="text-xl font-medium text-purple-600">{stats.withMedia}</div>
              <p className="text-xs text-gray-500">With Photos/Videos</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {avgRating.count > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating-high">Highest Rated</option>
            <option value="rating-low">Lowest Rated</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            Verified only
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={withMediaOnly}
              onChange={(e) => setWithMediaOnly(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            With photos/videos
          </label>

          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
            >
              <X className="w-3 h-3" /> {filterRating} star filter
            </button>
          )}
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerGap className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="max-w-2xl">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onVote={refreshReviews} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>{filterRating || verifiedOnly || withMediaOnly 
            ? "No reviews match your filters" 
            : "No reviews yet. Be the first to share your thoughts!"
          }</p>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <ReviewFormModal 
            isOpen={isReviewModalOpen} 
            onClose={() => setIsReviewModalOpen(false)} 
            productId={productId} 
            onSubmit={handleReviewAdded} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
