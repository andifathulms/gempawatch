// Events younger than 1 hour may still be revised by BMKG (PRD data-quality rule).
export function PreliminaryTag() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-risk-amber/40 bg-risk-amber/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-risk-amber"
      title="Bacaan awal — BMKG masih dapat merevisi magnitudo dan kedalaman"
    >
      Awal
    </span>
  );
}
