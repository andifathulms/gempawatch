"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { renderShareImage, type ShareImageData } from "@/lib/shareImage";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  /** Everything but the record, which is fetched on click. */
  data: Omit<ShareImageData, "timeline">;
  /** Region whose timeline is drawn across the card. */
  timelineSlug?: string;
  timelineName?: string;
  /** Caption offered alongside the image in the share sheet. */
  caption: string;
}

function fileName(place: string) {
  const slug = place
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `gempawatch-${slug || "hasil"}.png`;
}

/**
 * "Bagikan gambar": renders the 1080×1350 portrait card (lib/shareImage.ts)
 * and hands it to the phone's own share sheet, so it can go straight to
 * WhatsApp Status. Where the Web Share API cannot take files (most desktops),
 * the image downloads instead.
 */
export function ShareImageButton({ data, timelineSlug, timelineName, caption }: Props) {
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const onClick = async () => {
    setBusy(true);
    try {
      const timeline = timelineSlug
        ? await api
            .regionTimeline(timelineSlug)
            .then((t) => ({
              name: timelineName ?? t.region.name,
              events: t.events.map((e) => ({
                event_time: e.event_time,
                magnitude: e.magnitude,
                depth_km: e.depth_km,
                source: e.source,
              })),
            }))
            .catch(() => undefined)
        : undefined;
      const blob = await renderShareImage({ ...data, timeline });
      const file = new File([blob], fileName(data.place), { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: caption });
        } catch (e) {
          // Closing the share sheet is a choice, not an error.
          if ((e as DOMException)?.name !== "AbortError") throw e;
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast("Gambar tersimpan. Unggah ke Status atau kirim ke grup.");
    } catch {
      showToast("Gagal membuat gambar. Coba lagi.", { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-rule-strong bg-surface px-4 text-fluid-00 font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="2.5" width="14" height="15" rx="2" />
        <path d="m3.5 14 4-4 3 3 2.5-2.5 3.5 3.5" strokeLinejoin="round" />
        <circle cx="13" cy="6.5" r="1.3" />
      </svg>
      {busy ? "Membuat gambar…" : "Bagikan gambar"}
    </button>
  );
}
