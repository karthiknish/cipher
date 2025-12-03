"use client";

import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { useReviews, Review } from "@/context/ReviewContext";
import { useSizeRecommendation } from "@/context/SizeRecommendationContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useCompare } from "@/context/CompareContext";
import { useInventory } from "@/context/InventoryContext";
import { useStockNotification } from "@/context/StockNotificationContext";
import { useAuth } from "@/context/AuthContext";
import { useLiveActivity } from "@/context/LiveActivityContext";
import { useDynamicPricing } from "@/context/DynamicPricingContext";
import { useProductAnalytics, useScrollDepthTracking } from "@/hooks/useAnalytics";
import VirtualTryOn from "@/components/VirtualTryOn";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, ArrowsClockwise, ArrowLeft, SpinnerGap,
  Check, Heart, Sparkle, Scales, Clock, Bell, Camera, TrendUp, MagicWand,
  ShareNetwork, XLogo, FacebookLogo, PinterestLogo, Link as LinkIcon, WhatsappLogo
} from "@phosphor-icons/react";

// Import modular components
import {
  StarRating,
  InventoryAlert,
  CompleteTheLook,
  RecentlyViewedSection,
  YouMayAlsoLike,
  CompareDrawer,
  ReviewsSection,
  SizeRecommendationModal,
  BackInStockModal,
  ReviewFormModal,
} from "./components";

export default function ProductPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { products, getProduct, loading } = useProducts();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getProductReviews, getAverageRating, canUserReview } = useReviews();
  const { measurements, getRecommendation } = useSizeRecommendation();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { addToCompare, isInCompare, removeFromCompare, canAddMore } = useCompare();
  const { getInventoryAlert } = useInventory();
  const { trackProductView, untrackProductView, getViewerCount, logCartAdd, logLike } = useLiveActivity();
  const { getDynamicPrice } = useDynamicPricing();
  const toast = useToast();
  
  // Analytics hooks
  const { 
    trackProductView: trackAnalyticsProductView, 
    trackAddToCart, 
    trackAddToWishlist,
    trackSizeSelect,
    trackColorSelect,
    startProductViewTimer,
    endProductViewTimer 
  } = useProductAnalytics();
  useScrollDepthTracking();
  
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
  const [canReview, setCanReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isStockNotifyModalOpen, setIsStockNotifyModalOpen] = useState(false);
  const [sizeRecommendation, setSizeRecommendation] = useState<ReturnType<typeof getRecommendation>>(null);
  
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const product = getProduct(params.id as string);
  const inCompare = product ? isInCompare(product.id) : false;
  const inventoryAlert = product ? getInventoryAlert(product.id) : null;
  const isOutOfStock = inventoryAlert && inventoryAlert.stock === 0;

  // Track product view for analytics
  useEffect(() => {
    if (product) {
      trackAnalyticsProductView({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      });
      startProductViewTimer(product.id);
      
      return () => {
        endProductViewTimer(product.id);
      };
    }
  }, [product, trackAnalyticsProductView, startProductViewTimer, endProductViewTimer]);

  // Set default color when product loads
  useEffect(() => {
    if (product && product.colors && product.colors.length > 0 && !selectedColor) {
      setSelectedColor(product.colors[0].name);
    }
  }, [product, selectedColor]);

  // Get current image based on selected color
  const getCurrentImage = () => {
    if (product && product.colors && selectedColor) {
      const colorVariant = product.colors.find(c => c.name === selectedColor);
      if (colorVariant?.image) return colorVariant.image;
    }
    return product?.image || "";
  };

  // Track recently viewed
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id, name: product.name, price: product.price,
        image: product.image, category: product.category,
      });
    }
  }, [product, addToRecentlyViewed]);

  // Track live viewers
  useEffect(() => {
    if (product) {
      trackProductView(product.id);
      return () => untrackProductView(product.id);
    }
  }, [product, trackProductView, untrackProductView]);

  // Get live viewer count
  const liveViewerCount = product ? getViewerCount(product.id) : 0;

  useEffect(() => {
    if (product) {
      const loadReviewData = async () => {
        const [reviewsData, ratingData, canReviewData] = await Promise.all([
          getProductReviews(product.id), getAverageRating(product.id), canUserReview(product.id),
        ]);
        setReviews(reviewsData); setAvgRating(ratingData); setCanReview(canReviewData);
      };
      loadReviewData();
    }
  }, [product, getProductReviews, getAverageRating, canUserReview]);

  useEffect(() => {
    if (product && measurements) {
      const sizes = product.sizes || ["S", "M", "L", "XL"];
      const rec = getRecommendation(product.category, sizes);
      setSizeRecommendation(rec);
    }
  }, [product, measurements, getRecommendation]);

  const refreshReviews = async () => {
    if (product) {
      const [reviewsData, ratingData] = await Promise.all([getProductReviews(product.id), getAverageRating(product.id)]);
      setReviews(reviewsData); setAvgRating(ratingData); setCanReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
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
  const inWishlist = isInWishlist(product.id);

  // Get dynamic pricing
  const stockLevel = inventoryAlert?.stock;
  const dynamicPrice = getDynamicPrice(
    product.id, 
    product.price, 
    product.category, 
    1, 
    stockLevel, 
    liveViewerCount
  );
  const hasDiscount = dynamicPrice.currentPrice < dynamicPrice.originalPrice;
  const hasSurge = dynamicPrice.currentPrice > dynamicPrice.originalPrice;

  const handleAddToCart = () => {
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: dynamicPrice.currentPrice,
      image: getCurrentImage(), 
      category: product.category, 
      quantity: 1, 
      size: selectedSize,
      color: selectedColor || undefined
    });
    const colorText = selectedColor ? ` in ${selectedColor}` : "";
    const priceText = hasDiscount ? ` (${dynamicPrice.discountPercent}% off!)` : "";
    toast.success(`${product.name} (${selectedSize})${colorText}${priceText} added to bag`);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    logCartAdd(product.id, product.name, product.image);
    trackAddToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: dynamicPrice.currentPrice,
      quantity: 1,
    });
  };

  const handleToggleWishlist = () => {
    toggleWishlist({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category });
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
    if (!inWishlist) {
      logLike(product.id, product.name, product.image);
      trackAddToWishlist({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      });
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    trackSizeSelect(product.id, size);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    trackColorSelect(product.id, color);
  };

  const handleToggleCompare = () => {
    if (inCompare) {
      removeFromCompare(product.id);
      toast.info("Removed from comparison");
    } else if (canAddMore) {
      addToCompare({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image, 
        category: product.category, 
        description: product.description, 
        sizes 
      });
      toast.success("Added to comparison");
    } else {
      toast.warning("You can only compare 3 products at a time");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6 border-b border-gray-100">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Product Image */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[3/4] bg-gray-100">
            <Image src={getCurrentImage()} alt={product.name} fill className="object-cover" />
            <button 
              onClick={handleToggleWishlist} 
              className={`absolute top-4 right-4 w-12 h-12 flex items-center justify-center transition shadow-lg ${
                inWishlist ? "bg-red-500 text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
            </button>
            <button 
              onClick={handleToggleCompare} 
              className={`absolute top-4 right-20 w-12 h-12 flex items-center justify-center transition shadow-lg ${
                inCompare ? "bg-black text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              <Scales className="w-5 h-5" />
            </button>
            
            {/* Virtual Try-On Floating Button */}
            <button
              onClick={() => setIsTryOnOpen(true)}
              className="absolute bottom-4 right-4 bg-black text-white px-4 py-3 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:bg-gray-800 transition-all rounded-full group"
            >
              <MagicWand className="w-5 h-5" />
              <span className="text-sm font-medium">Try On</span>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </button>
            
            {/* Color Thumbnail Gallery */}
            {product.colors && product.colors.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color.name)}
                    className={`w-12 h-12 border-2 bg-white overflow-hidden transition-all ${
                      selectedColor === color.name 
                        ? "border-black" 
                        : "border-transparent hover:border-gray-300"
                    }`}
                    title={color.name}
                  >
                    {color.image ? (
                      <Image 
                        src={color.image} 
                        alt={color.name} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div 
                        className="w-full h-full" 
                        style={{ backgroundColor: color.hex }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Product Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="flex flex-col justify-center"
          >
            <p className="text-xs tracking-[0.2em] text-gray-400 mb-4">{product.category.toUpperCase()}</p>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3">{product.name}</h1>
            
            {avgRating.count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={avgRating.average} />
                <span className="text-sm text-gray-500">
                  {avgRating.average.toFixed(1)} ({avgRating.count} review{avgRating.count !== 1 ? "s" : ""})
                </span>
              </div>
            )}
            
            {/* Dynamic Pricing Display */}
            <div className="mb-4">
              {hasDiscount ? (
                <div className="flex items-center gap-3">
                  <p className="text-xl font-medium text-red-600">${dynamicPrice.currentPrice.toFixed(2)}</p>
                  <p className="text-lg text-gray-400 line-through">${dynamicPrice.originalPrice.toFixed(2)}</p>
                  <span className="bg-red-100 text-red-700 px-2 py-1 text-xs font-medium">
                    -{dynamicPrice.discountPercent}% OFF
                  </span>
                </div>
              ) : hasSurge ? (
                <div className="flex items-center gap-3">
                  <p className="text-xl font-medium">${dynamicPrice.currentPrice.toFixed(2)}</p>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 text-xs font-medium flex items-center gap-1">
                    <TrendUp className="w-3 h-3" /> HIGH DEMAND
                  </span>
                </div>
              ) : (
                <p className="text-xl">${product.price}</p>
              )}
              {dynamicPrice.reason && (hasDiscount || hasSurge) && (
                <p className="text-xs text-gray-500 mt-1">{dynamicPrice.reason}</p>
              )}
              {dynamicPrice.expiresAt && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Ends {dynamicPrice.expiresAt.toLocaleString()}
                </p>
              )}
            </div>

            {/* Live Inventory Alerts */}
            <div className="mb-6">
              <InventoryAlert productId={product.id} />
            </div>

            <p className="text-gray-500 mb-8 leading-relaxed">
              {product.description} Designed for the modern urban explorer.
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs tracking-wider text-gray-500">SELECT COLOR</p>
                  {selectedColor && (
                    <p className="text-xs font-medium">— {selectedColor}</p>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorSelect(color.name)}
                      title={color.name}
                      className={`group relative w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color.name
                          ? "border-black scale-110"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="absolute inset-1 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      {selectedColor === color.name && (
                        <motion.span 
                          layoutId="colorIndicator"
                          className="absolute inset-0 rounded-full border-2 border-black"
                        />
                      )}
                      {selectedColor === color.name && (
                        <Check 
                          className={`absolute inset-0 m-auto w-4 h-4 ${
                            color.hex === "#ffffff" || color.hex === "#f5f5f5" 
                              ? "text-black" 
                              : "text-white"
                          }`} 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs tracking-wider text-gray-500">SELECT SIZE</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsSizeModalOpen(true)} 
                    className="text-xs tracking-wider text-black flex items-center gap-1 hover:underline underline-offset-4"
                  >
                    <Sparkle className="w-3 h-3" /> Find My Size
                  </button>
                  <Link href="/size-guide" className="text-xs tracking-wider underline underline-offset-4 hover:no-underline">
                    Size Guide
                  </Link>
                </div>
              </div>
              
              {sizeRecommendation && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 flex items-center gap-3">
                  <Sparkle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    Based on your profile, we recommend size <strong>{sizeRecommendation.recommendedSize}</strong>
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 flex-wrap">
                {sizes.map((size) => (
                  <button 
                    key={size} 
                    onClick={() => handleSizeSelect(size)} 
                    className={`w-14 h-14 border text-sm tracking-wider transition-all relative ${
                      selectedSize === size 
                        ? "border-black bg-black text-white" 
                        : "border-gray-200 hover:border-black"
                    }`}
                  >
                    {size}
                    {sizeRecommendation?.recommendedSize === size && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-10">
              {isOutOfStock ? (
                <button 
                  onClick={() => setIsStockNotifyModalOpen(true)} 
                  className="w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-black"
                >
                  <Bell className="w-4 h-4" /> NOTIFY ME WHEN AVAILABLE
                </button>
              ) : (
                <button 
                  onClick={handleAddToCart} 
                  className={`w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
                    addedToCart ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {addedToCart ? <><Check className="w-4 h-4" /> ADDED TO BAG</> : "ADD TO BAG"}
                </button>
              )}
              
              {/* Virtual Try-On CTA - Prominent */}
              <button 
                onClick={() => setIsTryOnOpen(true)} 
                className="w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-3 bg-gray-900 text-white hover:bg-black hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
              >
                <MagicWand className="w-5 h-5" />
                <span>TRY IT ON WITH AI</span>
                <span className="px-2 py-0.5 bg-white/20 text-[10px] font-bold">
                  NEW
                </span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleToggleWishlist} 
                  className={`border py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
                    inWishlist 
                      ? "border-red-500 text-red-500 bg-red-50" 
                      : "border-black hover:bg-black hover:text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
                  {inWishlist ? "SAVED" : "WISHLIST"}
                </button>
                <button 
                  onClick={handleToggleCompare} 
                  className={`border py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
                    inCompare 
                      ? "border-black bg-black text-white" 
                      : "border-black hover:bg-black hover:text-white"
                  }`}
                >
                  <Scales className="w-4 h-4" />
                  COMPARE
                </button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4" />
                <span>Free shipping over $150</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowsClockwise className="w-4 h-4" />
                <span>30-day returns</span>
              </div>
            </div>

            {/* Social Share */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wider text-gray-500">SHARE THIS PRODUCT</p>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        const text = `Check out ${product.name} from CIPHER!`;
                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "width=550,height=420");
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
                      title="Share on X"
                    >
                      <XLogo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=550,height=420");
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
                      title="Share on Facebook"
                    >
                      <FacebookLogo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        const imageUrl = getCurrentImage();
                        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(product.name)}`, "_blank", "width=750,height=550");
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
                      title="Pin on Pinterest"
                    >
                      <PinterestLogo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        const text = `Check out ${product.name} from CIPHER! ${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
                      title="Share on WhatsApp"
                    >
                      <WhatsappLogo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard!");
                        } catch {
                          toast.error("Failed to copy link");
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
                      title="Copy Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Description / Reviews Tabs */}
        <div className="mt-20 border-t border-gray-200">
          <div className="flex gap-8 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab("description")} 
              className={`py-6 text-sm tracking-wider transition ${
                activeTab === "description" 
                  ? "border-b-2 border-black font-medium" 
                  : "text-gray-500"
              }`}
            >
              DESCRIPTION
            </button>
            <button 
              onClick={() => setActiveTab("reviews")} 
              className={`py-6 text-sm tracking-wider transition ${
                activeTab === "reviews" 
                  ? "border-b-2 border-black font-medium" 
                  : "text-gray-500"
              }`}
            >
              REVIEWS ({avgRating.count})
            </button>
          </div>

          <div className="py-10">
            {activeTab === "description" ? (
              <div className="max-w-2xl">
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description} This piece is crafted with premium materials and designed for both style and comfort.
                </p>
                <h4 className="font-medium mb-3">Features</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Premium quality materials</li>
                  <li>Modern streetwear design</li>
                  <li>Comfortable fit for all-day wear</li>
                  <li>Machine washable</li>
                </ul>
              </div>
            ) : (
              <ReviewsSection 
                productId={product.id} 
                reviews={reviews} 
                avgRating={avgRating} 
                canReview={canReview} 
                onReviewAdded={refreshReviews} 
              />
            )}
          </div>
        </div>

        {/* Product Sections */}
        <CompleteTheLook currentProduct={product} products={products} />
        <YouMayAlsoLike currentProductId={product.id} />
        <RecentlyViewedSection currentProductId={product.id} />
      </div>

      {/* Compare Drawer */}
      <CompareDrawer />

      {/* Modals */}
      <AnimatePresence>
        {isSizeModalOpen && (
          <SizeRecommendationModal 
            isOpen={isSizeModalOpen} 
            onClose={() => setIsSizeModalOpen(false)} 
            category={product.category} 
            availableSizes={sizes} 
            onSizeSelect={handleSizeSelect} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isReviewModalOpen && (
          <ReviewFormModal 
            isOpen={isReviewModalOpen} 
            onClose={() => setIsReviewModalOpen(false)} 
            productId={product.id} 
            onSubmit={refreshReviews} 
          />
        )}
      </AnimatePresence>
      
      {/* Virtual Try-On Modal */}
      <VirtualTryOn
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          colors: product.colors,
        }}
        selectedColor={selectedColor || undefined}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleToggleWishlist}
      />

      <AnimatePresence>
        {isStockNotifyModalOpen && product && (
          <BackInStockModal 
            isOpen={isStockNotifyModalOpen} 
            onClose={() => setIsStockNotifyModalOpen(false)} 
            product={{ id: product.id, name: product.name, image: product.image }}
            selectedSize={selectedSize}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
