// Marks events with BMKG "dirasakan" (felt) reports.
export function FeltBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-depth-blue/40 bg-depth-blue/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-depth-blue"
      title="Gempa ini dilaporkan dirasakan warga (BMKG)"
    >
      Dirasakan
    </span>
  );
}
