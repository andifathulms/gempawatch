interface Props {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function Stat({ label, value, accent }: Props) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`font-mono text-lg ${accent ? "text-seismic-orange" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
