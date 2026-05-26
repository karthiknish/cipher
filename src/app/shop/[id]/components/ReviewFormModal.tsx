"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { X, SpinnerGap, Camera } from "@phosphor-icons/react";
import { useReviews } from "@/context/ReviewContext";
import { useToast } from "@/context/ToastContext";
import { uploadFile, generateImagePath } from "@/lib/uploadImage";
import StarRating from "./StarRating";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSubmit: () => void;
}

export default function ReviewFormModal({ isOpen, onClose, productId, onSubmit }: ReviewFormModalProps) {
  const { addReview, loading } = useReviews();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<Array<{ type: "image" | "video"; url: string; thumbnail?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (media.length + fileArray.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }

    setUploading(true);

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];

    const uploaded = (
      await Promise.all(
        fileArray.map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} is too large. Max 10MB.`);
            return null;
          }
          if (!validTypes.includes(file.type)) {
            toast.error(`${file.name} is not a supported format.`);
            return null;
          }
          try {
            const path = generateImagePath(
              `reviews/${productId}`,
              file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
            );
            const url = await uploadFile(file, path);
            return {
              type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
              url,
            };
          } catch {
            toast.error(`Failed to upload ${file.name}`);
            return null;
          }
        })
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    setMedia([...media, ...uploaded]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files);
  };

  const removeMedia = (url: string) => {
    setMedia(media.filter((item) => item.url !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) { 
      toast.error("Please fill in all fields"); 
      return; 
    }
    const success = await addReview({ productId, rating, title, comment, media, verifiedPurchase: false });
    if (success) { 
      toast.success("Review submitted!"); 
      setRating(5); 
      setTitle(""); 
      setComment(""); 
      setMedia([]); 
      onSubmit(); 
      onClose(); 
    } else { 
      toast.error("Failed to submit review."); 
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-gray-950/60 z-50 flex items-center justify-center p-4" 
      role="presentation"
    ><button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="bg-white w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-light tracking-tight">WRITE A REVIEW</h2>
            <button aria-label="x" type="button" onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <span id="review-rating-label" className="block text-xs tracking-wider text-gray-500 mb-3">YOUR RATING</span>
            <div role="group" aria-labelledby="review-rating-label">
              <StarRating rating={rating} size="lg" interactive onChange={setRating} />
            </div>
          </div>
          <div>
            <label htmlFor="review-title" className="block text-xs tracking-wider text-gray-500 mb-2">REVIEW TITLE</label>
            <input aria-label="REVIEW TITLE" id="review-title" 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Sum it up" 
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
              required 
            />
          </div>
          <div>
            <label htmlFor="ReviewFormModal-your-review-38" className="block text-xs tracking-wider text-gray-500 mb-2">YOUR REVIEW</label>
            <textarea aria-label="YOUR REVIEW" id="ReviewFormModal-your-review-38" 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="What did you like?" 
              rows={4} 
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none" 
              required 
            />
          </div>
          
          {/* Media Upload Section */}
          <div>
            <label
              className={`block border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${
                dragActive ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="block text-xs tracking-wider text-gray-500 mb-2">ADD PHOTOS OR VIDEOS (OPTIONAL)</span>
              <input aria-label="ADD PHOTOS OR VIDEOS (OPTIONAL)"
                id="review-media-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <SpinnerGap className="size-5 animate-spin" />
                  <span className="text-sm text-gray-500">Uploading…</span>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="size-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, WebM (max 10MB, up to 5 files)</p>
                </div>
              )}
            </label>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {media.map((item) => (
                  <div key={item.url} className="relative size-16 group">
                    {item.type === "video" ? (
                      <video src={item.url} className="size-full object-cover" muted aria-label="Review media preview" />
                    ) : (
                      <Image src={item.url} alt="" fill className="object-cover"  sizes="(max-width: 768px) 100vw, 50vw" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(item.url)}
                      className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="size-3" />
                    </button>
                    {item.type === "video" && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gray-950/60 text-white text-[8px] text-center py-0.5">VIDEO</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || uploading} 
            className="w-full bg-gray-950 text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <SpinnerGap className="size-4 animate-spin" /> SUBMITTING
              </>
            ) : (
              "SUBMIT REVIEW"
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
