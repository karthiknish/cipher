"use client";
import { useState, useRef, useCallback, useId } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, SpinnerGap } from "@phosphor-icons/react";
import { uploadImage, deleteImage, generateImagePath } from "@/lib/uploadImage";

export interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "video" | "auto" | "1/1" | "4/5" | string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  onMultipleChange?: (urls: string[]) => void;
  multipleValues?: string[];
  /** @deprecated use multipleValues */
  images?: string[];
  /** @deprecated use onMultipleChange */
  onImagesChange?: (urls: string[]) => void;
  mode?: "single" | "gallery" | "media";
  size?: "sm" | "md" | "lg";
}

const EMPTY_MULTIPLE_VALUES: string[] = [];

export default function ImageUploader({
  value = "",
  onChange = () => {},
  onRemove,
  folder = "uploads",
  label = "Upload Image",
  aspectRatio = "auto",
  maxSizeMB = 5,
  className = "",
  disabled = false,
  multiple = false,
  onMultipleChange,
  multipleValues: multipleValuesProp = EMPTY_MULTIPLE_VALUES,
  images,
  onImagesChange,
  mode,
}: ImageUploaderProps) {
  const multipleValues = multipleValuesProp.length > 0 ? multipleValuesProp : (images ?? []);
  const handleMultipleChange = onMultipleChange ?? onImagesChange ?? (() => {});
  const isMultiple = multiple || mode === "gallery" || mode === "media";
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select an image file";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const validationError = validateFile(file);
      if (validationError) throw new Error(validationError);

      const path = generateImagePath(folder, file.name);
      return uploadImage(file, path);
    },
    [folder, maxSizeMB]
  );

  const handleFileSelect = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const url = await uploadFile(file);
      onChange?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    setError(null);
    setUploading(true);

    const urls: string[] = [...multipleValues];

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const validationError = validateFile(file);
          if (validationError) {
            setError(validationError);
            return null;
          }
          return uploadFile(file);
        })
      );
      for (const url of uploaded) {
        if (url) urls.push(url);
      }
      handleMultipleChange(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [multipleValues, handleMultipleChange, uploadFile, validateFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || uploading) return;

      const files = e.dataTransfer.files;
      if (files?.length) {
        if (multiple) {
          handleMultipleFiles(files);
        } else {
          handleFileSelect(files[0]);
        }
      }
    },
    [disabled, uploading, multiple, uploadFile, handleMultipleFiles]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleRemove = async () => {
    if (value) {
      try {
        await deleteImage(value);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }
      onChange?.("");
    onRemove?.();
  };

  const handleRemoveMultiple = async (index: number) => {
    const url = multipleValues[index];
    if (url) {
      try {
        await deleteImage(url);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }
    const newUrls = multipleValues.filter((_, i) => i !== index);
    handleMultipleChange(newUrls);
  };

  const aspectClasses: Record<string, string> = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto min-h-[200px]",
    "1/1": "aspect-square",
    "4/5": "aspect-[4/5]",
  };
  const aspectClass = aspectClasses[aspectRatio ?? "auto"] ?? "aspect-auto min-h-[200px]";

  if (isMultiple) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {multipleValues.map((url, index) => (
            <div key={url} className="relative aspect-square group">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover rounded-lg"
               sizes="(max-width: 768px) 100vw, 50vw" />
              <button
                type="button"
                onClick={() => handleRemoveMultiple(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          <label
            htmlFor={inputId}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragActive
                ? "border-black bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <SpinnerGap className="size-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="size-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add Image</span>
              </>
            )}
          </label>
        </div>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label={label || "Upload image"}
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) handleMultipleFiles(files);
          }}
          className="hidden"
          disabled={disabled}
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        <div className={`relative ${aspectClass} max-w-md`}>
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover rounded-lg"
           sizes="(max-width: 768px) 100vw, 50vw" />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`${aspectClasses[aspectRatio]} max-w-md border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive
              ? "border-black bg-gray-50"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <SpinnerGap className="size-10 text-gray-400 animate-spin" />
          ) : (
            <>
              <ImageIcon className="size-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Drag & drop or click to upload
              </span>
              <span className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to {maxSizeMB}MB
              </span>
            </>
          )}
        </label>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={label || "Upload image"}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
        disabled={disabled}
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
