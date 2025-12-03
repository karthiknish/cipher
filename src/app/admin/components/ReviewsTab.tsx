"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReviews, Review } from "@/context/ReviewContext";
import { 
  Star, MagnifyingGlass, CheckCircle, XCircle, ChatCircle, 
  Trash, Eye, Image as ImageIcon, Play, Check, X, SpinnerGap
} from "@phosphor-icons/react";
import Image from "next/image";

// Star Rating Display
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
        />
      ))}
    </div>
  );
}

// Review Detail Modal
function ReviewDetailModal({ 
  review, 
  isOpen, 
  onClose, 
  onModerate, 
  onReply, 
  onDeleteReply,
  onFeature,
  onDelete
}: { 
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onModerate: (status: "approved" | "rejected") => Promise<void>;
  onReply: (content: string) => Promise<void>;
  onDeleteReply: () => Promise<void>;
  onFeature: (featured: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  const allMedia = [
    ...(review.media || []),
    ...(review.images || []).map(url => ({ type: "image" as const, url }))
  ];

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    await onReply(replyContent);
    setReplyContent("");
    setShowReplyForm(false);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={review.rating} />
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  review.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  review.status === "rejected" ? "bg-rose-100 text-rose-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {review.status || "approved"}
                </span>
                {review.verifiedPurchase && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle weight="fill" className="w-3 h-3" /> Verified
                  </span>
                )}
                {review.featured && (
                  <span className="flex items-center gap-1 text-xs text-violet-600">
                    <Star weight="fill" className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <h3 className="text-lg font-medium">{review.title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Review Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>By {review.userName} ({review.userEmail})</span>
            <span>{new Date(review.createdAt).toLocaleString()}</span>
          </div>

          {/* Review Comment */}
          <p className="text-gray-700">{review.comment}</p>

          {/* Media */}
          {allMedia.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">MEDIA ({allMedia.length})</p>
              <div className="flex gap-2 flex-wrap">
                {allMedia.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxMedia(item.url)}
                    className="relative w-20 h-20 bg-gray-100 overflow-hidden group"
                  >
                    {item.type === "video" ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play weight="fill" className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <Image src={item.url} alt="" fill className="object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-600">👍 {review.helpful} helpful</span>
            <span className="text-rose-500">👎 {review.notHelpful || 0} not helpful</span>
          </div>

          {/* Admin Reply */}
          {review.adminReply ? (
            <div className="bg-gray-50 p-4 border-l-4 border-black">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium bg-black text-white px-2 py-0.5">
                  CIPHER TEAM REPLY
                </span>
                <button
                  onClick={async () => {
                    setIsSubmitting(true);
                    await onDeleteReply();
                    setIsSubmitting(false);
                  }}
                  disabled={isSubmitting}
                  className="text-rose-500 hover:text-rose-700 text-xs"
                >
                  Delete Reply
                </button>
              </div>
              <p className="text-sm text-gray-700">{review.adminReply.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.adminReply.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div>
              {showReplyForm ? (
                <div className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReply}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <SpinnerGap className="w-4 h-4 animate-spin" /> : null}
                      Post Reply
                    </button>
                    <button
                      onClick={() => { setShowReplyForm(false); setReplyContent(""); }}
                      className="px-4 py-2 border border-gray-200 text-sm hover:border-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
                >
                  <ChatCircle className="w-4 h-4" /> Add Reply
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3">
          {review.status !== "approved" && (
            <button
              onClick={async () => {
                setIsSubmitting(true);
                await onModerate("approved");
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {review.status !== "rejected" && (
            <button
              onClick={async () => {
                setIsSubmitting(true);
                await onModerate("rejected");
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 text-white text-sm hover:bg-rose-700 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}
          <button
            onClick={async () => {
              setIsSubmitting(true);
              await onFeature(!review.featured);
              setIsSubmitting(false);
            }}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm flex items-center gap-2 ${
              review.featured 
                ? "bg-violet-100 text-violet-700 hover:bg-violet-200" 
                : "border border-gray-200 hover:border-gray-400"
            }`}
          >
            <Star className="w-4 h-4" weight={review.featured ? "fill" : "regular"} /> 
            {review.featured ? "Unfeature" : "Feature"}
          </button>
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to delete this review?")) {
                setIsSubmitting(true);
                await onDelete();
                setIsSubmitting(false);
                onClose();
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-rose-600 border border-rose-200 text-sm hover:bg-rose-50 flex items-center gap-2"
          >
            <Trash className="w-4 h-4" /> Delete
          </button>
        </div>
      </motion.div>

      {/* Media Lightbox */}
      <AnimatePresence>
        {lightboxMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
            onClick={() => setLightboxMedia(null)}
          >
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            {lightboxMedia.includes(".mp4") || lightboxMedia.includes(".webm") ? (
              <video src={lightboxMedia} controls autoPlay className="max-w-4xl max-h-[80vh]" />
            ) : (
              <div className="relative w-full max-w-4xl h-[80vh]">
                <Image src={lightboxMedia} alt="" fill className="object-contain" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Reviews Tab Component
export function ReviewsTab() {
  const { 
    getAllReviews, 
    moderateReview, 
    addAdminReply, 
    deleteAdminReply, 
    featureReview,
    deleteReview,
    loading 
  } = useReviews();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "helpful">("recent");

  const loadReviews = async () => {
    const data = await getAllReviews();
    setReviews(data);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    let result = [...reviews];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query) ||
        r.userName.toLowerCase().includes(query) ||
        r.userEmail.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(r => (r.status || "approved") === statusFilter);
    }

    // Rating filter
    if (ratingFilter) {
      result = result.filter(r => r.rating === ratingFilter);
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "helpful":
        result.sort((a, b) => b.helpful - a.helpful);
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    setFilteredReviews(result);
  }, [reviews, searchQuery, statusFilter, ratingFilter, sortBy]);

  const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
    await moderateReview(reviewId, status);
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r));
    if (selectedReview?.id === reviewId) {
      setSelectedReview({ ...selectedReview, status });
    }
  };

  const handleReply = async (reviewId: string, content: string) => {
    await addAdminReply(reviewId, content);
    await loadReviews();
    const updated = reviews.find(r => r.id === reviewId);
    if (updated) setSelectedReview(updated);
  };

  const handleDeleteReply = async (reviewId: string) => {
    await deleteAdminReply(reviewId);
    await loadReviews();
  };

  const handleFeature = async (reviewId: string, featured: boolean) => {
    await featureReview(reviewId, featured);
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, featured } : r));
    if (selectedReview?.id === reviewId) {
      setSelectedReview({ ...selectedReview, featured });
    }
  };

  const handleDelete = async (reviewId: string) => {
    await deleteReview(reviewId);
    setReviews(reviews.filter(r => r.id !== reviewId));
    setSelectedReview(null);
  };

  // Stats
  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved" || !r.status).length,
    rejected: reviews.filter(r => r.status === "rejected").length,
    featured: reviews.filter(r => r.featured).length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : "0.0",
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-3xl font-light">{stats.total}</p>
          <p className="text-xs text-gray-500 tracking-wider">TOTAL REVIEWS</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-3xl font-light text-amber-600">{stats.pending}</p>
          <p className="text-xs text-gray-500 tracking-wider">PENDING</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-3xl font-light text-emerald-600">{stats.approved}</p>
          <p className="text-xs text-gray-500 tracking-wider">APPROVED</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-3xl font-light text-rose-600">{stats.rejected}</p>
          <p className="text-xs text-gray-500 tracking-wider">REJECTED</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-3xl font-light text-violet-600">{stats.featured}</p>
          <p className="text-xs text-gray-500 tracking-wider">FEATURED</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-1">
            <p className="text-3xl font-light">{stats.avgRating}</p>
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-xs text-gray-500 tracking-wider">AVG RATING</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter || ""}
            onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
          >
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start gap-4">
                  {/* Rating & Status */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium">
                      {review.rating}
                    </div>
                    <StarRating rating={review.rating} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{review.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                        (review.status || "approved") === "approved" ? "bg-emerald-100 text-emerald-700" :
                        review.status === "rejected" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {review.status || "approved"}
                      </span>
                      {review.verifiedPurchase && (
                        <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                      {review.featured && (
                        <Star weight="fill" className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{review.comment}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{review.userName}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      {((review.media?.length || 0) + (review.images?.length || 0)) > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> 
                            {(review.media?.length || 0) + (review.images?.length || 0)} media
                          </span>
                        </>
                      )}
                      {review.adminReply && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-black">
                            <ChatCircle className="w-3 h-3" /> Replied
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); setSelectedReview(review); }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            isOpen={!!selectedReview}
            onClose={() => setSelectedReview(null)}
            onModerate={(status) => handleModerate(selectedReview.id, status)}
            onReply={(content) => handleReply(selectedReview.id, content)}
            onDeleteReply={() => handleDeleteReply(selectedReview.id)}
            onFeature={(featured) => handleFeature(selectedReview.id, featured)}
            onDelete={() => handleDelete(selectedReview.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
