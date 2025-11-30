"use client";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, RotateCcw, ArrowLeft, Upload, X, Loader2, AlertCircle, Download, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const { getProduct, loading } = useProducts();
  const [selectedSize, setSelectedSize] = useState("M");
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Try-On State
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const product = getProduct(params.id as string);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-light tracking-tight mb-4">Product not found</h1>
        <Link href="/shop" className="text-sm tracking-wider underline underline-offset-4">Back to Shop</Link>
      </div>
    );
  }

  const sizes = product.sizes || ["S", "M", "L", "XL"];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: 1,
      size: selectedSize,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image too large. Please use an image under 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setTryOnResult(null);
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read image. Please try again.");
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
    
    setIsProcessing(true);
    setError(null);

    try {
      const productImageBase64 = await fetchProductImageAsBase64(product.image);

      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userImage: userImage,
          productImage: productImageBase64,
          productName: product.name,
          productCategory: product.category,
        }),
      });

      const data = await response.json();

      if (data.success && data.image) {
        setTryOnResult(data.image);
      } else {
        setError(data.error || "Failed to generate try-on image. Please try again.");
      }
    } catch (err) {
      console.error("Try-on error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!tryOnResult) return;
    
    const link = document.createElement("a");
    link.href = tryOnResult;
    link.download = `cipher-tryon-${product.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTryOn = () => {
    setUserImage(null);
    setTryOnResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6 border-b border-gray-100">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[3/4] bg-gray-100"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </motion.div>
          
          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <p className="text-xs tracking-[0.2em] text-gray-400 mb-4">{product.category.toUpperCase()}</p>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">{product.name}</h1>
            <p className="text-xl mb-8">${product.price}</p>
            
            <p className="text-gray-500 mb-10 leading-relaxed">
              {product.description} Designed for the modern urban explorer. 
              Features high-quality materials and attention to detail.
            </p>

            {/* Size Selection */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs tracking-wider text-gray-500">SELECT SIZE</p>
                <Link href="/size-guide" className="text-xs tracking-wider underline underline-offset-4 hover:no-underline">Size Guide</Link>
              </div>
              <div className="flex gap-3 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 border text-sm tracking-wider transition-all ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-10">
              <button
                onClick={handleAddToCart}
                className={`w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
                  addedToCart 
                    ? "bg-green-600 text-white" 
                    : "bg-black text-white hover:bg-gray-900"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" /> ADDED TO BAG
                  </>
                ) : (
                  "ADD TO BAG"
                )}
              </button>
              
              <button
                onClick={() => setIsTryOnOpen(true)}
                className="w-full border border-black py-4 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition"
              >
                VIRTUAL TRY-ON
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4" />
                <span>Free shipping over $150</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4" />
                <span>30-day returns</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Try On Modal */}
      <AnimatePresence>
        {isTryOnOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setIsTryOnOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Controls */}
              <div className="p-8 md:w-1/2 flex flex-col border-r border-gray-100 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-light tracking-tight mb-1">VIRTUAL TRY-ON</h2>
                    <p className="text-xs text-gray-400">Powered by AI</p>
                  </div>
                  <button 
                    onClick={() => setIsTryOnOpen(false)}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col gap-6">
                  {/* Upload Area */}
                  <div className={`flex-1 min-h-[200px] border border-dashed relative transition-colors ${userImage ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    {!userImage ? (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <Upload className="w-8 h-8 text-gray-400 mb-4" />
                        <p className="text-sm font-medium">Upload Your Photo</p>
                        <p className="text-xs text-gray-400 mt-2">Full body shot works best</p>
                      </label>
                    ) : (
                      <div className="relative w-full h-full min-h-[200px]">
                        <Image src={userImage} alt="User" fill className="object-contain p-4" />
                        <button 
                          onClick={resetTryOn}
                          className="absolute top-2 right-2 bg-white p-2 shadow hover:bg-gray-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 flex items-start gap-3 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="bg-gray-50 p-4 flex items-center gap-4">
                    <div className="w-12 h-16 bg-white relative overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">${product.price}</p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateTryOn}
                    disabled={!userImage || isProcessing}
                    className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> GENERATING
                      </>
                    ) : (
                      <>
                        GENERATE LOOK <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Images are processed by AI and not stored
                  </p>
                </div>
              </div>

              {/* Right: Result */}
              <div className="bg-neutral-100 md:w-1/2 p-8 flex flex-col justify-center items-center relative min-h-[400px]">
                {tryOnResult ? (
                  <div className="relative w-full h-full flex flex-col">
                    <div className="relative flex-1 overflow-hidden min-h-[300px]">
                      <Image src={tryOnResult} alt="Result" fill className="object-contain bg-white" />
                    </div>
                    <button
                      onClick={handleDownloadResult}
                      className="mt-4 w-full bg-black text-white py-3 text-sm tracking-wider font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> DOWNLOAD
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p className="text-sm">Processing your image...</p>
                        <p className="text-xs mt-2">This may take 10-30 seconds</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 border border-gray-300 mx-auto mb-4 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        </div>
                        <p className="text-sm">Result will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
