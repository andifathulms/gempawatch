"use client";

import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  /** Absolute or relative path to share (resolved against origin at click). */
  path: string;
  /** Pre-filled caption for WhatsApp / native share. */
  caption: string;
}

// WhatsApp-first share (the dominant channel in Indonesia) + native share sheet
// + copy-link fallback. Turns the risk result into something that spreads.
export function ShareButton({ path, caption }: Props) {
  const { showToast } = useToast();

  const url = () =>
    typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

  const nativeShare = async () => {
    const shareUrl = url();
    if (navigator.share) {
      try {
        await navigator.share({ title: "GempaWatch", text: caption, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${caption} ${shareUrl}`);
      showToast("Tautan disalin ke papan klip.", { variant: "success" });
    } catch {
      showToast("Gagal menyalin tautan.", { variant: "error" });
    }
  };

  const whatsappHref = () =>
    `https://wa.me/?text=${encodeURIComponent(`${caption} ${url()}`)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-earth-dark hover:brightness-110"
      >
        Bagikan ke WhatsApp
      </a>
      <button
        onClick={nativeShare}
        className="rounded-lg border border-earth-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-orange"
      >
        Bagikan / Salin tautan
      </button>
    </div>
  );
}
