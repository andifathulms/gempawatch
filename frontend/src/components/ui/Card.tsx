interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: Props) {
  return (
    <section
      className={`rounded-xl border border-earth-border bg-earth-surface p-4 ${className ?? ""}`}
    >
      {title && (
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
