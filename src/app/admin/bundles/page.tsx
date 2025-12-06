"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBundles, Bundle, BundleFormData } from "@/context/BundleContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  SpinnerGap, 
  ShieldWarning, 
  MagnifyingGlass, 
  Plus,
  Package,
  Pencil,
  Trash,
  Star,
  Tag,
  X,
  Check,
} from "@phosphor-icons/react";
import AdminLayout from "../components/AdminLayout";

const initialFormData: BundleFormData = {
  name: "",
  description: "",
  tagline: "",
  image: "",
  productIds: [],
  discountPercent: 10,
  featured: false,
  category: "essentials",
};

function BundlesPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { bundles, getAllBundlesWithProducts, addBundle, updateBundle, deleteBundle } = useBundles();
  const { products } = useProducts();
  const toast = useToast();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Bundle["category"] | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [formData, setFormData] = useState<BundleFormData>(initialFormData);

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const bundlesWithProducts = getAllBundlesWithProducts();

  const filteredBundles = bundlesWithProducts.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || b.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        name: bundle.name,
        description: bundle.description,
        tagline: bundle.tagline,
        image: bundle.image,
        productIds: bundle.productIds,
        discountPercent: bundle.discountPercent,
        featured: bundle.featured,
        category: bundle.category,
      });
    } else {
      setEditingBundle(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBundle(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productIds.length < 2) {
      toast.error("A bundle must contain at least 2 products");
      return;
    }
    
    if (editingBundle) {
      const updated = updateBundle(editingBundle.id, formData);
      if (updated) {
        toast.success("Bundle updated successfully");
      } else {
        toast.error("Failed to update bundle");
      }
    } else {
      addBundle(formData);
      toast.success("Bundle created successfully");
    }
    handleCloseModal();
  };

  const handleDelete = (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;
    const deleted = deleteBundle(bundleId);
    if (deleted) {
      toast.success("Bundle deleted successfully");
    } else {
      toast.error("Failed to delete bundle");
    }
  };

  const toggleProductInBundle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const calculateBundlePrice = () => {
    const selectedProducts = products.filter(p => formData.productIds.includes(p.id));
    const originalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
    const discountedPrice = originalPrice * (1 - formData.discountPercent / 100);
    return { originalPrice, discountedPrice, savings: originalPrice - discountedPrice };
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  const { originalPrice, discountedPrice, savings } = calculateBundlePrice();

  return (
    <AdminLayout 
      title="Bundles" 
      activeTab="bundles"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" /> CREATE BUNDLE
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bundles..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Bundle["category"] | "all")}
          className="px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
        >
          <option value="all">All Categories</option>
          <option value="essentials">Essentials</option>
          <option value="street">Street</option>
          <option value="casual">Casual</option>
          <option value="seasonal">Seasonal</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{bundles.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Bundles</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{bundles.filter(b => b.featured).length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Featured</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">
            {bundles.length > 0 
              ? Math.round(bundles.reduce((sum, b) => sum + b.discountPercent, 0) / bundles.length) 
              : 0}%
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Discount</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">
            {bundles.length > 0 
              ? Math.round(bundles.reduce((sum, b) => sum + b.productIds.length, 0) / bundles.length) 
              : 0}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Products</p>
        </div>
      </div>

      {/* Bundles Grid */}
      {filteredBundles.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bundles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBundles.map((bundle) => (
            <div 
              key={bundle.id}
              className="bg-white border border-gray-200 hover:border-black transition overflow-hidden group"
            >
              {/* Bundle Image */}
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={bundle.image}
                  alt={bundle.name}
                  fill
                  className="object-cover"
                />
                {bundle.featured && (
                  <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" weight="fill" />
                    FEATURED
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white text-black px-2 py-1 text-xs font-bold">
                  -{bundle.discountPercent}%
                </div>
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleOpenModal(bundle)}
                    className="p-3 bg-white text-black hover:bg-gray-100 transition"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(bundle.id)}
                    className="p-3 bg-white text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bundle Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold">{bundle.name}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 uppercase">
                    {bundle.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{bundle.tagline}</p>
                
                {/* Products Preview */}
                <div className="flex -space-x-2 mb-3">
                  {bundle.products.slice(0, 4).map((product, index) => (
                    <div 
                      key={product.id}
                      className="relative w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden"
                      style={{ zIndex: 4 - index }}
                    >
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {bundle.products.length > 4 && (
                    <div className="relative w-8 h-8 rounded-full bg-gray-800 text-white border-2 border-white flex items-center justify-center text-xs font-bold">
                      +{bundle.products.length - 4}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-lg font-bold">${bundle.bundlePrice.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ${bundle.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    Save ${bundle.savings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">
                {editingBundle ? "Edit Bundle" : "Create New Bundle"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Bundle Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g., The Essentials Kit"
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    required
                    placeholder="e.g., Start your collection right"
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Bundle["category"] }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                  >
                    <option value="essentials">Essentials</option>
                    <option value="street">Street</option>
                    <option value="casual">Casual</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Describe what makes this bundle special..."
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                      required
                      min={1}
                      max={50}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 focus:border-black outline-none transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                  className={`w-12 h-6 rounded-full transition relative ${
                    formData.featured ? "bg-black" : "bg-gray-200"
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.featured ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm">Featured Bundle</span>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Select Products ({formData.productIds.length} selected)
                </label>
                <div className="border border-gray-200 max-h-60 overflow-y-auto">
                  {products.map((product) => {
                    const isSelected = formData.productIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProductInBundle(product.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition hover:bg-gray-50 ${
                          isSelected ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="relative w-10 h-10 bg-gray-100 flex-shrink-0">
                          {product.images?.[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                        </div>
                        <div className={`w-5 h-5 border flex items-center justify-center transition ${
                          isSelected ? "bg-black border-black" : "border-gray-300"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" weight="bold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Preview */}
              {formData.productIds.length >= 2 && (
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Original Price</span>
                    <span className="text-sm line-through">${originalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Discount ({formData.discountPercent}%)</span>
                    <span className="text-sm text-red-500">-${savings.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold">Bundle Price</span>
                    <span className="text-xl font-bold">${discountedPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-sm tracking-wider hover:bg-gray-50 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-black text-white text-sm tracking-wider hover:bg-gray-900 transition"
                >
                  {editingBundle ? "UPDATE BUNDLE" : "CREATE BUNDLE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function BundlesPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function BundlesPage() {
  return (
    <Suspense fallback={<BundlesPageLoading />}>
      <BundlesPageContent />
    </Suspense>
  );
}
