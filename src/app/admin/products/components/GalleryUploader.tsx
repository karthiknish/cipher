"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageSquare, SpinnerGap, Plus, ArrowUp, ArrowDown, Trash } from "@phosphor-icons/react";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";

interface GalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export default function GalleryUploader({ 
  images, 
  onChange, 
  maxImages = 10,
  folder = "products/gallery"
}: GalleryUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) return;

    setIsLoading(true);
    const newImages: string[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      if (images.length + newImages.length >= maxImages) break;
      
      setUploadStatus(`Uploading ${i + 1}/${validFiles.length}...`);
      
      try {
        // Generate a unique path and upload to Firebase Storage
        const path = generateImagePath(folder, file.name);
        const downloadURL = await uploadImage(file, path);
        newImages.push(downloadURL);
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Continue with other images even if one fails
      }
    }

    onChange([...images, ...newImages]);
    setIsLoading(false);
    setUploadStatus(null);
  }, [images, maxImages, onChange, folder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  const moveImage = useCallback((index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer rounded-lg border-2 border-dashed p-8 transition text-center
            ${isDragging 
              ? "border-black bg-gray-100" 
              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <SpinnerGap className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">{uploadStatus || "Uploading..."}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                {isDragging ? (
                  <ImageSquare className="w-6 h-6 text-gray-500" />
                ) : (
                  <Plus className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragging ? "Drop images here" : "Add gallery images"}
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click • {maxImages - images.length} remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {images.map((img, index) => (
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
                    disabled={index === images.length - 1}
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
      )}

      {/* Empty State */}
      {images.length === 0 && !isLoading && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-400">
          <ImageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No gallery images added</p>
          <p className="text-xs mt-1">Add multiple angles and detail shots</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
