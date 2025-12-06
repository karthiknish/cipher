"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { useBundles, BundleWithProducts } from "@/context/BundleContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";
import Link from "next/link";
import { 
  Package, Tag, ShoppingBag, Check, CaretRight, 
  Sparkle, Gift, Percent, ArrowRight 
} from "@phosphor-icons/react";

const BUNDLE_CATEGORIES = [
  { id: "all", label: "All Bundles" },
  { id: "essentials", label: "Essentials" },
  { id: "street", label: "Street Style" },
  { id: "casual", label: "Casual" },
];

// Bundle Card Component
function BundleCard({ bundle }: { bundle: BundleWithProducts }) {
  const { addToCart } = useCart();
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBundle = () => {
    setIsAdding(true);
    
    // Add all products in bundle to cart
    bundle.products.forEach(product => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price * (1 - bundle.discountPercent / 100),
        image: product.image,
        category: product.category,
        quantity: 1,
        size: "M",
        bundleId: bundle.id,
        bundleName: bundle.name,
      });
    });

    toast.success(`${bundle.name} added to cart!`);
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white border border-gray-200 overflow-hidden hover:border-black transition-colors"
    >
      {/* Bundle Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <Image 
          src={bundle.image} 
          alt={bundle.name} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Discount Badge */}
        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 flex items-center gap-1.5">
          <Percent className="w-4 h-4" />
          <span className="text-sm font-medium">SAVE {bundle.discountPercent}%</span>
        </div>

        {/* Featured Badge */}
        {bundle.featured && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 flex items-center gap-1.5">
            <Sparkle className="w-4 h-4" />
            <span className="text-sm font-medium">FEATURED</span>
          </div>
        )}

        {/* Product Previews */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          {bundle.products.slice(0, 3).map((product, i) => (
            <div 
              key={product.id}
              className="w-12 h-16 bg-white shadow-lg relative overflow-hidden"
              style={{ zIndex: 3 - i }}
            >
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
          ))}
          {bundle.products.length > 3 && (
            <div className="w-12 h-16 bg-black text-white flex items-center justify-center text-xs font-medium shadow-lg">
              +{bundle.products.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Bundle Info */}
      <div className="p-6">
        <p className="text-xs text-gray-400 tracking-wider mb-2">{bundle.tagline.toUpperCase()}</p>
        <h3 className="text-lg font-medium mb-2">{bundle.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{bundle.description}</p>

        {/* Included Items */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">INCLUDES {bundle.products.length} ITEMS:</p>
          <div className="flex flex-wrap gap-1">
            {bundle.products.map(product => (
              <span key={product.id} className="text-xs bg-gray-100 px-2 py-1">
                {product.name}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-end gap-3 mb-6">
          <span className="text-2xl font-medium">${bundle.bundlePrice.toFixed(0)}</span>
          <span className="text-gray-400 line-through">${bundle.originalPrice.toFixed(0)}</span>
          <span className="text-green-600 text-sm font-medium">Save ${bundle.savings.toFixed(0)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAddBundle}
            disabled={isAdding}
            className={`flex-1 py-3 text-sm tracking-wider font-medium transition flex items-center justify-center gap-2 ${
              isAdding 
                ? "bg-green-600 text-white" 
                : "bg-black text-white hover:bg-gray-900"
            }`}
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4" /> ADDED
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> ADD BUNDLE
              </>
            )}
          </button>
          <Link 
            href={`/bundles/${bundle.id}`}
            className="px-4 py-3 border border-gray-200 hover:border-black transition flex items-center"
          >
            <CaretRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function BundlesPage() {
  const { getAllBundlesWithProducts, getFeaturedBundles } = useBundles();
  const [activeCategory, setActiveCategory] = useState("all");

  const allBundles = getAllBundlesWithProducts();
  const featuredBundles = getFeaturedBundles();
  
  const filteredBundles = activeCategory === "all" 
    ? allBundles 
    : allBundles.filter(b => b.category === activeCategory);

  // Calculate total savings across all bundles
  const totalPotentialSavings = allBundles.reduce((sum, b) => sum + b.savings, 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-6 h-6" />
              <span className="text-sm tracking-widest text-white/60">CURATED COLLECTIONS</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">
              OUTFIT BUNDLES
            </h1>
            <p className="text-white/60 mb-8">
              Complete looks at exclusive bundle prices. Save up to 20% when you shop our curated outfit sets.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>{allBundles.length} Bundles</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-400" />
                <span>Up to ${totalPotentialSavings.toFixed(0)} in Savings</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Bundle Banner */}
      {featuredBundles[0] && (
        <section className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <Image 
                  src={featuredBundles[0].image} 
                  alt={featuredBundles[0].name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1.5 flex items-center gap-1.5">
                  <Sparkle className="w-4 h-4" />
                  <span className="text-sm font-medium">EDITOR&apos;S PICK</span>
                </div>
              </div>
              <div className="py-8">
                <p className="text-xs tracking-widest text-gray-400 mb-3">FEATURED BUNDLE</p>
                <h2 className="text-3xl font-light tracking-tight mb-4">{featuredBundles[0].name}</h2>
                <p className="text-gray-500 mb-6">{featuredBundles[0].description}</p>
                
                <div className="flex items-center gap-4 mb-6">
                  {featuredBundles[0].products.map(product => (
                    <div key={product.id} className="flex items-center gap-2">
                      <div className="w-10 h-12 bg-gray-100 relative overflow-hidden">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{product.name}</p>
                        <p className="text-xs text-gray-400">${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 mb-8">
                  <span className="text-3xl font-medium">${featuredBundles[0].bundlePrice.toFixed(0)}</span>
                  <span className="text-xl text-gray-400 line-through">${featuredBundles[0].originalPrice.toFixed(0)}</span>
                  <span className="text-green-600 font-medium">
                    {featuredBundles[0].discountPercent}% OFF
                  </span>
                </div>

                <Link 
                  href={`/bundles/${featuredBundles[0].id}`}
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
                >
                  SHOP THIS BUNDLE <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {BUNDLE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 text-sm tracking-wider transition-all ${
                activeCategory === cat.id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Bundles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBundles.map(bundle => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </AnimatePresence>
        </div>

        {filteredBundles.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No bundles found in this category</p>
            <button 
              onClick={() => setActiveCategory("all")}
              className="text-sm tracking-wider underline underline-offset-4"
            >
              View all bundles
            </button>
          </div>
        )}
      </div>

      {/* Bundle Benefits */}
      <section className="bg-gray-50 py-16 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-light tracking-tight text-center mb-12">WHY SHOP BUNDLES?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <Percent className="w-8 h-8" />
              </div>
              <h3 className="font-medium mb-2">Save Up to 20%</h3>
              <p className="text-sm text-gray-500">Get exclusive discounts when you buy curated outfit sets</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <Sparkle className="w-8 h-8" />
              </div>
              <h3 className="font-medium mb-2">Expertly Curated</h3>
              <p className="text-sm text-gray-500">Each bundle is styled by our team to create cohesive looks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-medium mb-2">One-Click Shopping</h3>
              <p className="text-sm text-gray-500">Add complete outfits to your cart instantly</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
