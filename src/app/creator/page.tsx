"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChartLineUp,
  CurrencyDollar,
  Eye,
  ShoppingBag,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Plus,
  X,
  ArrowUpRight,
  MagnifyingGlass,
  Trash,
  Star,
  Percent,
  Lightning,
  ArrowRight,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useInfluencer, Influencer, InfluencerSale } from "@/context/InfluencerContext";
import { useProducts, Product } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";

const TIER_INFO = {
  bronze: { 
    name: "Bronze", 
    color: "bg-amber-700", 
    commission: "10%",
    nextTier: "silver",
    salesNeeded: 50,
    benefits: ["Custom storefront", "Commission tracking", "Basic analytics"]
  },
  silver: { 
    name: "Silver", 
    color: "bg-gray-400", 
    commission: "12%",
    nextTier: "gold",
    salesNeeded: 200,
    benefits: ["Priority support", "Featured placement", "Advanced analytics"]
  },
  gold: { 
    name: "Gold", 
    color: "bg-yellow-500", 
    commission: "15%",
    nextTier: "platinum",
    salesNeeded: 500,
    benefits: ["Exclusive drops access", "Custom promo codes", "Live streaming"]
  },
  platinum: { 
    name: "Platinum", 
    color: "bg-gradient-to-r from-purple-500 to-pink-500", 
    commission: "18%",
    nextTier: null,
    salesNeeded: null,
    benefits: ["Highest commission", "Brand partnerships", "VIP events access"]
  },
};

type Tab = "overview" | "products" | "earnings" | "links";

export default function CreatorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    influencers,
    sales,
    getInfluencerStats,
    updateCuratedProducts,
    updateFeaturedProducts,
  } = useInfluencer();
  const { products } = useProducts();
  const toast = useToast();

  const [currentInfluencer, setCurrentInfluencer] = useState<Influencer | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    conversionRate: 0,
    recentSales: [] as InfluencerSale[],
  });
  const [mySales, setMySales] = useState<InfluencerSale[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [pickerMode, setPickerMode] = useState<"curated" | "featured">("curated");
  const [copied, setCopied] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Get current influencer
  useEffect(() => {
    if (user && influencers.length > 0) {
      const inf = influencers.find((i) => i.userId === user.uid);
      setCurrentInfluencer(inf || null);
    }
  }, [user, influencers]);

  // Get stats and sales
  useEffect(() => {
    if (currentInfluencer) {
      const influencerStats = getInfluencerStats(currentInfluencer.id);
      setStats(influencerStats);

      const influencerSales = sales.filter((s) => s.influencerId === currentInfluencer.id);
      setMySales(influencerSales);
    }
  }, [currentInfluencer, sales, getInfluencerStats]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/creator");
    }
  }, [authLoading, user, router]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddProduct = async (productId: string) => {
    if (!currentInfluencer) return;

    if (pickerMode === "curated") {
      if (currentInfluencer.curatedProducts.includes(productId)) {
        toast.error("Product already in your picks");
        return;
      }
      await updateCuratedProducts([...currentInfluencer.curatedProducts, productId]);
      toast.success("Product added to your picks");
    } else {
      if (currentInfluencer.featuredProducts.includes(productId)) {
        toast.error("Product already featured");
        return;
      }
      if (currentInfluencer.featuredProducts.length >= 4) {
        toast.error("Maximum 4 featured products allowed");
        return;
      }
      await updateFeaturedProducts([...currentInfluencer.featuredProducts, productId]);
      toast.success("Product added to featured");
    }
  };

  const handleRemoveProduct = async (productId: string, type: "curated" | "featured") => {
    if (!currentInfluencer) return;

    if (type === "curated") {
      await updateCuratedProducts(
        currentInfluencer.curatedProducts.filter((id) => id !== productId)
      );
      toast.success("Product removed from picks");
    } else {
      await updateFeaturedProducts(
        currentInfluencer.featuredProducts.filter((id) => id !== productId)
      );
      toast.success("Product removed from featured");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (authLoading || (!currentInfluencer && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!currentInfluencer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-medium mb-4">Become a CIPHER Creator</h1>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Curate your favorite pieces, earn commission on every sale, and grow your personal brand with us.
        </p>
        <Link
          href="/creators/apply"
          className="px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition"
        >
          Apply Now
        </Link>
      </div>
    );
  }

  const tierInfo = TIER_INFO[currentInfluencer.tier];
  const progressToNextTier = tierInfo.nextTier
    ? (currentInfluencer.totalSales / tierInfo.salesNeeded!) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product Picker Modal */}
      <AnimatePresence>
        {showProductPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProductPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-medium">
                  Add {pickerMode === "curated" ? "Products" : "Featured Products"}
                </h2>
                <button onClick={() => setShowProductPicker(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-96 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative cursor-pointer"
                    onClick={() => handleAddProduct(product.id)}
                  >
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                {currentInfluencer.avatar ? (
                  <Image
                    src={currentInfluencer.avatar}
                    alt={currentInfluencer.displayName}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold">
                    {currentInfluencer.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-medium">{currentInfluencer.displayName}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`px-2 py-0.5 text-white text-xs rounded-full ${tierInfo.color}`}>
                    {tierInfo.name}
                  </span>
                  <span>{tierInfo.commission} Commission</span>
                </div>
              </div>
            </div>

            <Link
              href={`/shop/creator/${currentInfluencer.username}`}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
            >
              View Storefront
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: ChartLineUp },
              { id: "products", label: "Products", icon: ShoppingBag },
              { id: "earnings", label: "Earnings", icon: CurrencyDollar },
              { id: "links", label: "Links & Tracking", icon: LinkIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Clicks</span>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +12% from last month
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Sales</span>
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +8% from last month
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Earnings</span>
                  <CurrencyDollar className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold">${currentInfluencer.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${currentInfluencer.pendingEarnings.toFixed(2)} pending
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Conversion Rate</span>
                  <Percent className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalSales > 0 ? `${stats.totalSales} total sales` : "No sales yet"}
                </p>
              </div>
            </div>

            {/* Tier Progress */}
            {tierInfo.nextTier && (
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Tier Progress</h3>
                    <p className="text-sm text-gray-500">
                      {tierInfo.salesNeeded! - currentInfluencer.totalSales} more sales to{" "}
                      {TIER_INFO[tierInfo.nextTier as keyof typeof TIER_INFO].name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-white text-xs rounded-full ${tierInfo.color}`}>
                      {tierInfo.name}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                    className={`h-full ${tierInfo.color}`}
                  />
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>{currentInfluencer.totalSales} sales</span>
                  <span>{tierInfo.salesNeeded} sales</span>
                </div>
              </div>
            )}

            {/* Recent Sales */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Recent Sales</h3>
                <button
                  onClick={() => setActiveTab("earnings")}
                  className="text-sm text-gray-500 hover:text-black transition"
                >
                  View All
                </button>
              </div>
              <div className="divide-y">
                {mySales.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No sales yet. Share your storefront to start earning!
                  </div>
                ) : (
                  mySales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #{sale.orderId.slice(-6)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+${sale.commission.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">${sale.orderTotal.toFixed(2)} order</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* Featured Products */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Featured Products</h3>
                  <p className="text-sm text-gray-500">Highlighted on your storefront (max 4)</p>
                </div>
                <button
                  onClick={() => {
                    setPickerMode("featured");
                    setShowProductPicker(true);
                  }}
                  disabled={currentInfluencer.featuredProducts.length >= 4}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Featured
                </button>
              </div>
              <div className="p-4">
                {currentInfluencer.featuredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Add up to 4 featured products to highlight on your storefront</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentInfluencer.featuredProducts.map((productId) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="group relative">
                          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => handleRemoveProduct(productId, "featured")}
                              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* All Curated Products */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Your Picks ({currentInfluencer.curatedProducts.length})</h3>
                  <p className="text-sm text-gray-500">All products in your storefront</p>
                </div>
                <button
                  onClick={() => {
                    setPickerMode("curated");
                    setShowProductPicker(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Products
                </button>
              </div>
              <div className="p-4">
                {currentInfluencer.curatedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Add products to your storefront to start earning commissions</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentInfluencer.curatedProducts.map((productId) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="group relative">
                          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => handleRemoveProduct(productId, "curated")}
                              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="space-y-8">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border">
                <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold">${currentInfluencer.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <p className="text-sm text-gray-500 mb-1">Pending Payout</p>
                <p className="text-3xl font-bold text-amber-600">
                  ${currentInfluencer.pendingEarnings.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <p className="text-sm text-gray-500 mb-1">Commission Rate</p>
                <p className="text-3xl font-bold">{(currentInfluencer.commissionRate * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* All Sales */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Sales History</h3>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-sm">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Products</th>
                      <th className="px-4 py-3 font-medium">Order Total</th>
                      <th className="px-4 py-3 font-medium">Commission</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mySales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No sales yet
                        </td>
                      </tr>
                    ) : (
                      mySales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm">#{sale.orderId.slice(-6)}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{sale.products.length} items</td>
                          <td className="px-4 py-3 font-medium">${sale.orderTotal.toFixed(2)}</td>
                          <td className="px-4 py-3 font-medium text-green-600">
                            +${sale.commission.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                sale.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="space-y-6">
            {/* Main Links */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-medium mb-4">Your Tracking Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Storefront URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/shop/creator/${currentInfluencer.username}`}
                      className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${typeof window !== "undefined" ? window.location.origin : ""}/shop/creator/${currentInfluencer.username}`,
                          "storefront"
                        )
                      }
                      className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      {copied === "storefront" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Referral Code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`?ref=${currentInfluencer.username}`}
                      className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`?ref=${currentInfluencer.username}`, "ref")}
                      className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      {copied === "ref" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add this to any product URL to track sales from your content
                  </p>
                </div>
              </div>
            </div>

            {/* Product-specific Links */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium">Product Links</h3>
                <p className="text-sm text-gray-500">Share these links in your content</p>
              </div>
              <div className="divide-y">
                {currentInfluencer.curatedProducts.slice(0, 10).map((productId) => {
                  const product = products.find((p) => p.id === productId);
                  if (!product) return null;
                  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${product.id}?ref=${currentInfluencer.username}`;
                  return (
                    <div key={productId} className="p-4 flex items-center gap-4">
                      <div className="w-12 h-16 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate">{link}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(link, productId)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                      >
                        {copied === productId ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Lightning className="w-5 h-5 text-purple-600" />
                Tips to Boost Your Sales
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                  Add your referral code to all social media links
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                  Create styling videos featuring your curated products
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                  Go live during peak shopping hours (evenings, weekends)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                  Share exclusive styling tips with your audience
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
