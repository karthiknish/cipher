"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product, ColorVariant } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";

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
  DraftBanner,
} from "../components";
import { NewProductHeader, NewProductFooter } from "./components";

export default function NewProductPage() {
  const router = useRouter();
  const { loading: authLoading, userRole } = useAuth();
  const { addProduct } = useProducts();
  const toast = useToast();

  // Loading and submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // UI states
  const [hasDraft, setHasDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userHasEdited, setUserHasEdited] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductTab>("basic");

  // Form states
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState<ColorVariant>(getInitialColor());
  const [formData, setFormData] = useState<ProductFormData>({
    ...getInitialFormData(),
    isNew: true, // New products default to "New Arrival"
  });

  const isAdmin = userRole?.isAdmin ?? false;
  const DRAFT_KEY = "new-product-draft";

  // Refs to track latest values for beforeunload handler
  const formDataRef = useRef(formData);
  const userHasEditedRef = useRef(userHasEdited);
  const autoSaveEnabledRef = useRef(autoSaveEnabled);

  // Keep refs in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    userHasEditedRef.current = userHasEdited;
  }, [userHasEdited]);

  useEffect(() => {
    autoSaveEnabledRef.current = autoSaveEnabled;
  }, [autoSaveEnabled]);

  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setHasDraft(true);
    }
  }, []);

  // Save draft immediately when page is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentFormData = formDataRef.current;
      const hasEdited = userHasEditedRef.current;
      const saveEnabled = autoSaveEnabledRef.current;

      if (!hasEdited || !saveEnabled) return;
      if (!currentFormData.name && !currentFormData.description && !currentFormData.image) return;

      try {
        const isBase64 = (str: string) => str?.startsWith("data:image");

        const draftData = {
          ...currentFormData,
          image: isBase64(currentFormData.image) ? "" : currentFormData.image,
          images: currentFormData.images?.filter((img) => !isBase64(img)) || [],
          colors: currentFormData.colors?.map((c) => ({
            ...c,
            image: isBase64(c.image || "") ? "" : c.image,
          })) || [],
        };

        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          formData: draftData,
          savedAt: new Date().toISOString(),
          hasUnsavedImages: isBase64(currentFormData.image) || currentFormData.images?.some(isBase64),
        }));
      } catch (error) {
        console.warn("Failed to save draft on unload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-save to localStorage when form changes
  useEffect(() => {
    if (!userHasEdited || !autoSaveEnabled) return;

    if (formData.name || formData.description || formData.image) {
      const timeoutId = setTimeout(() => {
        try {
          const isBase64 = (str: string) => str?.startsWith("data:image");

          const draftData = {
            ...formData,
            image: isBase64(formData.image) ? "" : formData.image,
            images: formData.images?.filter((img) => !isBase64(img)) || [],
            colors: formData.colors?.map((c) => ({
              ...c,
              image: isBase64(c.image || "") ? "" : c.image,
            })) || [],
          };

          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            formData: draftData,
            savedAt: new Date().toISOString(),
            hasUnsavedImages: isBase64(formData.image) || formData.images?.some(isBase64),
          }));
          setHasUnsavedChanges(true);
        } catch (error) {
          console.warn("Draft save failed, data too large:", error);
          setHasUnsavedChanges(true);
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, userHasEdited, autoSaveEnabled]);

  // Clear draft on successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setHasUnsavedChanges(false);
    setUserHasEdited(false);
    userHasEditedRef.current = false;
  }, []);

  // Restore draft from localStorage
  const restoreDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const { formData: savedData, hasUnsavedImages } = JSON.parse(savedDraft);
        setFormData(savedData);
        setHasDraft(false);
        setUserHasEdited(true);
        if (hasUnsavedImages) {
          toast.success("Draft restored (images were not saved - please re-upload)");
        } else {
          toast.success("Draft restored successfully");
        }
      } catch {
        toast.error("Failed to restore draft");
      }
    }
  }, [toast]);

  // Discard draft
  const discardDraft = useCallback(() => {
    clearDraft();
    toast.success("Draft discarded");
  }, [clearDraft, toast]);

  // Track when user makes changes
  useEffect(() => {
    if (!userHasEdited && (formData.name || formData.description || formData.image || formData.price > 0)) {
      setUserHasEdited(true);
    }
  }, [formData.name, formData.description, formData.image, formData.price, userHasEdited]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.image) {
      toast.error("Please fill in required fields (name and image)");
      return;
    }

    setAutoSaveEnabled(false);
    setIsSubmitting(true);

    const submitData: Partial<Omit<Product, "id">> = {
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

    const productId = await addProduct(submitData as Omit<Product, "id">);

    if (productId) {
      clearDraft();
      toast.success(`${formData.name} created successfully`);
      router.push("/admin?tab=products");
    } else {
      toast.error("Failed to create product");
    }

    setIsSubmitting(false);
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

      toast.success("AI-generated content applied!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Loading state
  if (authLoading) {
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
        <p className="text-gray-500 mb-6">You don&apos;t have permission to access this page.</p>
        <Link href="/" className="text-sm tracking-wider underline underline-offset-4">
          RETURN HOME
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <NewProductHeader
        isSubmitting={isSubmitting}
        canSubmit={!!formData.name && !!formData.image}
        onSubmit={handleSubmit}
      />

      {/* Draft Recovery Banner */}
      {hasDraft && (
        <DraftBanner onRestore={restoreDraft} onDiscard={discardDraft} />
      )}

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
                  setFormData={setFormData}
                  isGeneratingAI={isGeneratingAI}
                  onGenerateAI={generateWithAI}
                />
              )}

              {activeTab === "media" && (
                <MediaTab formData={formData} setFormData={setFormData} />
              )}

              {activeTab === "variants" && (
                <VariantsTab
                  formData={formData}
                  setFormData={setFormData}
                  newColor={newColor}
                  setNewColor={setNewColor}
                />
              )}

              {activeTab === "inventory" && (
                <InventoryTab formData={formData} setFormData={setFormData} />
              )}

              {activeTab === "details" && (
                <DetailsTab
                  formData={formData}
                  setFormData={setFormData}
                  newTag={newTag}
                  setNewTag={setNewTag}
                />
              )}
            </div>

            {/* Bottom Actions */}
            <NewProductFooter
              isSubmitting={isSubmitting}
              canSubmit={!!formData.name && !!formData.image}
              hasUnsavedChanges={hasUnsavedChanges}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
