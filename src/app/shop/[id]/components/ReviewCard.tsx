"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ThumbsUp, CheckCircle, Star, X, ArrowLeft, ArrowRight 
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useReviews, Review } from "@/context/ReviewContext";
import { useToast } from "@/context/ToastContext";
import StarRating from "./StarRating";

interface ReviewCardProps {
  review: Review;
  onVote?: () => void;
}

export default function ReviewCard({ review, onVote }: ReviewCardProps) {
  const { user } = useAuth();
  const { voteHelpful, getUserVote } = useReviews();
  const [userVote, setUserVote] = useState<"helpful" | "not-helpful" | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const toast = useToast();

  // Get all media (new format + legacy images)
  const allMedia = [
    ...(review.media || []),
    ...(review.images || []).map(url => ({ type: "image" as const, url }))
  ];

  useEffect(() => {
    if (user) {
      getUserVote(review.id).then(setUserVote);
    }
  }, [user, review.id, getUserVote]);

  const handleVote = async (isHelpful: boolean) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }
    setIsVoting(true);
    const success = await voteHelpful(review.id, isHelpful);
    if (success) {
      // Toggle or update vote state
      if (userVote === (isHelpful ? "helpful" : "not-helpful")) {
        setUserVote(null);
      } else {
        setUserVote(isHelpful ? "helpful" : "not-helpful");
      }
      onVote?.();
    }
    setIsVoting(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="border-b border-gray-100 py-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <StarRating rating={review.rating} />
            {review.verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" weight="fill" /> Verified Purchase
              </span>
            )}
            {review.featured && (
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" weight="fill" /> Featured
              </span>
            )}
          </div>
          <p className="font-medium">{review.title}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
          {review.updatedAt && (
            <p className="text-[10px] text-gray-400">(edited)</p>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
      
      {/* Media Gallery */}
      {allMedia.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {allMedia.map((media, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="relative w-20 h-20 bg-gray-100 overflow-hidden group"
            >
              {media.type === "video" ? (
                <>
                  <video src={media.url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <Image 
                  src={media.url} 
                  alt={`Review media ${i + 1}`} 
                  fill 
                  className="object-cover group-hover:scale-105 transition" 
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Admin Reply */}
      {review.adminReply && (
        <div className="bg-gray-50 border-l-2 border-black p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium bg-black text-white px-2 py-0.5">CIPHER TEAM</span>
            <span className="text-xs text-gray-400">
              {new Date(review.adminReply.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.adminReply.content}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">By {review.userName}</p>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleVote(true)}
            disabled={isVoting}
            className={`flex items-center gap-1 text-xs transition ${
              userVote === "helpful" 
                ? "text-green-600" 
                : "text-gray-400 hover:text-black"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${userVote === "helpful" ? "fill-current" : ""}`} /> 
            Helpful ({review.helpful})
          </button>
          <button 
            onClick={() => handleVote(false)}
            disabled={isVoting}
            className={`flex items-center gap-1 text-xs transition ${
              userVote === "not-helpful" 
                ? "text-red-500" 
                : "text-gray-400 hover:text-black"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 rotate-180 ${userVote === "not-helpful" ? "fill-current" : ""}`} /> 
            ({review.notHelpful || 0})
          </button>
        </div>
      </div>

      {/* Media Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {allMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
                  }}
                  className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev + 1) % allMedia.length);
                  }}
                  className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl max-h-[80vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {allMedia[lightboxIndex]?.type === "video" ? (
                <video
                  src={allMedia[lightboxIndex].url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={allMedia[lightboxIndex]?.url || ""}
                    alt="Review media"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allMedia.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition ${
                    i === lightboxIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
