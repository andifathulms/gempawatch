"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";

interface Props {
  lat: number;
  lng: number;
  defaultLabel?: string;
}

// Location watch opt-in — the retention primitive. Email me when a significant
// quake happens near this spot. No account required.
export function WatchSubscribeForm({ lat, lng, defaultLabel = "" }: Props) {
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState(defaultLabel);
  const [minMag, setMinMag] = useState(5);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/alerts/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          label,
          lat,
          lng,
          min_magnitude: minMag,
          radius_km: 100,
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-lg border border-risk-green/40 bg-risk-green/10 p-4 text-sm text-text-secondary">
        ✓ Berhasil! Kami akan mengirim email jika ada gempa M{minMag.toFixed(1)}+ di
        dekat lokasi ini. Cek folder spam untuk email pertama.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-text-secondary">
        Dapat email jika ada gempa signifikan dekat lokasi ini. Bukan peringatan
        dini — laporan kejadian yang sudah terjadi.
      </p>
      <input
        type="email"
        required
        placeholder="email@contoh.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-earth-border bg-earth-dark px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-seismic-orange focus:outline-none"
      />
      <input
        type="text"
        placeholder="Label (opsional), mis. Rumah Palu"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded-lg border border-earth-border bg-earth-dark px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-seismic-orange focus:outline-none"
      />
      <label className="flex items-center justify-between text-sm text-text-secondary">
        <span>Beri tahu untuk magnitudo ≥</span>
        <select
          value={minMag}
          onChange={(e) => setMinMag(Number(e.target.value))}
          className="rounded-lg border border-earth-border bg-earth-dark px-2 py-1 text-text-primary focus:border-seismic-orange focus:outline-none"
        >
          {[4, 4.5, 5, 5.5, 6].map((m) => (
            <option key={m} value={m}>
              M{m.toFixed(1)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-lg bg-seismic-orange px-4 py-2.5 text-sm font-semibold text-earth-dark hover:brightness-110 disabled:opacity-60"
      >
        {state === "loading" ? "Menyimpan…" : "Aktifkan Notifikasi"}
      </button>
      {state === "error" && (
        <p className="text-sm text-risk-red">Gagal menyimpan. Coba lagi.</p>
      )}
    </form>
  );
}
