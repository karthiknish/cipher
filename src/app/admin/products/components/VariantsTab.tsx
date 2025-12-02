"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Trash, Palette, Ruler, Drop, PencilSimple, Check, X, Upload, ImageSquare, SpinnerGap } from "@phosphor-icons/react";
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

// Mini image uploader for color variants
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setIsLoading(true);
    try {
      const path = generateImagePath("products/colors", file.name);
      console.log("Uploading color image to:", path);
      const downloadURL = await uploadImage(file, path);
      console.log("Color image uploaded, URL:", downloadURL);
      onChange(downloadURL);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (value) {
    return (
      <div className="relative group w-20 h-20">
        <Image
          src={value}
          alt={`${colorName} variant`}
          fill
          className="object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/200x200/${colorHex.replace('#', '')}/ffffff?text=${colorName}`;
          }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="p-1.5 bg-white/90 text-gray-700 rounded hover:bg-white transition"
            title="Replace image"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onClick={() => inputRef.current?.click()}
      className={`w-20 h-20 rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition ${
        isDragging ? "border-black bg-gray-100" : "border-gray-300 hover:border-gray-400 bg-gray-50"
      }`}
    >
      {isLoading ? (
        <SpinnerGap className="w-5 h-5 text-gray-400 animate-spin" />
      ) : (
        <>
          <ImageSquare className="w-5 h-5 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400">Upload</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
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
                    className={`group relative w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      newColor.hex.toLowerCase() === preset.hex.toLowerCase()
                        ? "border-black ring-2 ring-black ring-offset-2"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {newColor.hex.toLowerCase() === preset.hex.toLowerCase() && (
                      <Check 
                        className={`absolute inset-0 m-auto w-4 h-4 ${
                          preset.hex === "#FFFFFF" || preset.hex === "#d4c5a9" || preset.hex === "#eab308"
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
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                              editingColor.hex.toLowerCase() === preset.hex.toLowerCase()
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
                            onChange={(url) => setEditingColor((prev) => prev ? { ...prev, image: url } : null)}
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
