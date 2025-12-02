"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageSquare, SpinnerGap } from "@phosphor-icons/react";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: string;
  folder?: string; // Folder in Firebase Storage
}

export default function ImageUploader({ 
  value, 
  onChange, 
  label = "Upload Image",
  className = "",
  aspectRatio = "4/5",
  folder = "products"
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress("Uploading...");

    try {
      // Generate a unique path for the image
      const path = generateImagePath(folder, file.name);
      
      // Upload to Firebase Storage
      const downloadURL = await uploadImage(file, path);
      
      // Set the download URL
      onChange(downloadURL);
      setUploadProgress(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
      setUploadProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, folder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  return (
    <div className={className}>
      {value ? (
        <div className="relative group">
          <div 
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ aspectRatio }}
          >
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-black transition text-center"
          >
            Replace image
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed transition
            ${isDragging 
              ? "border-black bg-gray-100" 
              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
            }
          `}
          style={{ aspectRatio }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isLoading ? (
              <>
                <SpinnerGap className="w-10 h-10 text-gray-400 animate-spin mb-2" />
                <p className="text-sm text-gray-500">{uploadProgress || "Processing..."}</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  {isDragging ? (
                    <ImageSquare className="w-7 h-7 text-gray-500" />
                  ) : (
                    <Upload className="w-7 h-7 text-gray-500" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isDragging ? "Drop image here" : label}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WebP up to 5MB
                </p>
              </>
            )}
            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
