"use client";
import { useState, useCallback, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product, ColorVariant, SizeStock } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash,
  FloppyDisk,
  Package,
  CurrencyDollar,
  Tag,
  SpinnerGap,
  ShieldWarning,
  CaretDown,
  CheckCircle,
  Star,
  ImageSquare,
  Palette,
  Ruler,
  Barcode,
  Scales,
  TextT,
  ListBullets,
  X,
  Info,
  Sparkle,
  Drop,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  Warning,
} from "@phosphor-icons/react";

const CATEGORIES = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, updateProduct, deleteProduct } = useProducts();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "variants" | "inventory" | "details">("basic");
  const [newTag, setNewTag] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newColor, setNewColor] = useState<ColorVariant>({ name: "", hex: "#000000", image: "", inStock: true });

  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    comparePrice: 0,
    category: "Tees",
    description: "",
    shortDescription: "",
    image: "",
    images: [],
    sizes: ["S", "M", "L", "XL"],
    sizeStock: [
      { size: "S", stock: 10 },
      { size: "M", stock: 10 },
      { size: "L", stock: 10 },
      { size: "XL", stock: 10 },
    ],
    colors: [],
    inStock: true,
    sku: "",
    weight: 0,
    material: "",
    careInstructions: "",
    tags: [],
    featured: false,
    isNew: false,
  });

  const isAdmin = userRole?.isAdmin ?? false;

  // Load existing product data
  useEffect(() => {
    if (products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setFormData({
          name: product.name,
          price: product.price,
          comparePrice: product.comparePrice || 0,
          category: product.category,
          description: product.description,
          shortDescription: product.shortDescription || "",
          image: product.image,
          images: product.images || [],
          sizes: product.sizes || ["S", "M", "L", "XL"],
          sizeStock: product.sizeStock || product.sizes?.map(s => ({ size: s, stock: 10 })) || [],
          colors: product.colors || [],
          inStock: product.inStock,
          sku: product.sku || "",
          weight: product.weight || 0,
          material: product.material || "",
          careInstructions: product.careInstructions || "",
          tags: product.tags || [],
          featured: product.featured || false,
          isNew: product.isNew || false,
        });
      }
      setIsLoading(false);
    }
  }, [products, productId]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.image) {
      toast.error("Please fill in required fields (name and image)");
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      ...formData,
      comparePrice: formData.comparePrice || undefined,
      shortDescription: formData.shortDescription || undefined,
      images: formData.images?.length ? formData.images : undefined,
      sizeStock: formData.sizeStock?.length ? formData.sizeStock : undefined,
      colors: formData.colors?.length ? formData.colors : undefined,
      sku: formData.sku || undefined,
      weight: formData.weight || undefined,
      material: formData.material || undefined,
      careInstructions: formData.careInstructions || undefined,
      tags: formData.tags?.length ? formData.tags : undefined,
    };

    const success = await updateProduct(productId, submitData);
    
    if (success) {
      toast.success(`${formData.name} updated successfully`);
      router.push("/admin?tab=products");
    } else {
      toast.error("Failed to update product");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteProduct(productId);
    
    if (success) {
      toast.success(`${formData.name} deleted successfully`);
      router.push("/admin?tab=products");
    } else {
      toast.error("Failed to delete product");
    }
    
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  // Helper functions
  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) || [] }));
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), newImageUrl.trim()] }));
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) || [] }));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const images = [...(formData.images || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    setFormData(prev => ({ ...prev, images }));
  };

  const addColor = () => {
    if (newColor.name.trim() && newColor.hex) {
      setFormData(prev => ({ ...prev, colors: [...(prev.colors || []), { ...newColor }] }));
      setNewColor({ name: "", hex: "#000000", image: "", inStock: true });
    }
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({ ...prev, colors: prev.colors?.filter((_, i) => i !== index) || [] }));
  };

  const updateColor = (index: number, updates: Partial<ColorVariant>) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors?.map((c, i) => i === index ? { ...c, ...updates } : c) || [],
    }));
  };

  const toggleSize = (size: string) => {
    const sizes = formData.sizes || [];
    if (sizes.includes(size)) {
      setFormData(prev => ({
        ...prev,
        sizes: prev.sizes?.filter(s => s !== size) || [],
        sizeStock: prev.sizeStock?.filter(ss => ss.size !== size) || [],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sizes: [...(prev.sizes || []), size],
        sizeStock: [...(prev.sizeStock || []), { size, stock: 10 }],
      }));
    }
  };

  const updateSizeStock = (size: string, stock: number) => {
    setFormData(prev => ({
      ...prev,
      sizeStock: prev.sizeStock?.map(ss => ss.size === size ? { ...ss, stock } : ss) || [],
    }));
  };

  if (authLoading || isLoading) {
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
        <p className="text-gray-500 mb-6">You don&apos;t have permission to access this page.</p>
        <Link href="/" className="text-sm tracking-wider underline underline-offset-4">
          RETURN HOME
        </Link>
      </div>
    );
  }

  if (!products.find(p => p.id === productId)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-amber-100 flex items-center justify-center mb-6">
          <Warning className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">PRODUCT NOT FOUND</h1>
        <p className="text-gray-500 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/admin?tab=products" className="text-sm tracking-wider underline underline-offset-4">
          BACK TO PRODUCTS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Warning className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-medium">Delete Product</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{formData.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white text-sm tracking-wider font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2 rounded"
              >
                {isDeleting ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" /> DELETING...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4" /> DELETE
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin?tab=products"
                className="p-2 hover:bg-gray-100 transition rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-light tracking-tight">EDIT PRODUCT</h1>
                <p className="text-xs text-gray-500 mt-0.5">ID: {productId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/shop/${productId}`}
                target="_blank"
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Live
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded flex items-center gap-2"
              >
                <Trash className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name || !formData.image}
                className="px-6 py-2 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" /> SAVING...
                  </>
                ) : (
                  <>
                    <FloppyDisk className="w-4 h-4" /> SAVE CHANGES
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white border rounded-lg overflow-hidden sticky top-24">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-xs tracking-wider text-gray-500 font-medium">SECTIONS</h3>
              </div>
              <nav className="p-2">
                {[
                  { id: "basic", label: "Basic Info", icon: TextT },
                  { id: "media", label: "Media", icon: ImageSquare },
                  { id: "variants", label: "Colors & Sizes", icon: Palette },
                  { id: "inventory", label: "Inventory", icon: Package },
                  { id: "details", label: "Details & SEO", icon: ListBullets },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition ${
                      activeTab === tab.id
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Quick Preview */}
              {formData.image && (
                <div className="p-4 border-t">
                  <p className="text-xs tracking-wider text-gray-500 mb-3">PREVIEW</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="relative aspect-[4/5] mb-3 bg-gray-200 rounded overflow-hidden">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
                        }}
                      />
                      {formData.isNew && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded">NEW</span>
                      )}
                      {formData.featured && (
                        <Star className="absolute top-2 right-2 w-4 h-4 text-amber-400" weight="fill" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{formData.name || "Product Name"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-sm">${formData.price || 0}</span>
                      {formData.comparePrice && formData.comparePrice > formData.price && (
                        <span className="text-xs text-gray-400 line-through">${formData.comparePrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white border rounded-lg">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <TextT className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">Basic Information</h2>
                      <p className="text-sm text-gray-500">Core product details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs tracking-wider text-gray-500 mb-2">PRODUCT NAME *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition text-lg"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-wider text-gray-500 mb-2">SHORT DESCRIPTION</label>
                      <input
                        type="text"
                        value={formData.shortDescription || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                        placeholder="Brief one-line description for listings"
                        maxLength={150}
                      />
                      <p className="text-xs text-gray-400 mt-1">{(formData.shortDescription || "").length}/150 characters</p>
                    </div>

                    <div>
                      <label className="block text-xs tracking-wider text-gray-500 mb-2">FULL DESCRIPTION *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition resize-none"
                        placeholder="Detailed product description..."
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">PRICE ($) *</label>
                        <div className="relative">
                          <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={formData.price || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">COMPARE PRICE</label>
                        <div className="relative">
                          <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={formData.comparePrice || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: Number(e.target.value) }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                            placeholder="Original price"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Shows as strikethrough</p>
                      </div>
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">CATEGORY *</label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition bg-white appearance-none"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Status Flags */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xs tracking-wider text-gray-500 font-medium mb-4">STATUS & VISIBILITY</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`w-5 h-5 ${formData.inStock ? "text-green-500" : "text-gray-300"}`} weight={formData.inStock ? "fill" : "regular"} />
                            <span className="text-sm">In Stock</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.inStock}
                            onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                            className="w-5 h-5 accent-black"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
                          <div className="flex items-center gap-3">
                            <Star className={`w-5 h-5 ${formData.featured ? "text-amber-500" : "text-gray-300"}`} weight={formData.featured ? "fill" : "regular"} />
                            <span className="text-sm">Featured</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.featured || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                            className="w-5 h-5 accent-black"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition">
                          <div className="flex items-center gap-3">
                            <Sparkle className={`w-5 h-5 ${formData.isNew ? "text-blue-500" : "text-gray-300"}`} weight={formData.isNew ? "fill" : "regular"} />
                            <span className="text-sm">New Arrival</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.isNew || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                            className="w-5 h-5 accent-black"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <ImageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">Media</h2>
                      <p className="text-sm text-gray-500">Product images and gallery</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Main Image */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">Main Product Image *</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <input
                            type="url"
                            value={formData.image}
                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                            placeholder="https://..."
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Recommended: 600x800px, JPG or PNG format
                          </p>
                        </div>
                        {formData.image && (
                          <div className="relative aspect-[4/5] bg-gray-100 max-w-[200px] rounded-lg overflow-hidden">
                            <Image
                              src={formData.image}
                              alt="Main image"
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        Gallery Images
                        <span className="text-xs text-gray-400 font-normal ml-2">({formData.images?.length || 0} images)</span>
                      </h3>

                      <div className="flex gap-3 mb-4">
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                          placeholder="Add image URL..."
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                        />
                        <button
                          type="button"
                          onClick={addImage}
                          disabled={!newImageUrl.trim()}
                          className="px-6 py-3 bg-black text-white text-sm tracking-wider rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {formData.images && formData.images.length > 0 ? (
                        <div className="grid grid-cols-5 gap-4">
                          {formData.images.map((img, index) => (
                            <div key={index} className="group relative">
                              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                  src={img}
                                  alt={`Gallery ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400/1a1a1a/ffffff?text=Error";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, "up")}
                                    disabled={index === 0}
                                    className="p-1.5 bg-white rounded hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveImage(index, "down")}
                                    disabled={index === formData.images!.length - 1}
                                    className="p-1.5 bg-white rounded hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    <Trash className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 text-center">#{index + 1}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-400">
                          <ImageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No gallery images added</p>
                          <p className="text-xs mt-1">Add multiple angles and detail shots</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === "variants" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">Colors & Sizes</h2>
                      <p className="text-sm text-gray-500">Product variants and options</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Sizes Section */}
                    <div>
                      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Available Sizes
                      </h3>

                      <div className="space-y-3">
                        {["XS", "S", "M", "L", "XL", "XXL", "One Size"].map((size) => {
                          const isActive = formData.sizes?.includes(size);
                          const sizeStock = formData.sizeStock?.find(s => s.size === size);

                          return (
                            <div
                              key={size}
                              className={`flex items-center justify-between p-4 border rounded-lg transition ${
                                isActive ? "border-black bg-gray-50" : "border-gray-200"
                              }`}
                            >
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => toggleSize(size)}
                                  className="w-4 h-4 accent-black"
                                />
                                <span className={`text-sm ${isActive ? "font-medium" : "text-gray-500"}`}>{size}</span>
                              </label>

                              {isActive && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Stock:</span>
                                  <input
                                    type="number"
                                    value={sizeStock?.stock || 0}
                                    onChange={(e) => updateSizeStock(size, Number(e.target.value))}
                                    className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Colors Section */}
                    <div>
                      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Variants
                        <span className="text-xs text-gray-400 font-normal">({formData.colors?.length || 0} colors)</span>
                      </h3>

                      {/* Add New Color */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                        <p className="text-xs text-gray-500 tracking-wider">ADD NEW COLOR</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newColor.name}
                            onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            placeholder="Color name (e.g., Navy)"
                          />
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={newColor.hex}
                              onChange={(e) => setNewColor(prev => ({ ...prev, hex: e.target.value }))}
                              className="w-12 h-full border border-gray-200 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={newColor.hex}
                              onChange={(e) => setNewColor(prev => ({ ...prev, hex: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <input
                          type="url"
                          value={newColor.image}
                          onChange={(e) => setNewColor(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Image URL for this color variant"
                        />
                        <div className="flex justify-between items-center">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newColor.inStock}
                              onChange={(e) => setNewColor(prev => ({ ...prev, inStock: e.target.checked }))}
                              className="w-4 h-4 accent-black"
                            />
                            In Stock
                          </label>
                          <button
                            type="button"
                            onClick={addColor}
                            disabled={!newColor.name.trim()}
                            className="px-4 py-2 bg-black text-white text-xs tracking-wider rounded-lg hover:bg-gray-900 disabled:opacity-50"
                          >
                            ADD COLOR
                          </button>
                        </div>
                      </div>

                      {/* Color List */}
                      {formData.colors && formData.colors.length > 0 ? (
                        <div className="space-y-2">
                          {formData.colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                              <div
                                className="w-8 h-8 rounded-lg border border-gray-200"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{color.name}</p>
                                <p className="text-xs text-gray-400 font-mono">{color.hex}</p>
                              </div>
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={color.inStock}
                                  onChange={(e) => updateColor(index, { inStock: e.target.checked })}
                                  className="w-3 h-3 accent-black"
                                />
                                In Stock
                              </label>
                              <button
                                type="button"
                                onClick={() => removeColor(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 transition rounded"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
                          <Drop className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No colors added</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === "inventory" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">Inventory</h2>
                      <p className="text-sm text-gray-500">Stock and shipping details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">SKU (Stock Keeping Unit)</label>
                        <div className="relative">
                          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.sku || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition font-mono"
                            placeholder="CIP-HOO-001"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Unique identifier for inventory tracking</p>
                      </div>

                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">WEIGHT (grams)</label>
                        <div className="relative">
                          <Scales className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={formData.weight || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                            placeholder="500"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Used for shipping calculations</p>
                      </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock Summary
                      </h3>

                      {formData.sizeStock && formData.sizeStock.length > 0 ? (
                        <>
                          <div className="space-y-2 mb-4">
                            {formData.sizeStock.map((ss) => (
                              <div key={ss.size} className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-sm">{ss.size}</span>
                                <span className={`font-mono text-sm ${ss.stock < 5 ? "text-red-500" : ss.stock < 10 ? "text-amber-500" : "text-green-600"}`}>
                                  {ss.stock} units
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t-2 border-black">
                            <span className="font-medium">Total Stock</span>
                            <span className="font-mono font-bold">
                              {formData.sizeStock.reduce((sum, ss) => sum + ss.stock, 0)} units
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">No sizes configured. Go to Colors & Sizes tab.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Details & SEO Tab */}
              {activeTab === "details" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <ListBullets className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">Details & SEO</h2>
                      <p className="text-sm text-gray-500">Additional product information</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">MATERIAL</label>
                        <input
                          type="text"
                          value={formData.material || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                          placeholder="e.g., 100% Organic Cotton"
                        />
                      </div>

                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">CARE INSTRUCTIONS</label>
                        <textarea
                          value={formData.careInstructions || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, careInstructions: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition resize-none"
                          placeholder="Machine wash cold, tumble dry low..."
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Tags */}
                      <div>
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">
                          TAGS
                          <span className="text-gray-400 font-normal ml-2">({formData.tags?.length || 0} tags)</span>
                        </label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                            placeholder="Add a tag..."
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            disabled={!newTag.trim()}
                            className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {formData.tags && formData.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                              >
                                <Tag className="w-3 h-3 text-gray-400" />
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Tags help with search and filtering</p>
                        )}
                      </div>

                      {/* Quick Tags */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">SUGGESTED TAGS</p>
                        <div className="flex flex-wrap gap-2">
                          {["bestseller", "new-arrival", "limited-edition", "sustainable", "premium", "essential", "oversized", "slim-fit", "unisex"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (!formData.tags?.includes(tag)) {
                                  setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
                                }
                              }}
                              disabled={formData.tags?.includes(tag)}
                              className="px-3 py-1 border border-gray-200 rounded-full text-xs hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-6 bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Info className="w-4 h-4" />
                <span>Last modified: Now | ID: {productId}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" /> Delete Product
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name || !formData.image}
                  className="px-8 py-2 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded"
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" /> SAVING...
                    </>
                  ) : (
                    <>
                      <FloppyDisk className="w-4 h-4" /> SAVE CHANGES
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
