"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { 
  Upload, 
  X, 
  ImageSquare, 
  SpinnerGap, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash,
  VideoCamera,
  Play
} from "@phosphor-icons/react";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Types
export type MediaType = "image" | "video";

export interface UploadedMedia {
  type: MediaType;
  url: string;
  thumbnail?: string;
}

export interface ImageUploaderProps {
  // Single image mode
  value?: string;
  onChange?: (url: string) => void;
  
  // Multi-image mode
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  
  // Multi-media mode (images + videos)
  media?: UploadedMedia[];
  onMediaChange?: (media: UploadedMedia[]) => void;
  
  // Common props
  mode?: "single" | "gallery" | "media";
  label?: string;
  className?: string;
  aspectRatio?: string;
  folder?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  acceptVideo?: boolean;
  
  // Theme
  variant?: "light" | "dark";
  
  // Size presets
  size?: "sm" | "md" | "lg";
  
  // Callbacks
  onError?: (error: string) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

const SIZE_PRESETS = {
  sm: { iconSize: 20, padding: "p-4" },
  md: { iconSize: 28, padding: "p-6" },
  lg: { iconSize: 40, padding: "p-8" },
};

export default function ImageUploader({
  // Single mode
  value = "",
  onChange,
  
  // Gallery mode
  images = [],
  onImagesChange,
  
  // Media mode
  media = [],
  onMediaChange,
  
  // Common
  mode = "single",
  label = "Upload Image",
  className = "",
  aspectRatio = "4/5",
  folder = "uploads",
  maxFiles = 10,
  maxFileSizeMB = 5,
  acceptVideo = false,
  variant = "light",
  size = "md",
  onError,
  onUploadStart,
  onUploadComplete,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = SIZE_PRESETS[size];
  const isDark = variant === "dark";

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = maxFileSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Max ${maxFileSizeMB}MB allowed.` };
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return { valid: false, error: "Please upload an image or video file" };
    }

    if (isVideo && !acceptVideo) {
      return { valid: false, error: "Video files are not allowed" };
    }

    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (isImage && !validImageTypes.includes(file.type)) {
      return { valid: false, error: "Supported: JPG, PNG, GIF, WebP" };
    }

    if (isVideo && !validVideoTypes.includes(file.type)) {
      return { valid: false, error: "Supported: MP4, WebM, MOV" };
    }

    return { valid: true };
  };

  // Upload a single file
  const uploadFile = async (file: File): Promise<{ url: string; type: MediaType } | null> => {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${folder}/${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const isVideo = file.type.startsWith("video/");
      return { url, type: isVideo ? "video" : "image" };
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // Handle single file (for single mode)
  const handleSingleFile = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      onError?.(validation.error || "Invalid file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress("Uploading...");
    onUploadStart?.();

    try {
      const path = generateImagePath(folder, file.name);
      const downloadURL = await uploadImage(file, path);
      onChange?.(downloadURL);
      setUploadProgress(null);
      onUploadComplete?.();
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = "Failed to upload. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
      setUploadProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, folder, onError, onUploadStart, onUploadComplete]);

  // Handle multiple files (for gallery/media mode)
  const handleMultipleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = mode === "media" ? media.length : images.length;

    if (currentCount + fileArray.length > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} files allowed`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate all files
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        onError?.(validation.error || "Invalid file");
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    onUploadStart?.();

    const uploadedMedia: UploadedMedia[] = [];
    const uploadedUrls: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(`Uploading ${i + 1}/${fileArray.length}...`);
      const result = await uploadFile(fileArray[i]);
      
      if (result) {
        uploadedUrls.push(result.url);
        uploadedMedia.push({
          type: result.type,
          url: result.url,
          thumbnail: result.type === "image" ? result.url : undefined,
        });
      }
    }

    if (mode === "media") {
      onMediaChange?.([...media, ...uploadedMedia]);
    } else {
      onImagesChange?.([...images, ...uploadedUrls]);
    }

    setIsLoading(false);
    setUploadProgress(null);
    onUploadComplete?.();
  }, [mode, media, images, maxFiles, onMediaChange, onImagesChange, folder, onError, onUploadStart, onUploadComplete]);

  // Event handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (mode === "single") {
      if (files[0]) handleSingleFile(files[0]);
    } else {
      handleMultipleFiles(files);
    }
  }, [mode, handleSingleFile, handleMultipleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (mode === "single") {
      if (files[0]) handleSingleFile(files[0]);
    } else {
      handleMultipleFiles(files);
    }
    
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  }, [mode, handleSingleFile, handleMultipleFiles]);

  const handleRemove = useCallback(() => {
    onChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const removeImage = useCallback((index: number) => {
    if (mode === "media") {
      onMediaChange?.(media.filter((_, i) => i !== index));
    } else {
      onImagesChange?.(images.filter((_, i) => i !== index));
    }
  }, [mode, media, images, onMediaChange, onImagesChange]);

  const moveImage = useCallback((index: number, direction: "up" | "down") => {
    const list = mode === "media" ? [...media] : [...images];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    
    if (mode === "media") {
      onMediaChange?.(list as UploadedMedia[]);
    } else {
      onImagesChange?.(list as string[]);
    }
  }, [mode, media, images, onMediaChange, onImagesChange]);

  // Styles
  const baseStyles = isDark
    ? {
        border: isDragging ? "border-sky-500 bg-sky-500/10" : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50",
        text: "text-zinc-400",
        textMuted: "text-zinc-500",
        accent: "text-sky-400",
        bg: "bg-zinc-800",
        overlay: "bg-zinc-900/80",
      }
    : {
        border: isDragging ? "border-black bg-gray-100" : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100",
        text: "text-gray-700",
        textMuted: "text-gray-500",
        accent: "text-gray-900",
        bg: "bg-gray-100",
        overlay: "bg-black/50",
      };

  const acceptTypes = acceptVideo ? "image/*,video/*" : "image/*";
  const currentCount = mode === "media" ? media.length : images.length;
  const remaining = maxFiles - currentCount;

  // Render single image mode
  if (mode === "single") {
    return (
      <div className={className}>
        {value ? (
          <div className="relative group">
            <div 
              className={`relative ${baseStyles.bg} rounded-lg overflow-hidden`}
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
              <div className={`absolute inset-0 ${baseStyles.overlay} opacity-0 group-hover:opacity-100 transition flex items-center justify-center`}>
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
              className={`mt-2 w-full py-2 text-xs ${baseStyles.textMuted} hover:${baseStyles.accent} transition text-center`}
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
            className={`relative cursor-pointer rounded-lg border-2 border-dashed transition ${baseStyles.border}`}
            style={{ aspectRatio }}
          >
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${sizeConfig.padding}`}>
              {isLoading ? (
                <>
                  <SpinnerGap className={`w-10 h-10 ${baseStyles.textMuted} animate-spin mb-2`} />
                  <p className={`text-sm ${baseStyles.textMuted}`}>{uploadProgress || "Processing..."}</p>
                </>
              ) : (
                <>
                  <div className={`w-14 h-14 rounded-full ${isDark ? "bg-zinc-700" : "bg-gray-200"} flex items-center justify-center mb-3`}>
                    {isDragging ? (
                      <ImageSquare className={`${baseStyles.textMuted}`} size={sizeConfig.iconSize} />
                    ) : (
                      <Upload className={baseStyles.textMuted} size={sizeConfig.iconSize} />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${baseStyles.text} mb-1`}>
                    {isDragging ? "Drop image here" : label}
                  </p>
                  <p className={`text-xs ${baseStyles.textMuted} text-center`}>
                    Drag & drop or click to browse
                  </p>
                  <p className={`text-xs ${baseStyles.textMuted} mt-1`}>
                    JPG, PNG, WebP up to {maxFileSizeMB}MB
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
          accept={acceptTypes}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Render gallery/media mode
  const items = mode === "media" ? media : images.map(url => ({ type: "image" as const, url }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {remaining > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed ${sizeConfig.padding} transition text-center ${baseStyles.border}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <SpinnerGap className={`w-5 h-5 ${baseStyles.textMuted} animate-spin`} />
              <span className={`text-sm ${baseStyles.textMuted}`}>{uploadProgress || "Uploading..."}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full ${isDark ? "bg-zinc-700" : "bg-gray-200"} flex items-center justify-center mb-3`}>
                {isDragging ? (
                  <ImageSquare className={baseStyles.textMuted} size={24} />
                ) : acceptVideo ? (
                  <VideoCamera className={baseStyles.textMuted} size={24} />
                ) : (
                  <Plus className={baseStyles.textMuted} size={24} />
                )}
              </div>
              <p className={`text-sm font-medium ${baseStyles.text} mb-1`}>
                {isDragging ? "Drop files here" : label}
              </p>
              <p className={`text-xs ${baseStyles.textMuted}`}>
                Drag & drop or click • {remaining} remaining
              </p>
              {acceptVideo && (
                <p className={`text-xs ${baseStyles.textMuted} mt-1`}>
                  Images & videos up to {maxFileSizeMB}MB
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`flex items-center gap-2 text-red-${isDark ? "400" : "500"} text-sm ${isDark ? "bg-red-500/10" : "bg-red-50"} px-4 py-2 rounded-lg`}>
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Media Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={`relative group aspect-square rounded-lg overflow-hidden ${baseStyles.bg}`}
            >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400/1a1a1a/ffffff?text=Error";
                  }}
                />
              ) : (
                <div className="relative w-full h-full">
                  <video src={item.url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-8 h-8 text-white" weight="fill" />
                  </div>
                </div>
              )}

              {/* Hover Overlay */}
              <div className={`absolute inset-0 ${baseStyles.overlay} opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2`}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveImage(index, "up"); }}
                  disabled={index === 0}
                  className={`p-1.5 ${isDark ? "bg-zinc-700 hover:bg-zinc-600" : "bg-white hover:bg-gray-100"} rounded disabled:opacity-50`}
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveImage(index, "down"); }}
                  disabled={index === items.length - 1}
                  className={`p-1.5 ${isDark ? "bg-zinc-700 hover:bg-zinc-600" : "bg-white hover:bg-gray-100"} rounded disabled:opacity-50`}
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>

              {/* Video Badge */}
              {item.type === "video" && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
                  VIDEO
                </span>
              )}

              {/* Index Badge */}
              <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium ${isDark ? "bg-zinc-900/60 text-zinc-300" : "bg-white/80 text-gray-600"} rounded`}>
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !isLoading && (
        <div className={`border-2 border-dashed ${isDark ? "border-zinc-700" : "border-gray-200"} rounded-lg p-12 text-center ${baseStyles.textMuted}`}>
          <ImageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No files uploaded</p>
          <p className="text-xs mt-1">Add images{acceptVideo ? " or videos" : ""}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

// Named exports for convenience
export { ImageUploader };
