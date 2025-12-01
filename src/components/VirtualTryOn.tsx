"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  X, Upload, Camera, Loader2, Download, Share2, RotateCcw, 
  Sparkles, CheckCircle, AlertCircle, ImagePlus, Wand2,
  ZoomIn, ZoomOut, Maximize2, Info, ChevronLeft, ChevronRight,
  Smartphone, Monitor, Heart, ShoppingBag
} from "lucide-react";

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
  generating: { title: "Generating", subtitle: "AI is creating your virtual try-on..." },
  finalizing: { title: "Finalizing", subtitle: "Adding final touches..." },
  complete: { title: "Complete!", subtitle: "Your virtual try-on is ready" },
  error: { title: "Error", subtitle: "Something went wrong" },
};

const SAMPLE_POSES = [
  { id: "front", label: "Front View", icon: "👤" },
  { id: "side", label: "Side View", icon: "🧍" },
  { id: "casual", label: "Casual Pose", icon: "🚶" },
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
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateTryOn = async () => {
    if (!userImage || !product) return;
    
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
        setProcessingStage(stage);
        setProgress(prog);
      }, delay);
    }

    try {
      const productImageBase64 = await fetchProductImageAsBase64(getProductImage());
      
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImage,
          productImage: productImageBase64,
          productName: product.name,
          productCategory: product.category,
          colorVariant: selectedProductColor,
        }),
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
      console.error(err);
      setProcessingStage("error");
      setError("Network error. Please check your connection and try again.");
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
                  VIRTUAL TRY-ON
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-medium rounded-full">
                    AI POWERED
                  </span>
                </h2>
                <p className="text-xs text-gray-500">Powered by Nano Banana Pro</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel - Upload & Controls */}
            <div className="md:w-[380px] border-r border-gray-100 flex flex-col bg-gray-50/50">
              {/* Product Info */}
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-gray-100 relative overflow-hidden flex-shrink-0">
                    <Image
                      src={getProductImage()}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 tracking-wider">{product.category.toUpperCase()}</p>
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">${product.price}</p>
                    
                    {/* Color Selection */}
                    {product.colors && product.colors.length > 1 && (
                      <div className="mt-2 flex gap-1.5">
                        {product.colors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedProductColor(color.name)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              selectedProductColor === color.name
                                ? "border-black scale-110"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Photo Upload Area */}
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">
                      YOUR PHOTO
                    </label>
                    <div
                      className={`relative aspect-[3/4] border-2 border-dashed rounded-lg overflow-hidden transition-all ${
                        userImage
                          ? "border-black bg-gray-100"
                          : "border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {!userImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <div className="flex gap-3 mb-4">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition"
                            >
                              <ImagePlus className="w-6 h-6" />
                              <span className="text-xs">Gallery</span>
                            </button>
                            <button
                              onClick={() => cameraInputRef.current?.click()}
                              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition"
                            >
                              <Camera className="w-6 h-6" />
                              <span className="text-xs">Camera</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-center">
                            Upload or take a photo
                          </p>
                          <p className="text-xs text-gray-400 mt-1 text-center">
                            Full body shot recommended
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
                        <div className="relative w-full h-full">
                          <Image
                            src={userImage}
                            alt="Your photo"
                            fill
                            className="object-contain"
                          />
                          <button
                            onClick={resetTryOn}
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg hover:bg-white transition text-xs font-medium flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Change
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Tips for best results:</p>
                        <ul className="space-y-0.5 text-blue-600">
                          <li>• Use a full-body photo</li>
                          <li>• Stand in a neutral pose</li>
                          <li>• Good lighting helps</li>
                          <li>• Plain background works best</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{error}</p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <button
                  onClick={handleGenerateTryOn}
                  disabled={!userImage || isProcessing}
                  className={`w-full py-4 text-sm tracking-wider font-medium transition-all flex items-center justify-center gap-2 rounded-lg ${
                    isProcessing
                      ? "bg-gray-100 text-gray-500"
                      : userImage
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {PROCESSING_MESSAGES[processingStage].title}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      GENERATE TRY-ON
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Result */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-100 to-gray-50 min-h-[400px]">
              {/* Result Toolbar */}
              {tryOnResult && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    {/* History Navigation */}
                    {history.length > 1 && (
                      <div className="flex items-center gap-1 mr-2">
                        <button
                          onClick={() => navigateHistory("prev")}
                          disabled={historyIndex <= 0}
                          className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500">
                          {historyIndex + 1}/{history.length}
                        </span>
                        <button
                          onClick={() => navigateHistory("next")}
                          disabled={historyIndex >= history.length - 1}
                          className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                      <button
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-500 w-12 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoom(1)}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Comparison Toggle */}
                    {userImage && (
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                          showComparison
                            ? "bg-black text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Compare
                      </button>
                    )}
                    
                    {/* Actions */}
                    <button
                      onClick={handleShare}
                      className="p-1.5 hover:bg-gray-100 rounded transition"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 hover:bg-gray-100 rounded transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
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
                      <div className="relative w-full max-w-lg aspect-[3/4] overflow-hidden rounded-lg shadow-2xl">
                        {/* Before Image */}
                        <div className="absolute inset-0">
                          <Image
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
                          <Image
                            src={tryOnResult}
                            alt="After"
                            fill
                            className="object-contain bg-white"
                          />
                        </div>
                        {/* Slider */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                          style={{ left: `${comparisonPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <ChevronLeft className="w-3 h-3 -mr-1" />
                            <ChevronRight className="w-3 h-3 -ml-1" />
                          </div>
                        </div>
                        {/* Labels */}
                        <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          Before
                        </div>
                        <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          After
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
                        className="relative max-w-lg w-full aspect-[3/4] rounded-lg overflow-hidden shadow-2xl bg-white"
                        style={{ transform: `scale(${zoom})` }}
                      >
                        <Image
                          src={tryOnResult}
                          alt="Try-on result"
                          fill
                          className="object-contain"
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                          <button
                            onClick={onAddToCart}
                            className="flex-1 bg-black text-white py-3 text-sm font-medium rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            ADD TO BAG
                          </button>
                          <button
                            onClick={onAddToWishlist}
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-black transition"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Processing or Empty State
                  <div className="text-center">
                    {isProcessing ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {/* Animated Processing Indicator */}
                        <div className="relative w-32 h-32 mx-auto">
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-purple-200"
                            style={{
                              background: `conic-gradient(from 0deg, rgb(147, 51, 234) ${progress}%, transparent ${progress}%)`,
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-purple-600">
                              {progress}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-lg font-medium">
                            {PROCESSING_MESSAGES[processingStage].title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {PROCESSING_MESSAGES[processingStage].subtitle}
                          </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-center gap-2">
                          {["analyzing", "generating", "finalizing"].map((stage, i) => (
                            <div
                              key={stage}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                ["analyzing", "generating", "finalizing"].indexOf(processingStage) >= i
                                  ? "bg-purple-600"
                                  : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-600">
                            See yourself in this look
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Upload a photo and click Generate
                          </p>
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
                      className="px-6 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:border-black transition flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Another Photo
                    </button>
                    <button
                      onClick={handleGenerateTryOn}
                      disabled={isProcessing}
                      className="px-6 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-900 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
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
