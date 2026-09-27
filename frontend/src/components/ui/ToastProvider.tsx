"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  /** Show a transient toast. Returns the toast id. */
  showToast: (
    message: string,
    opts?: { variant?: ToastVariant; duration?: number },
  ) => number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// Ink, not status colours: colour on this site means depth or risk tier
// (tokens.css), and a toast is neither. The icon carries the difference.
const STYLES: Record<ToastVariant, { ring: string; badge: string; icon: string }> = {
  success: { ring: "border-rule-strong", badge: "bg-ink text-on-ink", icon: "✓" },
  error: { ring: "border-ink", badge: "bg-ink text-on-ink", icon: "!" },
  info: { ring: "border-rule-strong", badge: "bg-raised text-ink", icon: "i" },
};

// App-wide toast host. Renders a portal viewport (fixed bottom-center) with a
// stack of auto-dismissing toasts. Expose showToast() via useToast().
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(1);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>((message, opts) => {
    const id = nextId.current++;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        variant: opts?.variant ?? "success",
        duration: opts?.duration ?? 4000,
      },
    ]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          /*
            No live region here. Each ToastCard is already role="status", which
            carries an implicit aria-live="polite"; nesting a second live region
            around them made every toast announce twice. A landmark for a
            transient notification stack is not useful to navigate to either.
          */
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[2000] flex flex-col items-center gap-2 px-4">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const style = STYLES[toast.variant];
  return (
    <div
      role="status"
      className={`animate-fade-in-up pointer-events-auto flex items-center gap-3 rounded-lg border ${style.ring} bg-raised px-4 py-3 text-fluid-00 text-ink shadow-lg`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-fluid-000 font-bold ${style.badge}`}
        aria-hidden="true"
      >
        {style.icon}
      </span>
      <span className="max-w-xs">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="ml-1 inline-flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded text-ink-3 transition-colors hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
