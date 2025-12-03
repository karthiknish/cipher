"use client";

import ImageUploader, { UploadedMedia } from "@/components/ImageUploader";
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
  const handleMediaChange = (media: UploadedMedia[]) => {
    // Convert to ReviewMedia format
    const reviewMedia: ReviewMedia[] = media.map(m => ({
      type: m.type,
      url: m.url,
      thumbnail: m.thumbnail,
    }));
    onMediaChange(reviewMedia);
  };

  return (
    <ImageUploader
      mode="media"
      media={[]}
      onMediaChange={handleMediaChange}
      maxFiles={maxFiles}
      maxFileSizeMB={maxFileSizeMB}
      acceptVideo={true}
      variant="dark"
      folder="reviews"
      label="Add photos or videos"
    />
  );
}
