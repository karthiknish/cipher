"use client";

import { useState, useRef } from "react";
import { Upload, SpinnerGap } from "@phosphor-icons/react";
import { ReviewMedia } from "@/context/ReviewContext";
import { uploadImage, generateImagePath } from "@/lib/uploadImage";

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
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    const added: ReviewMedia[] = [];

    try {
      const fileList = Array.from(files).slice(0, maxFiles);
      const uploads = await Promise.all(
        fileList.map(async (file) => {
          if (!file.type.startsWith("image/")) return null;
          if (file.size > maxFileSizeMB * 1024 * 1024) {
            setError(`Each file must be under ${maxFileSizeMB}MB`);
            return null;
          }
          const path = generateImagePath("reviews", file.name);
          const url = await uploadImage(file, path);
          return { type: "image" as const, url };
        })
      );
      for (const item of uploads) {
        if (item) added.push(item);
      }
      if (added.length > 0) {
        onMediaChange(added);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label
        className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer has-[:disabled]:opacity-50"
      >
        <span className="block text-sm font-medium text-gray-700 mb-2">Add photos</span>
        {uploading ? (
          <SpinnerGap className="size-8 text-gray-400 animate-spin" />
        ) : (
          <>
            <Upload className="size-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload review photos</span>
          </>
        )}
        <input
          id="review-media-photos"
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          aria-label="Upload review photos"
          className="sr-only"
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) void handleFiles(files);
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
