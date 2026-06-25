import Link from "@/components/Link";
import { Trash, FloppyDisk, SpinnerGap, Info } from "@phosphor-icons/react";

interface ProductFooterProps {
  productId?: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  hasUnsavedChanges: boolean;
  onSubmit: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
}

export function ProductFooter({
  productId,
  isSubmitting,
  canSubmit,
  hasUnsavedChanges,
  onSubmit,
  onDelete,
  submitLabel = "SAVE CHANGES",
  submittingLabel = "SAVING...",
}: ProductFooterProps) {
  return (
    <div className="flex justify-between items-center mt-6 bg-white border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Info className="size-4" />
          <span>{productId ? `ID: ${productId}` : "Fields marked with * are required"}</span>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <div className="size-2 bg-amber-500 rounded-full animate-pulse" />
            <span>Auto-saved draft</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onDelete ? (
          <button aria-label="trash" type="button" onClick={onDelete}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded flex items-center gap-2">
            <Trash className="size-4" /> Delete Product
          </button>
        ) : (
          <Link
            href="/admin?tab=products"
            className="px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded"
          >
            Discard
          </Link>
        )}
        <button type="button" onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="px-8 py-2 bg-gray-950 text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2 rounded">
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
  );
}
