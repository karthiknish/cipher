"use client";
import ImageUploader from "@/components/ImageUploader";

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
  return (
    <ImageUploader
      mode="gallery"
      images={images}
      onImagesChange={onChange}
      maxFiles={maxImages}
      folder={folder}
      label="Add gallery images"
      variant="light"
    />
  );
}
