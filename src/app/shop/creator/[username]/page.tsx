"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { 
  InstagramLogo, 
  TiktokLogo, 
  YoutubeLogo, 
  TwitterLogo,
  Heart,
  ShoppingBag,
  CheckCircle,
  Broadcast,
  ArrowRight,
  Share,
  SpinnerGap,
  Play,
  X
} from "@phosphor-icons/react";
import { useInfluencer } from "@/context/InfluencerContext";
import { useProducts, Product } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";

const TIER_BADGES = {
  bronze: { color: "bg-amber-700", text: "Bronze Creator" },
  silver: { color: "bg-gray-400", text: "Silver Creator" },
  gold: { color: "bg-yellow-500", text: "Gold Creator" },
  platinum: { color: "bg-gradient-to-r from-purple-500 to-pink-500", text: "Platinum Creator" },
};

export default function CreatorStorefront() {
  const params = useParams();
  const username = (params.username as string)?.replace("@", "");
  const { getInfluencerByUsername, trackClick } = useInfluencer();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const toast = useToast();

  const [influencer, setInfluencer] = useState<ReturnType<typeof getInfluencerByUsername>>(null);
  const [curatedProducts, setCuratedProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "featured">("featured");

  // Get influencer data
  useEffect(() => {
    if (username) {
      const inf = getInfluencerByUsername(username);
      setInfluencer(inf);

      if (inf) {
        // Track click
        trackClick(inf.id, undefined, "storefront");

        // Get curated products
        const curated = inf.curatedProducts
          .map(id => products.find(p => p.id === id))
          .filter(Boolean) as Product[];
        setCuratedProducts(curated);

        // Get featured products
        const featured = inf.featuredProducts
          .map(id => products.find(p => p.id === id))
          .filter(Boolean) as Product[];
        setFeaturedProducts(featured);
      }
    }
  }, [username, getInfluencerByUsername, products, trackClick]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${influencer?.displayName}'s CIPHER Picks`,
          text: `Check out ${influencer?.displayName}'s curated collection on CIPHER`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      size: product.sizes?.[0] || "M",
      category: product.category,
    });
    toast.success(`${product.name} added to cart`);
  };

  if (!influencer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading creator profile...</p>
      </div>
    );
  }

  if (!influencer.isActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-medium mb-2">Creator Unavailable</h1>
        <p className="text-gray-500 text-center">This creator storefront is currently not available.</p>
        <Link href="/shop" className="mt-6 px-6 py-3 bg-black text-white text-sm hover:bg-gray-800 transition">
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Live Stream Modal */}
      <AnimatePresence>
        {showLiveStream && influencer.isLive && influencer.liveStreamUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                  <Broadcast className="w-5 h-5 text-white" weight="fill" />
                </div>
                <div>
                  <p className="text-white font-medium">{influencer.displayName} is LIVE</p>
                  <p className="text-white/60 text-sm">Shop while you watch!</p>
                </div>
              </div>
              <button
                onClick={() => setShowLiveStream(false)}
                className="p-2 text-white/60 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Video Stream */}
              <div className="flex-1 relative">
                <iframe
                  src={influencer.liveStreamUrl}
                  className="w-full h-full min-h-[300px]"
                  allowFullScreen
                />
              </div>
              
              {/* Products Sidebar */}
              <div className="w-full lg:w-96 bg-white/5 p-4 overflow-y-auto max-h-[40vh] lg:max-h-full">
                <h3 className="text-white font-medium mb-4">Shop This Stream</h3>
                <div className="space-y-3">
                  {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                    <div key={product.id} className="flex gap-3 bg-white/10 rounded-lg p-3">
                      <div className="w-16 h-20 relative rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <p className="text-white/60 text-sm">${product.price}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="mt-2 px-3 py-1 bg-white text-black text-xs rounded-full hover:bg-white/90 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  )) : curatedProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex gap-3 bg-white/10 rounded-lg p-3">
                      <div className="w-16 h-20 relative rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <p className="text-white/60 text-sm">${product.price}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="mt-2 px-3 py-1 bg-white text-black text-xs rounded-full hover:bg-white/90 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-gray-900 to-gray-800">
        {influencer.coverImage && (
          <Image
            src={influencer.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Live Badge */}
        {influencer.isLive && (
          <motion.button
            onClick={() => setShowLiveStream(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg"
          >
            <Broadcast className="w-4 h-4 animate-pulse" weight="fill" />
            <span className="text-sm font-medium">LIVE NOW</span>
          </motion.button>
        )}
      </div>

      {/* Profile Section */}
      <div className="relative px-6 md:px-12 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200">
              {influencer.avatar ? (
                <Image
                  src={influencer.avatar}
                  alt={influencer.displayName}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-3xl font-bold">
                  {influencer.displayName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Verified Badge */}
            {influencer.isVerified && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-5 h-5 text-white" weight="fill" />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{influencer.displayName}</h1>
                <span className={`px-3 py-1 text-white text-xs rounded-full ${TIER_BADGES[influencer.tier].color}`}>
                  {TIER_BADGES[influencer.tier].text}
                </span>
              </div>
              <p className="text-gray-500 mb-3">@{influencer.username}</p>
              <p className="text-gray-700 max-w-lg">{influencer.bio}</p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-4">
                {influencer.socialLinks.instagram && (
                  <a
                    href={influencer.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <InstagramLogo className="w-5 h-5" />
                  </a>
                )}
                {influencer.socialLinks.tiktok && (
                  <a
                    href={influencer.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <TiktokLogo className="w-5 h-5" />
                  </a>
                )}
                {influencer.socialLinks.youtube && (
                  <a
                    href={influencer.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <YoutubeLogo className="w-5 h-5" />
                  </a>
                )}
                {influencer.socialLinks.twitter && (
                  <a
                    href={influencer.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <TwitterLogo className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Share className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
              {influencer.isLive && (
                <button
                  onClick={() => setShowLiveStream(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm transition"
                >
                  <Play className="w-4 h-4" weight="fill" />
                  Watch Live
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div>
              <span className="font-bold text-lg">{curatedProducts.length}</span>
              <span className="text-gray-500 ml-1">Picks</span>
            </div>
            <div>
              <span className="font-bold text-lg">{influencer.followers?.toLocaleString() || 0}</span>
              <span className="text-gray-500 ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold text-lg">{influencer.totalSales}</span>
              <span className="text-gray-500 ml-1">Sales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab("featured")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "featured" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Featured Picks
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Products ({curatedProducts.length})
            </button>
          </div>

          {/* Featured Section */}
          {activeTab === "featured" && featuredProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-medium mb-6">{influencer.displayName}&apos;s Top Picks</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative"
                  >
                    <Link href={`/shop/${product.id}?ref=${influencer.username}`}>
                      <div className="relative aspect-[4/5] mb-3 overflow-hidden bg-gray-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-xs">
                          TOP PICK
                        </div>
                      </div>
                    </Link>
                    
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (isInWishlist(product.id)) {
                            removeFromWishlist(product.id);
                          } else {
                            addToWishlist(product);
                          }
                        }}
                        className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Heart 
                          className={`w-4 h-4 ${isInWishlist(product.id) ? "text-red-500" : "text-gray-600"}`}
                          weight={isInWishlist(product.id) ? "fill" : "regular"}
                        />
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    
                    <Link href={`/shop/${product.id}?ref=${influencer.username}`}>
                      <h3 className="text-sm font-medium group-hover:underline">{product.name}</h3>
                      <p className="text-sm text-gray-500">${product.price}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Products */}
          {(activeTab === "all" || featuredProducts.length === 0) && (
            <div>
              {curatedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">This creator hasn&apos;t added any products yet.</p>
                  <Link href="/shop" className="inline-flex items-center gap-2 mt-4 text-sm font-medium hover:underline">
                    Browse all products <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {curatedProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative"
                    >
                      <Link href={`/shop/${product.id}?ref=${influencer.username}`}>
                        <div className="relative aspect-[4/5] mb-3 overflow-hidden bg-gray-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>
                      
                      {/* Quick Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (isInWishlist(product.id)) {
                              removeFromWishlist(product.id);
                            } else {
                              addToWishlist(product);
                            }
                          }}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Heart 
                            className={`w-4 h-4 ${isInWishlist(product.id) ? "text-red-500" : "text-gray-600"}`}
                            weight={isInWishlist(product.id) ? "fill" : "regular"}
                          />
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <ShoppingBag className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      
                      <Link href={`/shop/${product.id}?ref=${influencer.username}`}>
                        <h3 className="text-sm font-medium group-hover:underline">{product.name}</h3>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-4">
            Want to become a <span className="font-bold">CIPHER Creator</span>?
          </h2>
          <p className="text-white/60 mb-6">
            Curate your favorite pieces, earn commission on every sale, and grow your brand with us.
          </p>
          <Link
            href="/creators/apply"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm font-medium hover:bg-gray-100 transition"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
