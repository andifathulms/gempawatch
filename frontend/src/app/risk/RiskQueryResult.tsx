"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RiskReportView } from "@/components/risk/RiskReportView";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

  // The report is computed in the browser on static deploys, so this state is
  // real work rather than a flash — it gets a skeleton shaped like the result.
  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-56" />
        <Card>
          <div className="space-y-4">
            <Skeleton className="mx-auto h-28 w-52" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (state.status === "invalid" || state.status === "error") {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <EmptyState
            tone="warning"
            title={
              state.status === "invalid"
                ? "Koordinat pada tautan ini tidak valid."
                : "Gagal memuat laporan risiko untuk titik ini."
            }
            description="Pilih titik langsung di peta untuk mendapatkan laporan baru."
            action={
              <ButtonLink href="/risk-check" size="sm">
                Pilih lokasi di peta →
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }

  return <RiskReportView report={state.report} lat={state.lat} lng={state.lng} />;
}
