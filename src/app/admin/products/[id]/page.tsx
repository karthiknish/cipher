"use client";
import { useState, useEffect, use, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts, ColorVariant } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SpinnerGap, ShieldWarning, Warning } from "@phosphor-icons/react";

import {
  ProductTab,
  ProductFormData,
  getInitialFormData,
  getInitialColor,
  BasicInfoTab,
  MediaTab,
  VariantsTab,
  InventoryTab,
  DetailsTab,
  ProductSidebar,
  ProductHeader,
  ProductFooter,
  DeleteConfirmModal,
} from "../components";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = use(params);
  const router = useRouter();
  const { loading: authLoading, userRole } = useAuth();
  const { products, updateProduct, deleteProduct } = useProducts();
  const toast = useToast();

  // Loading and submission states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // UI states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductTab>("basic");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Form states
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState<ColorVariant>(getInitialColor());
  const [formData, setFormData] = useState<ProductFormData>(getInitialFormData());

  const isAdmin = userRole?.isAdmin ?? false;

  // Load existing product data - only once when products are first available
  useEffect(() => {
    if (products.length > 0 && isLoading) {
      const product = products.find((p) => p.id === productId);
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
          sizeStock:
            product.sizeStock ||
            product.sizes?.map((s) => ({ size: s, stock: 10 })) ||
            [],
          colors: product.colors || [],
          inStock: product.inStock ?? true,
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
      // Mark initial load complete after a tick to allow formData to settle
      setTimeout(() => setInitialLoadComplete(true), 100);
    }
  }, [products, productId, isLoading]);
  
  // Wrapper for setFormData that marks unsaved changes
  const handleFormChange: React.Dispatch<React.SetStateAction<ProductFormData>> = useCallback((updater) => {
    if (initialLoadComplete) {
      setHasUnsavedChanges(true);
    }
    setFormData(updater);
  }, [initialLoadComplete]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.image) {
      toast.error("Please fill in required fields (name and image)");
      return;
    }

    setIsSubmitting(true);

    // Build submit data, only including defined values
    const submitData: Partial<ProductFormData> = {
      name: formData.name,
      price: formData.price,
      category: formData.category,
      description: formData.description,
      image: formData.image,
      sizes: formData.sizes,
      inStock: formData.inStock,
      featured: formData.featured || false,
      isNew: formData.isNew || false,
    };

    // Only add optional fields if they have values
    if (formData.comparePrice && formData.comparePrice > 0) {
      submitData.comparePrice = formData.comparePrice;
    }
    if (formData.shortDescription) {
      submitData.shortDescription = formData.shortDescription;
    }
    if (formData.images?.length) {
      submitData.images = formData.images;
    }
    if (formData.sizeStock?.length) {
      submitData.sizeStock = formData.sizeStock;
    }
    if (formData.colors?.length) {
      submitData.colors = formData.colors;
    }
    if (formData.sku) {
      submitData.sku = formData.sku;
    }
    if (formData.weight && formData.weight > 0) {
      submitData.weight = formData.weight;
    }
    if (formData.material) {
      submitData.material = formData.material;
    }
    if (formData.careInstructions) {
      submitData.careInstructions = formData.careInstructions;
    }
    if (formData.tags?.length) {
      submitData.tags = formData.tags;
    }

    const success = await updateProduct(productId, submitData);

    if (success) {
      setHasUnsavedChanges(false);
      toast.success(`${formData.name} updated successfully`);
      router.push("/admin?tab=products");
    } else {
      toast.error("Failed to update product");
    }

    setIsSubmitting(false);
  };

  // Handle product deletion
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

  // Generate content with AI
  const generateWithAI = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a product name first");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/generate-product-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          existingDescription: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        shortDescription: data.shortDescription || prev.shortDescription,
        description: data.description || prev.description,
        material: data.material || prev.material,
        careInstructions: data.careInstructions || prev.careInstructions,
        tags: data.tags?.length ? data.tags : prev.tags,
      }));
      setHasUnsavedChanges(true);

      toast.success("AI-generated content applied!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6">
          You don&apos;t have permission to access this page.
        </p>
        <Link href="/" className="text-sm tracking-wider underline underline-offset-4">
          RETURN HOME
        </Link>
      </div>
    );
  }

  // Product not found
  if (!products.find((p) => p.id === productId)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-amber-100 flex items-center justify-center mb-6">
          <Warning className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">
          PRODUCT NOT FOUND
        </h1>
        <p className="text-gray-500 mb-6">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/admin?tab=products"
          className="text-sm tracking-wider underline underline-offset-4"
        >
          BACK TO PRODUCTS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          productName={formData.name}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Header */}
      <ProductHeader
        title="EDIT PRODUCT"
        subtitle={`ID: ${productId}`}
        productId={productId}
        isSubmitting={isSubmitting}
        canSubmit={!!formData.name && !!formData.image}
        onSubmit={handleSubmit}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <ProductSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            formData={formData}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white border rounded-lg">
              {activeTab === "basic" && (
                <BasicInfoTab
                  formData={formData}
                  setFormData={handleFormChange}
                  isGeneratingAI={isGeneratingAI}
                  onGenerateAI={generateWithAI}
                />
              )}

              {activeTab === "media" && (
                <MediaTab formData={formData} setFormData={handleFormChange} />
              )}

              {activeTab === "variants" && (
                <VariantsTab
                  formData={formData}
                  setFormData={handleFormChange}
                  newColor={newColor}
                  setNewColor={setNewColor}
                />
              )}

              {activeTab === "inventory" && (
                <InventoryTab formData={formData} setFormData={handleFormChange} />
              )}

              {activeTab === "details" && (
                <DetailsTab
                  formData={formData}
                  setFormData={handleFormChange}
                  newTag={newTag}
                  setNewTag={setNewTag}
                />
              )}
            </div>

            {/* Bottom Actions */}
            <ProductFooter
              productId={productId}
              isSubmitting={isSubmitting}
              canSubmit={!!formData.name && !!formData.image}
              hasUnsavedChanges={hasUnsavedChanges}
              onSubmit={handleSubmit}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
