"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  /** Where readers of this retired route should end up. */
  to: string;
  message: string;
}

/**
 * A retired route's whole body (DESIGN.md §10 step 5).
 *
 * Static hosting cannot issue a real 302 — no server sits between the request
 * and the file — so this is `router.replace` in an effect, same pattern the
 * `.live.tsx` route-gating already relies on for "this URL doesn't really
 * exist here" elsewhere in the codebase. The visible message and manual link
 * are the fallback for the moment before JS runs (or if it never does): a
 * blank page with no explanation is a worse failure mode than a half-second
 * flash of this.
 */
export function RouteStub({ to, message }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [to, router]);

  return (
    <div className="mx-auto max-w-md space-y-3 py-20 text-center">
      <p className="text-fluid-00 leading-relaxed text-text-secondary">{message}</p>
      <Link
        href={to}
        className="inline-block text-fluid-00 font-medium text-seismic-bright underline underline-offset-2 hover:brightness-110"
      >
        Lanjut ke sana →
      </Link>
    </div>
  );
}
