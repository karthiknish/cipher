"use client";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Trash,
  FloppyDisk,
  SpinnerGap,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

interface ProductHeaderProps {
  title: string;
  subtitle: string;
  productId?: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onDelete?: () => void;
  backUrl?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

export function ProductHeader({
  title,
  subtitle,
  productId,
  isSubmitting,
  canSubmit,
  onSubmit,
  onDelete,
  backUrl = "/admin?tab=products",
  submitLabel = "SAVE CHANGES",
  submittingLabel = "SAVING...",
}: ProductHeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={backUrl}
              className="p-2 hover:bg-gray-100 transition rounded-lg"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-xl font-light tracking-tight">{title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {productId && (
              <Link
                href={`/shop/${productId}`}
                target="_blank"
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded flex items-center gap-2"
              >
                <Eye className="size-4" /> View Live
              </Link>
            )}
            {onDelete && (
              <button aria-label="trash" type="button" onClick={onDelete}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded flex items-center gap-2">
                <Trash className="size-4" /> Delete
              </button>
            )}
            <button type="button" onClick={onSubmit}
              disabled={isSubmitting || !canSubmit}
              className="px-6 py-2 bg-gray-950 text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded">
              {isSubmitting ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" /> {submittingLabel}
                </>
              ) : (
                <>
                  <FloppyDisk className="size-4" /> {submitLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DraftBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
  message?: string;
}

export function DraftBanner({
  onRestore,
  onDiscard,
  message = "You have unsaved changes from a previous session.",
}: DraftBannerProps) {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockCounterClockwise className="size-5 text-amber-600" />
            <p className="text-sm text-amber-800">{message}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onDiscard}
              className="px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 rounded transition">
              Discard
            </button>
            <button aria-label="clock counter clockwise" type="button" onClick={onRestore}
              className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition flex items-center gap-1.5">
              <ClockCounterClockwise className="size-3" />
              Restore Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
