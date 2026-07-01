// Events younger than 1 hour may still be revised by BMKG (PRD data-quality rule).
export function PreliminaryTag() {
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-risk-amber border border-risk-amber/40">
      Preliminary
    </span>
  );
}
