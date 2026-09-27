"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The score, counting up once as a new result lands — paired with the
 * seismogram's pen-draw, the result's single motion moment (DESIGN.md §13).
 *
 * Only used where the result renders client-side (the homepage check), so the
 * first paint can start from zero without a server/client mismatch; pages
 * rendered on the server pass animate={false} and show the final number at
 * rest. Reduced motion always gets the final number.
 */
export function ScoreNumeral({ value, animate = false }: { value: number; animate?: boolean }) {
  const target = Math.round(value);
  const [shown, setShown] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate || prefersReducedMotion()) {
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{target}</span>
    </>
  );
}
