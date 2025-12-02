"use client";

import { useState, useRef, useCallback } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ReviewMedia } from "@/context/ReviewContext";

interface ReviewMediaUploadProps {
  onMediaChange: (media: ReviewMedia[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
}

export default function ReviewMediaUpload({
  onMediaChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
}: ReviewMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = maxFileSizeMB * 1024 * 1024;
    
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Max ${maxFileSizeMB}MB allowed.` };
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: "Invalid file type. Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV" };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File): Promise<ReviewMedia | null> => {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `reviews/${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const isVideo = file.type.startsWith("video/");
      
      return {
        type: isVideo ? "video" : "image",
        url,
        thumbnail: isVideo ? undefined : url, // For images, use same URL as thumbnail
      };
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (media.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    const uploaded: ReviewMedia[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const result = await uploadFile(file);
      
      if (result) {
        uploaded.push(result);
      }
      
      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
    }

    if (uploaded.length > 0) {
      const newMedia = [...media, ...uploaded];
      setMedia(newMedia);
      onMediaChange(newMedia);
    }

    setUploading(false);
    setUploadProgress(0);
  }, [media, maxFiles, onMediaChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
    onMediaChange(newMedia);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${dragActive 
            ? "border-purple-500 bg-purple-500/10" 
            : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${dragActive ? "text-purple-400" : "text-zinc-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          
          <div>
            <span className="text-purple-400 font-medium">Click to upload</span>
            <span className="text-zinc-400"> or drag and drop</span>
          </div>
          
          <p className="text-xs text-zinc-500">
            PNG, JPG, GIF, WebP, MP4, WebM up to {maxFileSizeMB}MB (max {maxFiles} files)
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                <svg className="animate-spin text-purple-500" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                  {uploadProgress}%
                </span>
              </div>
              <p className="text-sm text-zinc-400">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {media.map((item, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800"
            >
              {item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(index);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Media type indicator */}
              {item.type === "video" && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
