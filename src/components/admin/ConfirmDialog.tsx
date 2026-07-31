"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          exit={{ backgroundColor: "rgba(0,0,0,0)" }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby={description ? "confirm-desc" : undefined}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-5 sm:p-6">
              <div className="shrink-0 rounded-full bg-red-100 p-2.5">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2
                  id="confirm-title"
                  className="text-lg font-semibold text-zinc-900"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id="confirm-desc"
                    className="mt-1.5 text-sm text-zinc-600 leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3 bg-zinc-50 border-t border-zinc-100">
              <button
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition"
                autoFocus
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-red-700 transition"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
