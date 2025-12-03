"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlass, 
  X, 
  SpinnerGap, 
  Image as ImageIcon,
  Check,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

interface PexelsImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, photographer: string) => void;
  currentImage?: string;
}

const CURATED_CATEGORIES = [
  "fashion", "streetwear", "urban", "minimal", "lifestyle",
  "clothing", "style", "texture", "abstract", "city"
];

export default function PexelsImagePicker({ 
  isOpen, 
  onClose, 
  onSelect,
  currentImage 
}: PexelsImagePickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [mode, setMode] = useState<"curated" | "search">("curated");

  const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";

  const fetchPhotos = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!PEXELS_API_KEY) {
      setError("Pexels API key not configured. Add NEXT_PUBLIC_PEXELS_API_KEY to your environment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = searchQuery
        ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=20&page=${pageNum}`
        : `https://api.pexels.com/v1/curated?per_page=20&page=${pageNum}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch images from Pexels");
      }

      const data: PexelsResponse = await response.json();
      
      if (pageNum === 1) {
        setPhotos(data.photos);
      } else {
        setPhotos((prev) => [...prev, ...data.photos]);
      }
      
      setTotalResults(data.total_results);
      setPage(pageNum);
    } catch (err) {
      console.error("Pexels fetch error:", err);
      setError("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [PEXELS_API_KEY]);

  useEffect(() => {
    if (isOpen) {
      fetchPhotos("", 1);
      setMode("curated");
    }
  }, [isOpen, fetchPhotos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setMode("search");
      fetchPhotos(query, 1);
    }
  };

  const handleCategoryClick = (category: string) => {
    setQuery(category);
    setMode("search");
    fetchPhotos(category, 1);
  };

  const loadMore = () => {
    fetchPhotos(mode === "search" ? query : "", page + 1);
  };

  const handleSelect = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto.src.large, selectedPhoto.photographer);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Select Cover Image</h2>
                <p className="text-xs text-gray-500">Powered by Pexels</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for images..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-black focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition"
              >
                SEARCH
              </button>
            </form>

            {/* Quick Categories */}
            <div className="flex flex-wrap gap-2 mt-3">
              {CURATED_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-3 py-1 text-xs border transition ${
                    query === category
                      ? "bg-black text-white border-black"
                      : "border-gray-200 hover:border-black"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => fetchPhotos("", 1)}
                  className="text-sm underline"
                >
                  Try Again
                </button>
              </div>
            ) : loading && photos.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`relative aspect-[4/3] overflow-hidden group transition-all ${
                        selectedPhoto?.id === photo.id
                          ? "ring-4 ring-black"
                          : "hover:ring-2 hover:ring-gray-300"
                      }`}
                    >
                      <Image
                        src={photo.src.medium}
                        alt={photo.alt || "Pexels photo"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                      {selectedPhoto?.id === photo.id && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-black text-white flex items-center justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition">
                        <p className="text-white text-xs truncate">
                          by {photo.photographer}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Load More */}
                {photos.length < totalResults && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-6 py-3 border border-black text-sm tracking-wider hover:bg-black hover:text-white transition disabled:opacity-50"
                    >
                      {loading ? (
                        <SpinnerGap className="w-5 h-5 animate-spin inline" />
                      ) : (
                        "LOAD MORE"
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Showing {photos.length} of {totalResults.toLocaleString()} results
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {selectedPhoto ? (
                  <span>
                    Selected: Photo by <strong>{selectedPhoto.photographer}</strong>
                  </span>
                ) : (
                  <span>Select an image to continue</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-sm tracking-wider hover:bg-gray-100 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSelect}
                  disabled={!selectedPhoto}
                  className="px-6 py-2 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  USE IMAGE
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
