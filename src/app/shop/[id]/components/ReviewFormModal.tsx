"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, SpinnerGap, Camera } from "@phosphor-icons/react";
import { useReviews } from "@/context/ReviewContext";
import { useToast } from "@/context/ToastContext";
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
    const { storage } = await import("@/lib/firebase");
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

    const uploaded: typeof media = [];
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB.`);
        continue;
      }
      
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported format.`);
        continue;
      }

      try {
        const timestamp = Date.now();
        const path = `reviews/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploaded.push({
          type: file.type.startsWith("video/") ? "video" : "image",
          url,
        });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setMedia([...media, ...uploaded]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files);
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
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
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-3">YOUR RATING</label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">REVIEW TITLE</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Sum it up" 
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">YOUR REVIEW</label>
            <textarea 
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
            <label className="block text-xs tracking-wider text-gray-500 mb-2">ADD PHOTOS OR VIDEOS (OPTIONAL)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${
                dragActive ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, WebM (max 10MB, up to 5 files)</p>
                </div>
              )}
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {media.map((item, i) => (
                  <div key={i} className="relative w-16 h-16 group">
                    {item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <Image src={item.url} alt="" fill className="object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {item.type === "video" && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">VIDEO</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || uploading} 
            className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <SpinnerGap className="w-4 h-4 animate-spin" /> SUBMITTING
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
