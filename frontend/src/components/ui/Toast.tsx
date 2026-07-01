"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error";

interface Props {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. */
  duration?: number;
  onClose: () => void;
}

const STYLES: Record<ToastVariant, { ring: string; icon: string }> = {
  success: { ring: "border-risk-green/50", icon: "✓" },
  error: { ring: "border-risk-red/50", icon: "!" },
};

// Lightweight, dependency-free toast. Fixed bottom-center, auto-dismisses,
// portals to <body> so it's never clipped by an overflow container.
export function Toast({
  open,
  message,
  variant = "success",
  duration = 4000,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!mounted || !open) return null;
  const style = STYLES[variant];

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-[2000] flex justify-center px-4"
    >
      <div
        className={`animate-fade-in-up flex items-center gap-3 rounded-lg border ${style.ring} bg-earth-raised px-4 py-3 text-sm text-text-primary shadow-lg`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            variant === "success"
              ? "bg-risk-green/20 text-risk-green"
              : "bg-risk-red/20 text-risk-red"
          }`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
        <span className="max-w-xs">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="ml-1 shrink-0 text-text-muted transition-colors hover:text-text-primary"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
}
