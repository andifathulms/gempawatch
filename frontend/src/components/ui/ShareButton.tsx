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

  /**
   * Copy, with a path for when the async clipboard is refused.
   *
   * navigator.clipboard.writeText rejects while the document is unfocused, and
   * a share sheet that has just opened or closed leaves it in exactly that
   * state. execCommand("copy") is deprecated but is not subject to that rule,
   * needs no dependency, and is the only fallback available here — so it gets
   * a try before anyone is told the copy failed.
   */
  const copyLink = async (text: string) => {
    try {
      if (!document.hasFocus()) window.focus();
      await navigator.clipboard.writeText(text);
      showToast("Tautan disalin ke papan klip.", { variant: "success" });
      return;
    } catch {
      /* fall through to the legacy path */
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    document.body.removeChild(field);

    showToast(
      copied ? "Tautan disalin ke papan klip." : "Gagal menyalin tautan.",
      { variant: copied ? "success" : "error" },
    );
  };

  const nativeShare = async () => {
    const shareUrl = url();
    if (navigator.share) {
      try {
        await navigator.share({ title: "GempaWatch", text: caption, url: shareUrl });
        return;
      } catch (err) {
        /*
          Dismissing the share sheet is a decision, not a failure. It rejects
          with AbortError, and this used to be a bare catch that fell through to
          the clipboard — which then threw because the sheet still held focus,
          and told someone who had simply changed their mind that copying had
          failed. Cancelling now ends quietly, and only a genuine share error
          falls back to copying.
        */
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await copyLink(`${caption} ${shareUrl}`);
  };

  const whatsappHref = () =>
    `https://wa.me/?text=${encodeURIComponent(`${caption} ${url()}`)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#25D366] px-4 py-2 text-fluid-00 font-semibold text-earth-dark hover:brightness-110"
      >
        Bagikan ke WhatsApp
      </a>
      <button
        onClick={nativeShare}
        className="rounded-lg border border-earth-border px-4 py-2 text-fluid-00 text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-orange"
      >
        Bagikan / Salin tautan
      </button>
    </div>
  );
}
