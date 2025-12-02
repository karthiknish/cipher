"use client";
import Link from "next/link";
import { Info, FloppyDisk, SpinnerGap } from "@phosphor-icons/react";

interface NewProductFooterProps {
  isSubmitting: boolean;
  canSubmit: boolean;
  hasUnsavedChanges: boolean;
  onSubmit: () => void;
}

export function NewProductFooter({
  isSubmitting,
  canSubmit,
  hasUnsavedChanges,
  onSubmit,
}: NewProductFooterProps) {
  return (
    <div className="flex justify-between items-center mt-6 bg-white border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Info className="w-4 h-4" />
          <span>Fields marked with * are required</span>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span>Auto-saved draft</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/admin?tab=products"
          className="px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded"
        >
          Discard
        </Link>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="px-8 py-2 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded"
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
  );
}
