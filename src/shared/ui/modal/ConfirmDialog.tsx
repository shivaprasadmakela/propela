import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** What is about to happen, and what it costs. Keep it concrete. */
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for anything that removes access or data. */
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-app replacement for `window.confirm`, so a destructive step reads in the
 * product's own voice and can explain its consequence rather than asking a bare
 * yes/no question in a browser chrome dialog.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  const danger = tone === "danger";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              danger ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground"
            }`}
          >
            <FontAwesomeIcon
              icon={danger ? faTriangleExclamation : faCircleInfo}
              className="text-base"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <div className="text-xs text-muted-foreground leading-relaxed">{message}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-5 py-2.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
