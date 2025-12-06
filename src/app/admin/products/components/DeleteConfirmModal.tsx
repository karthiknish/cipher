"use client";
import { motion } from "@/lib/motion";
import { Trash, Warning, SpinnerGap } from "@phosphor-icons/react";

interface DeleteConfirmModalProps {
  productName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  productName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Warning className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-lg font-medium">Delete Product</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{productName}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white text-sm tracking-wider font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2 rounded"
          >
            {isDeleting ? (
              <>
                <SpinnerGap className="w-4 h-4 animate-spin" /> DELETING...
              </>
            ) : (
              <>
                <Trash className="w-4 h-4" /> DELETE
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
