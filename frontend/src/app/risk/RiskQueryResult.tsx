"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RiskReportView } from "@/components/risk/RiskReportView";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { RiskCheckReport } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "error" }
  | { status: "ready"; report: RiskCheckReport; lat: number; lng: number };

/**
 * Client-side risk result addressed by query string.
 *
 * On static deploys this replaces /risk/[lat]/[lng] — the coordinates arrive in
 * the URL and the report is computed in the browser by the TypeScript engine,
 * so an arbitrary point still works with no server involved.
 */
export function RiskQueryResult() {
  const searchParams = useSearchParams();
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const lat = Number(latParam);
    const lng = Number(lngParam);
    const valid =
      latParam !== null &&
      lngParam !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180;

    if (!valid) {
      setState({ status: "invalid" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });
    api
      .riskCheck(lat, lng)
      .then((report) => {
        if (!cancelled) setState({ status: "ready", report, lat, lng });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [latParam, lngParam]);

  if (state.status === "loading") {
    return (
      <Card>
        <p className="py-10 text-center text-text-muted">Menghitung laporan risiko…</p>
      </Card>
    );
  }

  if (state.status === "invalid" || state.status === "error") {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">
          {state.status === "invalid"
            ? "Koordinat tidak valid."
            : "Gagal memuat laporan risiko untuk titik ini."}
        </p>
        <Link href="/risk-check" className="text-seismic-orange underline">
          Pilih lokasi di peta →
        </Link>
      </div>
    );
  }

  return <RiskReportView report={state.report} lat={state.lat} lng={state.lng} />;
}
