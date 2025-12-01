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
import { useRecommendations } from "@/context/RecommendationContext";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, RotateCcw, ArrowLeft, Upload, X, Loader2, AlertCircle, Download, 
  ArrowRight, Check, Heart, Star, Sparkles, ThumbsUp, CheckCircle, Camera,
  Eye, Users, AlertTriangle, Scale, Clock, TrendingUp, ShoppingBag, Bell, Mail
} from "lucide-react";

// Star Rating Component
function StarRating({ rating, size = "sm", interactive = false, onChange }: { 
  rating: number; size?: "sm" | "md" | "lg"; interactive?: boolean; onChange?: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={!interactive} onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)} onMouseLeave={() => setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}>
          <Star className={`${sizeClasses[size]} ${star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

// Live Inventory Alert Badge
function InventoryAlert({ productId }: { productId: string }) {
  const { getInventoryAlert, trackProductView } = useInventory();
  const [alert, setAlert] = useState<ReturnType<typeof getInventoryAlert>>(null);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    trackProductView(productId);
    setAlert(getInventoryAlert(productId));
    
    const interval = setInterval(() => {
      setAlert(getInventoryAlert(productId));
    }, 5000);

    // Randomly show "someone just purchased" notification
    const purchaseInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setShowPurchase(true);
        setTimeout(() => setShowPurchase(false), 4000);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(purchaseInterval);
    };
  }, [productId, getInventoryAlert, trackProductView]);

  if (!alert) return null;

  const isLowStock = alert.stock <= 5;
  const isVeryLowStock = alert.stock <= 2;

  return (
    <div className="space-y-2">
      {/* Stock Alert */}
      {isLowStock && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2 text-sm ${
            isVeryLowStock ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">
            {isVeryLowStock ? `Only ${alert.stock} left!` : `Low stock - ${alert.stock} remaining`}
          </span>
        </motion.div>
      )}

      {/* Viewers Alert */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm text-gray-600"
      >
        <Eye className="w-4 h-4" />
        <span>{alert.viewerCount} people viewing this</span>
      </motion.div>

      {/* Recent Purchase Notification */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Someone just purchased this item!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Complete the Look Section
function CompleteTheLook({ currentProduct, products }: { 
  currentProduct: { id: string; category: string; price: number };
  products: Array<{ id: string; name: string; price: number; image: string; category: string }>;
}) {
  const { addToCart } = useCart();
  const toast = useToast();

  // Suggest complementary items based on category
  const getComplementaryCategories = (category: string): string[] => {
    const complements: Record<string, string[]> = {
      "Tees": ["Pants", "Outerwear", "Hoodies"],
      "Hoodies": ["Pants", "Tees", "Outerwear"],
      "Outerwear": ["Tees", "Pants", "Hoodies"],
      "Pants": ["Tees", "Hoodies", "Outerwear"],
    };
    return complements[category] || ["Tees", "Pants"];
  };

  const complementaryCategories = getComplementaryCategories(currentProduct.category);
  const suggestions = products
    .filter(p => p.id !== currentProduct.id && complementaryCategories.includes(p.category))
    .slice(0, 3);

  if (suggestions.length === 0) return null;

  const handleQuickAdd = (product: typeof suggestions[0]) => {
    addToCart({
      id: product.id, name: product.name, price: product.price,
      image: product.image, category: product.category, quantity: 1, size: "M",
    });
    toast.success(`${product.name} added to bag`);
  };

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <h2 className="text-xl font-light tracking-tight mb-2">COMPLETE THE LOOK</h2>
      <p className="text-sm text-gray-500 mb-8">Style this piece with these complementary items</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suggestions.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <Link href={`/shop/${product.id}`}>
              <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">${product.price}</p>
              </div>
              <button 
                onClick={() => handleQuickAdd(product)}
                className="p-2 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Recently Viewed Section
function RecentlyViewedSection({ currentProductId }: { currentProductId: string }) {
  const { recentlyViewed } = useRecentlyViewed();
  
  const filtered = recentlyViewed.filter(p => p.id !== currentProductId).slice(0, 4);
  
  if (filtered.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="w-5 h-5 text-gray-400" />
        <h2 className="text-xl font-light tracking-tight">RECENTLY VIEWED</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <Link key={product.id} href={`/shop/${product.id}`} className="group">
            <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <p className="text-xs text-gray-400 mb-1">{product.category}</p>
            <h3 className="font-medium text-sm">{product.name}</h3>
            <p className="text-sm text-gray-600">${product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// AI-Powered Recommendations Section
function YouMayAlsoLike({ currentProductId }: { currentProductId: string }) {
  const { getPersonalizedRecommendations, getSimilarProducts } = useRecommendations();
  const { addToCart } = useCart();
  const toast = useToast();
  
  // Get personalized recommendations, falling back to similar products
  const recommendations = getPersonalizedRecommendations(4);
  const similarProducts = getSimilarProducts(currentProductId, 4);
  
  // Use personalized if available, otherwise similar products
  const displayProducts = recommendations.length > 0 
    ? recommendations.filter(p => p.id !== currentProductId).slice(0, 4)
    : similarProducts;
  
  if (displayProducts.length === 0) return null;

  const handleQuickAdd = (product: typeof displayProducts[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: 1,
      size: "M",
    });
    toast.success(`${product.name} added to bag`);
  };

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-light tracking-tight">YOU MAY ALSO LIKE</h2>
      </div>
      <p className="text-sm text-gray-500 mb-8">AI-powered recommendations based on your style</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <motion.div 
            key={product.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <Link href={`/shop/${product.id}`}>
              <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium">
                  AI PICK
                </div>
              </div>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-sm text-gray-600">${product.price}</p>
              </div>
              <button 
                onClick={() => handleQuickAdd(product)}
                className="p-2 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Product Comparison Drawer
function CompareDrawer() {
  const { compareItems, removeFromCompare, clearCompare, canAddMore } = useCompare();
  const [isExpanded, setIsExpanded] = useState(false);

  if (compareItems.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40"
    >
      {/* Collapsed View */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5" />
          <span className="font-medium">Compare ({compareItems.length}/3)</span>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ArrowRight className="w-5 h-5 rotate-90" />
        </motion.div>
      </button>

      {/* Expanded Comparison View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  {canAddMore ? `Add ${3 - compareItems.length} more to compare` : "Compare up to 3 products"}
                </p>
                <button 
                  onClick={clearCompare}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {compareItems.map((item) => (
                  <div key={item.id} className="relative border border-gray-200 p-4">
                    <button 
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="relative aspect-square bg-gray-100 mb-3">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <h4 className="font-medium text-sm mb-1 truncate">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                  </div>
                ))}
                
                {/* Empty Slots */}
                {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="border border-dashed border-gray-300 p-4 flex items-center justify-center min-h-[200px]">
                    <p className="text-sm text-gray-400 text-center">Add product<br/>to compare</p>
                  </div>
                ))}
              </div>

              {compareItems.length >= 2 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="font-medium mb-4">Quick Comparison</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-left font-medium text-gray-500">Feature</th>
                          {compareItems.map(item => (
                            <th key={item.id} className="py-2 text-left font-medium">{item.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Price</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">${item.price}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Category</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.category}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Sizes</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.sizes?.join(", ") || "S, M, L, XL"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 text-gray-500">Material</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="py-3">{item.material || "Premium Cotton"}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-gray-100 py-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <StarRating rating={review.rating} />
            {review.verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>
          <p className="font-medium">{review.title}</p>
        </div>
        <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
      </div>
      <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.images.map((img, i) => (
            <div key={i} className="relative w-16 h-16 bg-gray-100">
              <Image src={img} alt="Review" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">By {review.userName}</p>
        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition">
          <ThumbsUp className="w-3 h-3" /> Helpful ({review.helpful})
        </button>
      </div>
    </div>
  );
}

// Size Recommendation Modal
function SizeRecommendationModal({ isOpen, onClose, category, availableSizes, onSizeSelect }: { 
  isOpen: boolean; onClose: () => void; category: string; availableSizes: string[]; onSizeSelect: (size: string) => void;
}) {
  const { measurements, saveMeasurements, getRecommendation, estimateFromHeightWeight } = useSizeRecommendation();
  const toast = useToast();
  
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [height, setHeight] = useState(measurements?.height || 170);
  const [weight, setWeight] = useState(measurements?.weight || 70);
  const [chest, setChest] = useState(measurements?.chest || 0);
  const [waist, setWaist] = useState(measurements?.waist || 0);
  const [hips, setHips] = useState(measurements?.hips || 0);
  const [fitPreference, setFitPreference] = useState<"slim" | "regular" | "relaxed">(measurements?.fitPreference || "regular");
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getRecommendation>>(null);

  useEffect(() => {
    if (measurements) {
      setHeight(measurements.height); setWeight(measurements.weight);
      setChest(measurements.chest); setWaist(measurements.waist);
      setHips(measurements.hips); setFitPreference(measurements.fitPreference);
    }
  }, [measurements]);

  const handleCalculate = () => {
    let newMeasurements;
    if (mode === "quick") {
      const estimated = estimateFromHeightWeight(height, weight);
      newMeasurements = { height, weight, chest: estimated.chest, waist: estimated.waist, hips: estimated.hips, fitPreference };
    } else {
      newMeasurements = { height, weight, chest, waist, hips, fitPreference };
    }
    saveMeasurements(newMeasurements);
    const rec = getRecommendation(category, availableSizes);
    setRecommendation(rec);
    toast.success("Size recommendation calculated!");
  };

  const handleSelectRecommended = () => {
    if (recommendation) { onSizeSelect(recommendation.recommendedSize); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5" /> SIZE FINDER</h2>
              <p className="text-xs text-gray-400 mt-1">AI-powered size recommendation</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode("quick")} className={`flex-1 py-3 text-sm tracking-wider transition ${mode === "quick" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"}`}>QUICK</button>
            <button onClick={() => setMode("detailed")} className={`flex-1 py-3 text-sm tracking-wider transition ${mode === "detailed" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"}`}>DETAILED</button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">HEIGHT (CM)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">WEIGHT (KG)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" />
              </div>
            </div>
            {mode === "detailed" && (
              <>
                <div><label className="block text-xs tracking-wider text-gray-500 mb-2">CHEST (CM)</label><input type="number" value={chest} onChange={(e) => setChest(Number(e.target.value))} placeholder="Measure around fullest part" className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" /></div>
                <div><label className="block text-xs tracking-wider text-gray-500 mb-2">WAIST (CM)</label><input type="number" value={waist} onChange={(e) => setWaist(Number(e.target.value))} placeholder="Measure at natural waistline" className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" /></div>
                <div><label className="block text-xs tracking-wider text-gray-500 mb-2">HIPS (CM)</label><input type="number" value={hips} onChange={(e) => setHips(Number(e.target.value))} placeholder="Measure around fullest part" className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" /></div>
              </>
            )}
          </div>
          <div className="mt-6">
            <label className="block text-xs tracking-wider text-gray-500 mb-3">FIT PREFERENCE</label>
            <div className="flex gap-2">
              {(["slim", "regular", "relaxed"] as const).map((fit) => (
                <button key={fit} onClick={() => setFitPreference(fit)} className={`flex-1 py-3 text-sm tracking-wider capitalize transition ${fitPreference === fit ? "bg-black text-white" : "border border-gray-200 hover:border-black"}`}>{fit}</button>
              ))}
            </div>
          </div>
          <button onClick={handleCalculate} className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium mt-6 hover:bg-gray-900 transition">FIND MY SIZE</button>
          {recommendation && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-6 bg-green-50 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 flex items-center justify-center"><span className="text-xl font-bold text-green-700">{recommendation.recommendedSize}</span></div>
                <div><p className="font-medium">Recommended Size</p><p className="text-xs text-gray-500">{recommendation.confidence}% confidence</p></div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{recommendation.notes}</p>
              {recommendation.alternativeSize && <p className="text-xs text-gray-500 mb-4">Alternative: {recommendation.alternativeSize}</p>}
              <button onClick={handleSelectRecommended} className="w-full bg-green-600 text-white py-3 text-sm tracking-wider font-medium hover:bg-green-700 transition">SELECT {recommendation.recommendedSize}</button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Review Form Modal
function ReviewFormModal({ isOpen, onClose, productId, onSubmit }: { isOpen: boolean; onClose: () => void; productId: string; onSubmit: () => void; }) {
  const { addReview, loading } = useReviews();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) { toast.error("Please fill in all fields"); return; }
    const success = await addReview({ productId, rating, title, comment, verifiedPurchase: false });
    if (success) { toast.success("Review submitted!"); setRating(5); setTitle(""); setComment(""); onSubmit(); onClose(); }
    else { toast.error("Failed to submit review."); }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start"><h2 className="text-xl font-light tracking-tight">WRITE A REVIEW</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 transition"><X className="w-5 h-5" /></button></div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div><label className="block text-xs tracking-wider text-gray-500 mb-3">YOUR RATING</label><StarRating rating={rating} size="lg" interactive onChange={setRating} /></div>
          <div><label className="block text-xs tracking-wider text-gray-500 mb-2">REVIEW TITLE</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up" className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition" required /></div>
          <div><label className="block text-xs tracking-wider text-gray-500 mb-2">YOUR REVIEW</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like?" rows={4} className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none" required /></div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING</> : "SUBMIT REVIEW"}</button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Back in Stock Notification Modal
function BackInStockModal({ 
  isOpen, onClose, product, selectedSize 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: { id: string; name: string; image: string }; 
  selectedSize?: string;
}) {
  const { user } = useAuth();
  const { subscribeToStock, isSubscribed } = useStockNotification();
  const toast = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    setSubscribed(isSubscribed(product.id, selectedSize));
  }, [product.id, selectedSize, isSubscribed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    const success = await subscribeToStock(product, email, selectedSize);
    setIsSubmitting(false);

    if (success) {
      setSubscribed(true);
      toast.success("You'll be notified when this item is back in stock!");
      setTimeout(onClose, 1500);
    } else {
      toast.error("Failed to subscribe. Please try again.");
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
        className="bg-white w-full max-w-md overflow-hidden shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight">NOTIFY ME</h2>
                <p className="text-xs text-gray-500">Get alerted when back in stock</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Product Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 mb-6">
            <div className="w-16 h-20 bg-gray-200 relative overflow-hidden flex-shrink-0">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-medium">{product.name}</h3>
              {selectedSize && (
                <p className="text-sm text-gray-500">Size: {selectedSize}</p>
              )}
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Currently out of stock
              </p>
            </div>
          </div>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">You&apos;re on the list!</h3>
              <p className="text-sm text-gray-500">
                We&apos;ll email you at <span className="font-medium">{email}</span> when this item is available.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> SUBSCRIBING...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" /> NOTIFY ME
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                We&apos;ll only email you once when this item is restocked. No spam, promise.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  const { isSubscribed: isStockSubscribed } = useStockNotification();
  const { getInventoryAlert } = useInventory();
  const toast = useToast();
  
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
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const product = getProduct(params.id as string);
  const inCompare = product ? isInCompare(product.id) : false;
  const inventoryAlert = product ? getInventoryAlert(product.id) : null;
  const isOutOfStock = inventoryAlert && inventoryAlert.stock === 0;

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

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (!product) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><h1 className="text-2xl font-light tracking-tight mb-4">Product not found</h1><Link href="/shop" className="text-sm tracking-wider underline underline-offset-4">Back to Shop</Link></div>;

  const sizes = product.sizes || ["S", "M", "L", "XL"];
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: getCurrentImage(), 
      category: product.category, 
      quantity: 1, 
      size: selectedSize,
      color: selectedColor || undefined
    });
    const colorText = selectedColor ? ` in ${selectedColor}` : "";
    toast.success(`${product.name} (${selectedSize})${colorText} added to bag`);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = () => {
    toggleWishlist({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category });
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleToggleCompare = () => {
    if (inCompare) {
      removeFromCompare(product.id);
      toast.info("Removed from comparison");
    } else if (canAddMore) {
      addToCompare({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category, description: product.description, sizes });
      toast.success("Added to comparison");
    } else {
      toast.warning("You can only compare 3 products at a time");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setError("Image too large."); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setUserImage(reader.result as string); setTryOnResult(null); setError(null); };
      reader.onerror = () => setError("Failed to read image.");
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
    setIsProcessing(true); setError(null);
    try {
      const productImageBase64 = await fetchProductImageAsBase64(product.image);
      const response = await fetch("/api/try-on", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userImage, productImage: productImageBase64, productName: product.name, productCategory: product.category }) });
      const data = await response.json();
      if (data.success && data.image) { setTryOnResult(data.image); }
      else { setError(data.error || "Failed to generate try-on image."); }
    } catch (err) { console.error(err); setError("Network error."); }
    finally { setIsProcessing(false); }
  };

  const handleDownloadResult = () => {
    if (!tryOnResult) return;
    const link = document.createElement("a");
    link.href = tryOnResult;
    link.download = `cipher-tryon-${product.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const resetTryOn = () => { setUserImage(null); setTryOnResult(null); setError(null); };

  return (
    <div className="min-h-screen pb-24">
      <div className="container mx-auto px-4 py-6 border-b border-gray-100">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Collection</Link>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-[3/4] bg-gray-100">
            <Image src={getCurrentImage()} alt={product.name} fill className="object-cover" />
            <button onClick={handleToggleWishlist} className={`absolute top-4 right-4 w-12 h-12 flex items-center justify-center transition shadow-lg ${inWishlist ? "bg-red-500 text-white" : "bg-white hover:bg-gray-50"}`}>
              <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
            </button>
            <button onClick={handleToggleCompare} className={`absolute top-4 right-20 w-12 h-12 flex items-center justify-center transition shadow-lg ${inCompare ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>
              <Scale className="w-5 h-5" />
            </button>
            
            {/* Color Thumbnail Gallery */}
            {product.colors && product.colors.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
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
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col justify-center">
            <p className="text-xs tracking-[0.2em] text-gray-400 mb-4">{product.category.toUpperCase()}</p>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3">{product.name}</h1>
            
            {avgRating.count > 0 && (
              <div className="flex items-center gap-2 mb-4"><StarRating rating={avgRating.average} /><span className="text-sm text-gray-500">{avgRating.average} ({avgRating.count} review{avgRating.count !== 1 ? "s" : ""})</span></div>
            )}
            
            <p className="text-xl mb-4">${product.price}</p>

            {/* Live Inventory Alerts */}
            <div className="mb-6">
              <InventoryAlert productId={product.id} />
            </div>

            <p className="text-gray-500 mb-8 leading-relaxed">{product.description} Designed for the modern urban explorer.</p>

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
                      onClick={() => setSelectedColor(color.name)}
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
                      {/* Checkmark for selected */}
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

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs tracking-wider text-gray-500">SELECT SIZE</p>
                <div className="flex gap-4">
                  <button onClick={() => setIsSizeModalOpen(true)} className="text-xs tracking-wider text-black flex items-center gap-1 hover:underline underline-offset-4"><Sparkles className="w-3 h-3" /> Find My Size</button>
                  <Link href="/size-guide" className="text-xs tracking-wider underline underline-offset-4 hover:no-underline">Size Guide</Link>
                </div>
              </div>
              
              {sizeRecommendation && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 flex items-center gap-3"><Sparkles className="w-4 h-4 text-green-600" /><p className="text-sm text-green-700">Based on your profile, we recommend size <strong>{sizeRecommendation.recommendedSize}</strong></p></div>
              )}
              
              <div className="flex gap-3 flex-wrap">
                {sizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`w-14 h-14 border text-sm tracking-wider transition-all relative ${selectedSize === size ? "border-black bg-black text-white" : "border-gray-200 hover:border-black"}`}>
                    {size}
                    {sizeRecommendation?.recommendedSize === size && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-10">
              {isOutOfStock ? (
                <button onClick={() => setIsStockNotifyModalOpen(true)} className="w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-black">
                  <Bell className="w-4 h-4" /> NOTIFY ME WHEN AVAILABLE
                </button>
              ) : (
                <button onClick={handleAddToCart} className={`w-full py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${addedToCart ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-900"}`}>
                  {addedToCart ? <><Check className="w-4 h-4" /> ADDED TO BAG</> : "ADD TO BAG"}
                </button>
              )}
              
              <div className="grid grid-cols-3 gap-3">
                <button onClick={handleToggleWishlist} className={`border py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${inWishlist ? "border-red-500 text-red-500 bg-red-50" : "border-black hover:bg-black hover:text-white"}`}>
                  <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
                </button>
                <button onClick={handleToggleCompare} className={`border py-4 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${inCompare ? "border-black bg-black text-white" : "border-black hover:bg-black hover:text-white"}`}>
                  <Scale className="w-4 h-4" />
                </button>
                <button onClick={() => setIsTryOnOpen(true)} className="border border-black py-4 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-3"><Truck className="w-4 h-4" /><span>Free shipping over $150</span></div>
              <div className="flex items-center gap-3"><RotateCcw className="w-4 h-4" /><span>30-day returns</span></div>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 border-t border-gray-200">
          <div className="flex gap-8 border-b border-gray-200">
            <button onClick={() => setActiveTab("description")} className={`py-6 text-sm tracking-wider transition ${activeTab === "description" ? "border-b-2 border-black font-medium" : "text-gray-500"}`}>DESCRIPTION</button>
            <button onClick={() => setActiveTab("reviews")} className={`py-6 text-sm tracking-wider transition ${activeTab === "reviews" ? "border-b-2 border-black font-medium" : "text-gray-500"}`}>REVIEWS ({avgRating.count})</button>
          </div>

          <div className="py-10">
            {activeTab === "description" ? (
              <div className="max-w-2xl">
                <p className="text-gray-600 leading-relaxed mb-6">{product.description} This piece is crafted with premium materials and designed for both style and comfort.</p>
                <h4 className="font-medium mb-3">Features</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1"><li>Premium quality materials</li><li>Modern streetwear design</li><li>Comfortable fit for all-day wear</li><li>Machine washable</li></ul>
              </div>
            ) : (
              <div>
                {user && canReview && <button onClick={() => setIsReviewModalOpen(true)} className="mb-8 bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition flex items-center gap-2"><Star className="w-4 h-4" /> WRITE A REVIEW</button>}
                {!user && <p className="mb-8 text-gray-500"><Link href="/login" className="underline">Log in</Link> to write a review.</p>}
                {reviews.length > 0 ? <div className="max-w-2xl">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : (
                  <div className="text-center py-12 text-gray-500"><Star className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>No reviews yet. Be the first to share your thoughts!</p></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Complete the Look Section */}
        <CompleteTheLook currentProduct={product} products={products} />

        {/* AI-Powered Recommendations */}
        <YouMayAlsoLike currentProductId={product.id} />

        {/* Recently Viewed Section */}
        <RecentlyViewedSection currentProductId={product.id} />
      </div>

      {/* Compare Drawer */}
      <CompareDrawer />

      {/* Modals */}
      <AnimatePresence>{isSizeModalOpen && <SizeRecommendationModal isOpen={isSizeModalOpen} onClose={() => setIsSizeModalOpen(false)} category={product.category} availableSizes={sizes} onSizeSelect={setSelectedSize} />}</AnimatePresence>
      <AnimatePresence>{isReviewModalOpen && <ReviewFormModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} productId={product.id} onSubmit={refreshReviews} />}</AnimatePresence>
      <AnimatePresence>
        {isTryOnOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsTryOnOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 md:w-1/2 flex flex-col border-r border-gray-100 overflow-y-auto">
                <div className="flex justify-between items-start mb-8"><div><h2 className="text-xl font-light tracking-tight mb-1">VIRTUAL TRY-ON</h2><p className="text-xs text-gray-400">Powered by AI</p></div><button onClick={() => setIsTryOnOpen(false)} className="p-2 hover:bg-gray-100 transition"><X className="w-5 h-5" /></button></div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className={`flex-1 min-h-[200px] border border-dashed relative transition-colors ${userImage ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    {!userImage ? (<label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /><Upload className="w-8 h-8 text-gray-400 mb-4" /><p className="text-sm font-medium">Upload Your Photo</p><p className="text-xs text-gray-400 mt-2">Full body shot works best</p></label>) : (<div className="relative w-full h-full min-h-[200px]"><Image src={userImage} alt="User" fill className="object-contain p-4" /><button onClick={resetTryOn} className="absolute top-2 right-2 bg-white p-2 shadow hover:bg-gray-50 transition"><X className="w-4 h-4" /></button></div>)}
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 flex items-start gap-3 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{error}</p></div>}
                  <div className="bg-gray-50 p-4 flex items-center gap-4"><div className="w-12 h-16 bg-white relative overflow-hidden border border-gray-200 flex-shrink-0"><Image src={product.image} alt={product.name} fill className="object-cover" /></div><div><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-gray-500">${product.price}</p></div></div>
                  <button onClick={handleGenerateTryOn} disabled={!userImage || isProcessing} className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING</> : <>GENERATE LOOK <ArrowRight className="w-4 h-4" /></>}</button>
                  <p className="text-xs text-gray-400 text-center">Images are processed by AI and not stored</p>
                </div>
              </div>
              <div className="bg-neutral-100 md:w-1/2 p-8 flex flex-col justify-center items-center relative min-h-[400px]">
                {tryOnResult ? (<div className="relative w-full h-full flex flex-col"><div className="relative flex-1 overflow-hidden min-h-[300px]"><Image src={tryOnResult} alt="Result" fill className="object-contain bg-white" /></div><button onClick={handleDownloadResult} className="mt-4 w-full bg-black text-white py-3 text-sm tracking-wider font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2"><Download className="w-4 h-4" /> DOWNLOAD</button></div>) : (<div className="text-center text-gray-400">{isProcessing ? (<><Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" /><p className="text-sm">Processing your image...</p><p className="text-xs mt-2">This may take 10-30 seconds</p></>) : (<><div className="w-16 h-16 border border-gray-300 mx-auto mb-4 flex items-center justify-center"><div className="w-2 h-2 bg-gray-300 rounded-full" /></div><p className="text-sm">Result will appear here</p></>)}</div>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
