"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import NextImage from "next/image";
import { useAuth } from "@/context/AuthContext";
import { 
  X, Upload, Camera, SpinnerGap, DownloadSimple, ShareNetwork, ArrowsClockwise, 
  Sparkle, CheckCircle, WarningCircle, ImageSquare, MagicWand,
  MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut, Info, CaretLeft, CaretRight,
  Heart, ShoppingBag, User, TShirt, SlidersHorizontal
} from "@phosphor-icons/react";

interface TryOnProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    colors?: Array<{ name: string; hex: string; image?: string }>;
  };
  selectedColor?: string;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
}

type ProcessingStage = "idle" | "uploading" | "analyzing" | "generating" | "finalizing" | "complete" | "error";

const PROCESSING_MESSAGES: Record<ProcessingStage, { title: string; subtitle: string }> = {
  idle: { title: "Ready", subtitle: "Upload a photo to begin" },
  uploading: { title: "Uploading", subtitle: "Preparing your image..." },
  analyzing: { title: "Analyzing", subtitle: "Detecting body pose and proportions..." },
  generating: { title: "Creating Your Look", subtitle: "AI is styling you in this piece..." },
  finalizing: { title: "Almost There", subtitle: "Adding finishing touches..." },
  complete: { title: "Your New Look!", subtitle: "Looking amazing! ✨" },
  error: { title: "Error", subtitle: "Something went wrong" },
};

// Sample user images for quick try
const SAMPLE_MODELS = [
  { id: "model-1", label: "Model 1", image: "/samples/model-front.jpg" },
  { id: "model-2", label: "Model 2", image: "/samples/model-casual.jpg" },
];

export default function VirtualTryOn({ 
  isOpen, 
  onClose, 
  product, 
  selectedColor,
  onAddToCart,
  onAddToWishlist 
}: TryOnProps) {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [selectedProductColor, setSelectedProductColor] = useState(selectedColor || product.colors?.[0]?.name);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { user } = useAuth();

  // Get current product image based on selected color
  const getProductImage = useCallback(() => {
    if (product.colors && selectedProductColor) {
      const colorVariant = product.colors.find(c => c.name === selectedProductColor);
      if (colorVariant?.image) return colorVariant.image;
    }
    return product.image;
  }, [product, selectedProductColor]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError("Image size must be under 15MB");
        return;
      }

      setProcessingStage("uploading");
      setProgress(10);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setTryOnResult(null);
        setError(null);
        setProcessingStage("idle");
        setProgress(0);
      };
      reader.onerror = () => {
        setError("Failed to read image. Please try again.");
        setProcessingStage("error");
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchProductImageAsBase64 = async (url: string): Promise<string> => {
    // Check if it's a placeholder URL
    if (url.includes("placehold.co") || url.includes("placeholder") || url.includes("via.placeholder")) {
      throw new Error("This product uses a placeholder image. Virtual try-on requires a real product photo.");
    }
    
    // Use server-side proxy to avoid CORS issues
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch image: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type") || "";
      
      // Check if response is SVG
      if (contentType.includes("svg")) {
        throw new Error("This product uses an SVG placeholder. Virtual try-on requires a real product photo (JPEG or PNG).");
      }
      
      const blob = await response.blob();
      
      // Additional check on blob type
      if (blob.type.includes("svg")) {
        throw new Error("This product uses an SVG placeholder. Virtual try-on requires a real product photo (JPEG or PNG).");
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Final check on the data URL
          if (result.startsWith("data:image/svg")) {
            reject(new Error("This product uses an SVG placeholder. Virtual try-on requires a real product photo (JPEG or PNG)."));
          } else {
            resolve(result);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to load product image. Please try again.");
    }
  };

  const handleCancelTryOn = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProcessingStage("idle");
    setProgress(0);
    setError(null);
  };

  const handleGenerateTryOn = async () => {
    if (!userImage || !product) return;
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setError(null);
    setTryOnResult(null);
    
    // Simulated progress stages
    const stages: { stage: ProcessingStage; progress: number; delay: number }[] = [
      { stage: "analyzing", progress: 20, delay: 0 },
      { stage: "generating", progress: 50, delay: 1500 },
      { stage: "finalizing", progress: 80, delay: 3000 },
    ];

    // Start progress animation
    for (const { stage, progress: prog, delay } of stages) {
      setTimeout(() => {
        if (!signal.aborted) {
          setProcessingStage(stage);
          setProgress(prog);
        }
      }, delay);
    }

    try {
      const productImageBase64 = await fetchProductImageAsBase64(getProductImage());
      
      if (signal.aborted) return;
      
      // Get auth token for authenticated API call
      const token = await user?.getIdToken();
      
      if (!token) {
        setProcessingStage("error");
        setError("Please sign in to use the virtual try-on feature.");
        return;
      }
      
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userImage,
          productImage: productImageBase64,
          productName: product.name,
          productCategory: product.category,
          colorVariant: selectedProductColor,
        }),
        signal,
      });

      const data = await response.json();

      if (data.success && data.image) {
        setProgress(100);
        setProcessingStage("complete");
        setTryOnResult(data.image);
        
        // Add to history
        setHistory(prev => [...prev, data.image]);
        setHistoryIndex(prev => prev + 1);
      } else {
        setProcessingStage("error");
        setError(data.error || "Failed to generate try-on image. Please try again.");
      }
    } catch (err) {
      // Don't show error if request was cancelled
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error(err);
      setProcessingStage("error");
      // Show specific error message if available
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleDownload = () => {
    if (!tryOnResult) return;
    const link = document.createElement("a");
    link.href = tryOnResult;
    link.download = `cipher-tryon-${product.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!tryOnResult) return;
    
    try {
      if (navigator.share) {
        const blob = await fetch(tryOnResult).then(r => r.blob());
        const file = new File([blob], "cipher-tryon.png", { type: "image/png" });
        await navigator.share({
          title: `CIPHER Virtual Try-On: ${product.name}`,
          text: `Check out how I look in the ${product.name} from CIPHER!`,
          files: [file],
        });
      } else {
        // Fallback: Copy image URL to clipboard
        await navigator.clipboard.writeText(tryOnResult);
        alert("Image copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const resetTryOn = () => {
    setUserImage(null);
    setTryOnResult(null);
    setProcessingStage("idle");
    setProgress(0);
    setError(null);
    setZoom(1);
    setShowComparison(false);
  };

  const navigateHistory = (direction: "prev" | "next") => {
    if (direction === "prev" && historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTryOnResult(history[historyIndex - 1]);
    } else if (direction === "next" && historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTryOnResult(history[historyIndex + 1]);
    }
  };

  if (!isOpen) return null;

  const isProcessing = ["uploading", "analyzing", "generating", "finalizing"].includes(processingStage);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl shadow-lg">
                <MagicWand className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  Virtual Try-On
                  <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    AI Magic
                  </span>
                </h2>
                <p className="text-sm text-gray-500">See yourself in this style instantly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Panel - Upload & Controls */}
            <div className="lg:w-[400px] border-r border-gray-100 flex flex-col bg-gray-50/30">
              {/* Product Info */}
              <div className="p-5 border-b border-gray-100 bg-white">
                <div className="flex gap-4">
                  <div className="w-24 h-28 bg-gray-100 relative overflow-hidden flex-shrink-0 rounded-lg shadow-sm">
                    <NextImage
                      src={getProductImage()}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 tracking-wider uppercase">{product.category}</p>
                    <h3 className="font-semibold text-lg truncate mt-0.5">{product.name}</h3>
                    <p className="text-lg font-medium text-gray-800 mt-1">${product.price}</p>
                    
                    {/* Color Selection */}
                    {product.colors && product.colors.length > 1 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1.5">Try different colors</p>
                        <div className="flex gap-2">
                          {product.colors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => setSelectedProductColor(color.name)}
                              className={`w-7 h-7 rounded-full border-2 transition-all shadow-sm ${
                                selectedProductColor === color.name
                                  ? "border-black ring-2 ring-gray-300 scale-110"
                                  : "border-white hover:scale-105"
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="flex-1 p-5 overflow-y-auto">
                <div className="space-y-5">
                  {/* Photo Upload Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your Photo
                    </label>
                    <div
                      className={`relative aspect-[3/4] border-2 rounded-xl overflow-hidden transition-all ${
                        userImage
                          ? "border-gray-300 bg-gray-50"
                          : "border-dashed border-gray-300 hover:border-black bg-white hover:bg-gray-50"
                      }`}
                    >
                      {!userImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                          <div className="flex gap-4 mb-5">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex flex-col items-center gap-3 p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all group"
                            >
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                                <ImageSquare className="w-6 h-6 text-gray-700" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">Gallery</span>
                            </button>
                            <button
                              onClick={() => cameraInputRef.current?.click()}
                              className="flex flex-col items-center gap-3 p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all group"
                            >
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                                <Camera className="w-6 h-6 text-gray-700" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">Camera</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-700 text-center">
                            Upload a full-body photo
                          </p>
                          <p className="text-xs text-gray-400 mt-1.5 text-center max-w-[200px]">
                            For best results, use a photo with good lighting and a clear view
                          </p>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-full group">
                          <NextImage
                            src={userImage}
                            alt="Your photo"
                            fill
                            className="object-contain"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <button
                            onClick={resetTryOn}
                            className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:bg-white transition text-xs font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100"
                          >
                            <ArrowsClockwise className="w-4 h-4" /> Change Photo
                          </button>
                          <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                            <CheckCircle className="w-4 h-4" weight="fill" /> Photo ready
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkle className="w-4 h-4 text-amber-600" weight="fill" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 mb-2">Pro Tips for Best Results</p>
                        <ul className="space-y-1 text-amber-700 text-xs">
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            Stand straight with arms slightly away
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            Use natural daylight when possible
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            Plain background works magic
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                    >
                      <WarningCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Oops!</p>
                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="p-5 border-t border-gray-100 bg-white">
                {!user ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-600 mb-2">Sign in to use Virtual Try-On</p>
                    <a
                      href="/login"
                      className="inline-block px-6 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
                    >
                      Sign In
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateTryOn}
                    disabled={!userImage || isProcessing}
                    className={`w-full py-4 text-sm tracking-wider font-semibold transition-all flex items-center justify-center gap-3 rounded-xl ${
                      isProcessing
                        ? "bg-gray-100 text-gray-500"
                        : userImage
                        ? "bg-black text-white hover:bg-gray-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <SpinnerGap className="w-5 h-5 animate-spin" />
                        {PROCESSING_MESSAGES[processingStage].title}
                      </>
                    ) : (
                      <>
                        <MagicWand className="w-5 h-5" />
                        Try It On
                      </>
                    )}
                  </button>
                )}
                {user && !userImage && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Upload a photo to see the magic ✨
                  </p>
                )}
              </div>
            </div>

            {/* Right Panel - Result */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-100 via-gray-50 to-white min-h-[400px]">
              {/* Result Toolbar */}
              {tryOnResult && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {/* History Navigation */}
                    {history.length > 1 && (
                      <div className="flex items-center gap-1.5 mr-3 bg-gray-100 rounded-full px-2 py-1">
                        <button
                          onClick={() => navigateHistory("prev")}
                          disabled={historyIndex <= 0}
                          className="p-1.5 hover:bg-white rounded-full disabled:opacity-30 transition"
                        >
                          <CaretLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-gray-600 min-w-[40px] text-center">
                          {historyIndex + 1} / {history.length}
                        </span>
                        <button
                          onClick={() => navigateHistory("next")}
                          disabled={historyIndex >= history.length - 1}
                          className="p-1.5 hover:bg-white rounded-full disabled:opacity-30 transition"
                        >
                          <CaretRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                      <button
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-1.5 hover:bg-white rounded-full transition"
                      >
                        <MagnifyingGlassMinus className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-medium text-gray-600 w-12 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                        className="p-1.5 hover:bg-white rounded-full transition"
                      >
                        <MagnifyingGlassPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoom(1)}
                        className="p-1.5 hover:bg-white rounded-full transition"
                        title="Reset zoom"
                      >
                        <ArrowsOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Comparison Toggle */}
                    {userImage && (
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className={`px-4 py-2 text-xs font-semibold rounded-full transition flex items-center gap-2 ${
                          showComparison
                            ? "bg-black text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Compare
                      </button>
                    )}
                    
                    {/* Actions */}
                    <button
                      onClick={handleShare}
                      className="p-2.5 hover:bg-gray-100 rounded-full transition"
                      title="Share"
                    >
                      <ShareNetwork className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2.5 hover:bg-gray-100 rounded-full transition"
                      title="Download"
                    >
                      <DownloadSimple className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Result Display */}
              <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                {tryOnResult ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {showComparison && userImage ? (
                      // Before/After Comparison Slider
                      <div className="relative w-full max-w-lg aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                        {/* Before Image */}
                        <div className="absolute inset-0">
                          <NextImage
                            src={userImage}
                            alt="Before"
                            fill
                            className="object-contain bg-white"
                          />
                        </div>
                        {/* After Image with Clip */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                        >
                          <NextImage
                            src={tryOnResult}
                            alt="After"
                            fill
                            className="object-contain bg-white"
                          />
                        </div>
                        {/* Slider */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize"
                          style={{ left: `${comparisonPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-black">
                            <CaretLeft className="w-3 h-3 -mr-0.5 text-black" />
                            <CaretRight className="w-3 h-3 -ml-0.5 text-black" />
                          </div>
                        </div>
                        {/* Labels */}
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                          Before
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-full">
                          After ✨
                        </div>
                        {/* Slider Input */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={comparisonPosition}
                          onChange={(e) => setComparisonPosition(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                        />
                      </div>
                    ) : (
                      // Normal Result View
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-lg w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-white"
                        style={{ transform: `scale(${zoom})` }}
                      >
                        <NextImage
                          src={tryOnResult}
                          alt="Try-on result"
                          fill
                          className="object-contain"
                        />
                        {/* Success Badge */}
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow-lg">
                          <CheckCircle className="w-4 h-4" weight="fill" />
                          AI Generated
                        </div>
                        {/* Action Buttons on Image */}
                        <div className="absolute bottom-5 left-5 right-5 flex gap-3">
                          <button
                            onClick={onAddToCart}
                            className="flex-1 bg-black text-white py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-lg"
                          >
                            <ShoppingBag className="w-5 h-5" />
                            Add to Bag
                          </button>
                          <button
                            onClick={onAddToWishlist}
                            className="p-3.5 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition shadow-lg group"
                          >
                            <Heart className="w-5 h-5 group-hover:text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Processing or Empty State
                  <div className="text-center max-w-sm">
                    {isProcessing ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                      >
                        {/* Animated Processing Indicator */}
                        <div className="relative w-40 h-40 mx-auto">
                          {/* Outer ring animation */}
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-gray-200"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <div 
                              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"
                            />
                          </motion.div>
                          
                          {/* Progress circle */}
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200"
                            />
                            <motion.circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="url(#progressGradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 70}
                              animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - progress / 100) }}
                              transition={{ duration: 0.5 }}
                            />
                            <defs>
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#000000" />
                                <stop offset="100%" stopColor="#4B5563" />
                              </linearGradient>
                            </defs>
                          </svg>
                          
                          {/* Center content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-black">
                              {progress}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xl font-semibold text-gray-800">
                            {PROCESSING_MESSAGES[processingStage].title}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {PROCESSING_MESSAGES[processingStage].subtitle}
                          </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-center gap-3">
                          {["analyzing", "generating", "finalizing"].map((stage, i) => (
                            <div
                              key={stage}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                ["analyzing", "generating", "finalizing"].indexOf(processingStage) >= i
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {["analyzing", "generating", "finalizing"].indexOf(processingStage) > i ? (
                                <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                              ) : ["analyzing", "generating", "finalizing"].indexOf(processingStage) === i ? (
                                <SpinnerGap className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-gray-300" />
                              )}
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </div>
                          ))}
                        </div>
                        
                        {/* Cancel Button */}
                        <button
                          onClick={handleCancelTryOn}
                          className="mt-4 px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2 mx-auto"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        <div className="w-32 h-32 mx-auto relative">
                          <div className="absolute inset-0 bg-gray-100 rounded-full" />
                          <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
                            <TShirt className="w-12 h-12 text-gray-400" />
                          </div>
                          <motion.div
                            className="absolute -top-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Sparkle className="w-4 h-4 text-white" weight="fill" />
                          </motion.div>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-gray-800">
                            See yourself in this look
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Upload a photo and let AI work its magic
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                          <Sparkle className="w-4 h-4" />
                          Powered by AI Vision Technology
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions for Results */}
              {tryOnResult && (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={resetTryOn}
                      className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <ArrowsClockwise className="w-4 h-4" />
                      Try Another Photo
                    </button>
                    <button
                      onClick={handleGenerateTryOn}
                      disabled={isProcessing}
                      className="px-6 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <MagicWand className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
