"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { Trash, Palette, Ruler, Drop, PencilSimple, Check, X, Upload, ImageSquare, SpinnerGap, Camera, CheckCircle, Link as LinkIcon } from "@phosphor-icons/react";
import { ColorVariant } from "@/context/ProductContext";
import { ProductFormProps, ALL_SIZES } from "./types";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";

// Preset color palette for quick selection
const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Red", hex: "#dc2626" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Orange", hex: "#f97316" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Brown", hex: "#78350f" },
  { name: "Beige", hex: "#d4c5a9" },
  { name: "Olive", hex: "#556b2f" },
  { name: "Burgundy", hex: "#800020" },
];

interface VariantsTabProps extends ProductFormProps {
  newColor: ColorVariant;
  setNewColor: React.Dispatch<React.SetStateAction<ColorVariant>>;
}

// Image Upload Modal Component
function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  colorName,
  colorHex,
  currentImage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => void;
  colorName: string;
  colorHex: string;
  currentImage?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || "");
  const [uploadedUrl, setUploadedUrl] = useState(currentImage || "");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync when a different color is edited
  useEffect(() => {
    setPreviewUrl(currentImage || "");
    setUploadedUrl(currentImage || "");
    setUploadError(null);
  }, [currentImage]);

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 150);
    return interval;
  };

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB");
      return;
    }

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setIsLoading(true);
    const progressInterval = simulateProgress();

    try {
      const path = generateImagePath("products/colors", file.name);
      const downloadURL = await uploadImage(file, path);
      clearInterval(progressInterval);
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      setPreviewUrl(downloadURL); // ensure preview reflects uploaded asset, not the local blob
      setUploadedUrl(downloadURL);
      // Don't auto-close - let user confirm with "Use This Image" button
      // This ensures state updates propagate properly before modal unmounts
    } catch (err: unknown) {
      console.error("Upload error:", err);
      clearInterval(progressInterval);
      setPreviewUrl("");
      setUploadedUrl("");
      // Check for permission errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("unauthorized") || errorMessage.includes("permission") || errorMessage.includes("403")) {
        setUploadError("Permission denied. Make sure you're logged in as an admin.");
      } else {
        setUploadError("Upload failed. Please try again or use a URL instead.");
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, [onUpload, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreviewUrl(urlInput.trim());
      setUploadedUrl(urlInput.trim());
      onUpload(urlInput.trim());
      onClose();
    }
  };

  const handleClear = () => {
    setPreviewUrl("");
    setUploadedUrl("");
    setUrlInput("");
    onUpload("");
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg border-2 border-gray-200"
              style={{ backgroundColor: colorHex }}
            />
            <div>
              <h3 className="font-bold text-sm">Upload Image for {colorName || "Color"}</h3>
              <p className="text-xs text-gray-500">Add a product image for this color variant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error message */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {uploadError}
            </div>
          )}

          {/* Hidden file input - placed at content level */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // Reset input so same file can be selected again
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Current/Preview Image */}
          {previewUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square max-w-[200px] mx-auto"
            >
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover rounded-xl"
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
                  <SpinnerGap className="w-8 h-8 text-white animate-spin mb-2" />
                  <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-xs mt-2">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              {/* Success badge */}
              {!isLoading && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" weight="bold" />
                  Ready
                </motion.div>
              )}

              {/* Action buttons */}
              {!isLoading && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow transition"
                    title="Change image"
                  >
                    <Camera className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg shadow transition"
                    title="Remove image"
                  >
                    <Trash className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onClick={handleBrowseClick}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition relative ${isDragging ? 'border-black bg-gray-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${isDragging ? 'scale-110 -translate-y-1' : ''
                    }`}
                  style={{ backgroundColor: colorHex + "20" }}
                >
                  <Camera className="w-8 h-8" style={{ color: colorHex === "#FFFFFF" ? "#000" : colorHex }} />
                </div>

                <p className="text-base font-medium mb-1">
                  {isDragging ? "Drop your image here" : "Drag & drop your image"}
                </p>
                <p className="text-sm text-gray-500 mb-3">or click to browse</p>

                <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ImageSquare className="w-4 h-4" />
                    JPG, PNG, WEBP
                  </span>
                  <span>•</span>
                  <span>Max 5MB</span>
                </div>
              </div>

              {/* URL Input Toggle */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowUrlInput(!showUrlInput); }}
                  className="text-sm text-gray-500 hover:text-black transition flex items-center gap-2 mx-auto"
                >
                  <LinkIcon className="w-4 h-4" />
                  {showUrlInput ? "Hide URL input" : "Paste an image URL instead"}
                </button>
              </div>

              {showUrlInput && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 border border-gray-200 focus:border-black outline-none text-sm rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="px-4 py-3 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition"
          >
            Cancel
          </button>
          {previewUrl && !isLoading && (
            <button
              type="button"
              onClick={() => {
                if (uploadedUrl) {
                  onUpload(uploadedUrl);
                  onClose();
                }
              }}
              disabled={!uploadedUrl}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
            >
              Use This Image
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Mini image uploader trigger for color variants
function ColorImageUploader({
  value,
  onChange,
  colorName,
  colorHex
}: {
  value: string;
  onChange: (url: string) => void;
  colorName: string;
  colorHex: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {value ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-black transition"
        >
          <Image
            src={value}
            alt={`${colorName} variant`}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/${colorHex.replace('#', '')}/ffffff?text=${colorName}`;
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <PencilSimple className="w-5 h-5 text-white" />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center transition cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400">Add Image</span>
        </button>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <ImageUploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpload={onChange}
            colorName={colorName}
            colorHex={colorHex}
            currentImage={value}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function VariantsTab({
  formData,
  setFormData,
  newColor,
  setNewColor,
}: VariantsTabProps) {
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [editingColor, setEditingColor] = useState<ColorVariant | null>(null);

  const toggleSize = (size: string) => {
    const sizes = formData.sizes || [];
    if (sizes.includes(size)) {
      setFormData((prev) => ({
        ...prev,
        sizes: prev.sizes?.filter((s) => s !== size) || [],
        sizeStock: prev.sizeStock?.filter((ss) => ss.size !== size) || [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sizes: [...(prev.sizes || []), size],
        sizeStock: [...(prev.sizeStock || []), { size, stock: 10 }],
      }));
    }
  };

  const updateSizeStock = (size: string, stock: number) => {
    setFormData((prev) => ({
      ...prev,
      sizeStock:
        prev.sizeStock?.map((ss) =>
          ss.size === size ? { ...ss, stock } : ss
        ) || [],
    }));
  };

  const addColor = () => {
    if (newColor.name.trim() && newColor.hex) {
      console.log("Adding color with image:", newColor);
      setFormData((prev) => ({
        ...prev,
        colors: [...(prev.colors || []), { ...newColor }],
      }));
      setNewColor({ name: "", hex: "#000000", image: "", inStock: true });
    }
  };

  const removeColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateColor = (index: number, updates: Partial<ColorVariant>) => {
    console.log("Updating color at index", index, "with:", updates);
    setFormData((prev) => ({
      ...prev,
      colors:
        prev.colors?.map((c, i) => (i === index ? { ...c, ...updates } : c)) ||
        [],
    }));
  };

  const startEditingColor = (index: number) => {
    const color = formData.colors?.[index];
    if (color) {
      setEditingColorIndex(index);
      setEditingColor({ ...color });
    }
  };

  const saveEditingColor = () => {
    if (editingColorIndex !== null && editingColor) {
      console.log("Saving edited color:", editingColor);
      updateColor(editingColorIndex, editingColor);
      setEditingColorIndex(null);
      setEditingColor(null);
    }
  };

  const cancelEditingColor = () => {
    setEditingColorIndex(null);
    setEditingColor(null);
  };

  const selectPresetColor = (preset: { name: string; hex: string }) => {
    setNewColor((prev) => ({
      ...prev,
      name: preset.name,
      hex: preset.hex,
    }));
  };

  return (
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
            {ALL_SIZES.map((size) => {
              const isActive = formData.sizes?.includes(size);
              const sizeStock = formData.sizeStock?.find((s) => s.size === size);

              return (
                <div
                  key={size}
                  className={`flex items-center justify-between p-4 border rounded-lg transition ${isActive ? "border-black bg-gray-50" : "border-gray-200"
                    }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleSize(size)}
                      className="w-4 h-4 accent-black"
                    />
                    <span
                      className={`text-sm ${isActive ? "font-medium" : "text-gray-500"}`}
                    >
                      {size}
                    </span>
                  </label>

                  {isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Stock:</span>
                      <input
                        type="number"
                        value={sizeStock?.stock || 0}
                        onChange={(e) =>
                          updateSizeStock(size, Number(e.target.value))
                        }
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
            <span className="text-xs text-gray-400 font-normal">
              ({formData.colors?.length || 0} colors)
            </span>
          </h3>

          {/* Add New Color */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
            <p className="text-xs text-gray-500 tracking-wider">ADD NEW COLOR</p>

            {/* Preset Colors */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => selectPresetColor(preset)}
                    className={`group relative w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${newColor.hex.toLowerCase() === preset.hex.toLowerCase()
                      ? "border-black ring-2 ring-black ring-offset-2"
                      : "border-gray-200 hover:border-gray-400"
                      }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {newColor.hex.toLowerCase() === preset.hex.toLowerCase() && (
                      <Check
                        className={`absolute inset-0 m-auto w-4 h-4 ${preset.hex === "#FFFFFF" || preset.hex === "#d4c5a9" || preset.hex === "#eab308"
                          ? "text-black"
                          : "text-white"
                          }`}
                        weight="bold"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Input Row with Image */}
            <div className="flex gap-4">
              {/* Image Uploader */}
              <div className="flex-shrink-0">
                <p className="text-xs text-gray-400 mb-2">Color Image</p>
                <ColorImageUploader
                  value={newColor.image}
                  onChange={(url) => setNewColor((prev) => ({ ...prev, image: url }))}
                  colorName={newColor.name || "Color"}
                  colorHex={newColor.hex}
                />
              </div>

              {/* Color Details */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                    placeholder="Color name (e.g., Navy)"
                  />
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={newColor.hex}
                        onChange={(e) =>
                          setNewColor((prev) => ({ ...prev, hex: e.target.value }))
                        }
                        className="w-12 h-full border-0 rounded-lg cursor-pointer appearance-none"
                        style={{
                          backgroundColor: newColor.hex,
                        }}
                      />
                      <div
                        className="absolute inset-0 rounded-lg border-2 border-gray-200 pointer-events-none"
                        style={{ backgroundColor: newColor.hex }}
                      />
                    </div>
                    <input
                      type="text"
                      value={newColor.hex}
                      onChange={(e) =>
                        setNewColor((prev) => ({ ...prev, hex: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-black outline-none"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newColor.inStock}
                      onChange={(e) =>
                        setNewColor((prev) => ({ ...prev, inStock: e.target.checked }))
                      }
                      className="w-4 h-4 accent-black"
                    />
                    In Stock
                  </label>
                  <button
                    type="button"
                    onClick={addColor}
                    disabled={!newColor.name.trim()}
                    className="px-4 py-2 bg-black text-white text-xs tracking-wider rounded-lg hover:bg-gray-900 disabled:opacity-50 transition"
                  >
                    ADD COLOR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Color List */}
          {formData.colors && formData.colors.length > 0 ? (
            <div className="space-y-2">
              {formData.colors.map((color, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                >
                  {editingColorIndex === index && editingColor ? (
                    // Editing Mode
                    <div className="p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 tracking-wider">EDIT COLOR</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEditingColor}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={saveEditingColor}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preset Colors for Editing */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setEditingColor((prev) => prev ? { ...prev, name: preset.name, hex: preset.hex } : null)}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${editingColor.hex.toLowerCase() === preset.hex.toLowerCase()
                              ? "border-black"
                              : "border-gray-200"
                              }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>

                      {/* Color details with image */}
                      <div className="flex gap-4">
                        {/* Image Uploader for Editing */}
                        <div className="flex-shrink-0">
                          <p className="text-xs text-gray-400 mb-1">Image</p>
                          <ColorImageUploader
                            value={editingColor.image}
                            onChange={(url) => {
                              // Update local editing state
                              setEditingColor((prev) => prev ? { ...prev, image: url } : null);
                              // Also update formData directly so image is saved immediately
                              if (editingColorIndex !== null) {
                                updateColor(editingColorIndex, { image: url });
                              }
                            }}
                            colorName={editingColor.name}
                            colorHex={editingColor.hex}
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editingColor.name}
                              onChange={(e) => setEditingColor((prev) => prev ? { ...prev, name: e.target.value } : null)}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                              placeholder="Color name"
                            />
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={editingColor.hex}
                                onChange={(e) => setEditingColor((prev) => prev ? { ...prev, hex: e.target.value } : null)}
                                className="w-10 h-full rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: editingColor.hex }}
                              />
                              <input
                                type="text"
                                value={editingColor.hex}
                                onChange={(e) => setEditingColor((prev) => prev ? { ...prev, hex: e.target.value } : null)}
                                className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-black outline-none"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editingColor.inStock}
                              onChange={(e) => setEditingColor((prev) => prev ? { ...prev, inStock: e.target.checked } : null)}
                              className="w-4 h-4 accent-black"
                            />
                            In Stock
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center gap-3 p-3">
                      {/* Color Image or Swatch */}
                      {color.image ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                          <Image
                            src={color.image}
                            alt={color.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x200/${color.hex.replace('#', '')}/ffffff?text=${color.name}`;
                            }}
                          />
                          <div
                            className="absolute bottom-0 right-0 w-4 h-4 rounded-tl border-t border-l border-white"
                            style={{ backgroundColor: color.hex }}
                            title={color.hex}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingColor(index)}
                          className="relative w-14 h-14 rounded-lg border-2 border-gray-200 group hover:border-black transition cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          title="Click to edit and add image"
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-md transition">
                            <ImageSquare className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{color.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{color.hex}</p>
                        {!color.image && (
                          <p className="text-[10px] text-amber-500">No image - click to add</p>
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={color.inStock}
                          onChange={(e) =>
                            updateColor(index, { inStock: e.target.checked })
                          }
                          className="w-3 h-3 accent-black"
                        />
                        In Stock
                      </label>
                      <button
                        type="button"
                        onClick={() => startEditingColor(index)}
                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 transition rounded"
                        title="Edit color"
                      >
                        <PencilSimple className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 transition rounded"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
  );
}
