interface Props {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function Stat({ label, value, accent }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-earth-border/60 py-2 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`font-mono text-lg tabular-nums ${accent ? "text-seismic-orange" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
