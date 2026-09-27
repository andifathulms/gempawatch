"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";

const PickerMap = dynamic(() => import("./PickerMap").then((m) => m.PickerMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sunken" />,
});

interface Props {
  /** Where the pin starts: the last checked point, or central Indonesia. */
  initial: [number, number];
  /** Zoom to open at — wider when nothing has been picked yet. */
  zoom: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

/**
 * The phone map picker: full screen, with a confirm bar.
 *
 * On a phone, picking inside the 340px hero meant fighting the page scroll
 * for every pan, and each tap ran a check immediately — so adjusting the pin
 * produced a stream of reports. Here the map owns the screen, taps and drags
 * only move the pin, and nothing is computed until "Cek titik ini".
 *
 * Portalled to <body> (the sticky header's backdrop-filter would otherwise
 * contain it), with body scroll locked, Escape to close and focus returned to
 * the button that opened it.
 */
export function MapPickerSheet({ initial, zoom, onConfirm, onClose }: Props) {
  const [pending, setPending] = useState<[number, number]>(initial);
  const [moved, setMoved] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      className="fixed inset-0 z-[1100] flex flex-col bg-paper"
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <h2 id="picker-title" className="text-fluid-1 font-extrabold tracking-tight">
            Pilih titik di peta
          </h2>
          <p className="text-fluid-000 text-ink-3">Ketuk peta atau seret pin, lalu tekan Cek.</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Tutup peta"
          className="min-h-tap-comfortable min-w-tap-comfortable rounded-lg text-fluid-3 leading-none text-ink-2 hover:bg-raised hover:text-ink"
        >
          ×
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <PickerMap
          position={pending}
          onPick={(lat, lng) => {
            setPending([lat, lng]);
            setMoved(true);
          }}
          height="100%"
          zoom={zoom}
          follow={false}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-rule bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="min-w-0 flex-1 text-fluid-000 text-ink-3">
          {moved ? "Titik dipilih" : "Titik awal"}
          <span className="block font-mono text-fluid-00 tabular-nums text-ink">
            {pending[0].toFixed(4)}, {pending[1].toFixed(4)}
          </span>
        </p>
        <Button size="lg" onClick={() => onConfirm(pending[0], pending[1])}>
          Cek titik ini
        </Button>
      </div>
    </div>,
    document.body,
  );
}
