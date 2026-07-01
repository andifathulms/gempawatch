import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Berhenti Berlangganan — GempaWatch" };

// One-click unsubscribe target for notification emails (no login).
export default async function UnsubscribePage({
  params,
}: {
  params: { token: string };
}) {
  let ok = false;
  try {
    const res = await fetch(`${API_BASE}/api/alerts/unsubscribe/${params.token}/`, {
      method: "POST",
      cache: "no-store",
    });
    ok = res.ok;
  } catch {
    ok = false;
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <h1 className="text-lg font-semibold">
          {ok ? "Langganan dinonaktifkan" : "Terjadi kesalahan"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {ok
            ? "Anda tidak akan lagi menerima email notifikasi untuk lokasi ini. Anda bisa berlangganan kembali kapan saja."
            : "Tautan tidak valid atau sudah kedaluwarsa. Coba lagi dari email terbaru."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-seismic-orange hover:brightness-110"
        >
          ← Kembali ke GempaWatch
        </Link>
      </Card>
    </div>
  );
}
