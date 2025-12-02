"use client";
import Link from "next/link";
import { ArrowLeft, FloppyDisk, SpinnerGap } from "@phosphor-icons/react";

interface NewProductHeaderProps {
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export function NewProductHeader({
  isSubmitting,
  canSubmit,
  onSubmit,
}: NewProductHeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin?tab=products"
              className="p-2 hover:bg-gray-100 transition rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-light tracking-tight">NEW PRODUCT</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Add a new product to your catalog
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin?tab=products"
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded"
            >
              Cancel
            </Link>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !canSubmit}
              className="px-6 py-2 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded"
            >
              {isSubmitting ? (
                <>
                  <SpinnerGap className="w-4 h-4 animate-spin" /> CREATING...
                </>
              ) : (
                <>
                  <FloppyDisk className="w-4 h-4" /> CREATE PRODUCT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
