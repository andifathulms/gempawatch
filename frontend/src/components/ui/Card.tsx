interface Props {
  title?: string;
  /** Optional element rendered on the right side of the title row (link, badge…). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, action, children, className }: Props) {
  return (
    <section
      className={`rounded-xl border border-earth-border bg-earth-surface p-4 shadow-sm transition-shadow duration-200 ${className ?? ""}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <span className="h-3 w-0.5 rounded-full bg-seismic-orange/70" />
              {title}
            </h2>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
