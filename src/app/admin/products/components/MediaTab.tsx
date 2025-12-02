"use client";
import { ImageSquare } from "@phosphor-icons/react";
import { ProductFormProps } from "./types";
import ImageUploader from "./ImageUploader";
import GalleryUploader from "./GalleryUploader";

interface MediaTabProps extends ProductFormProps {}

export function MediaTab({ formData, setFormData }: MediaTabProps) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <ImageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Media</h2>
          <p className="text-sm text-gray-500">Product images and gallery</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Main Image */}
        <div>
          <h3 className="text-sm font-medium mb-4">Main Product Image *</h3>
          <div className="max-w-xs">
            <ImageUploader
              value={formData.image}
              onChange={(url: string) =>
                setFormData((prev) => ({ ...prev, image: url }))
              }
              label="Upload main image"
              aspectRatio="4/5"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Recommended: 600x800px, JPG or PNG format
          </p>
        </div>

        {/* Gallery Images */}
        <div>
          <h3 className="text-sm font-medium mb-4">
            Gallery Images
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({formData.images?.length || 0} images)
            </span>
          </h3>
          <GalleryUploader
            images={formData.images || []}
            onChange={(images: string[]) => setFormData((prev) => ({ ...prev, images }))}
            maxImages={10}
          />
        </div>
      </div>
    </div>
  );
}
