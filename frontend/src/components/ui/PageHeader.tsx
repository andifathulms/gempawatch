interface Props {
  /** Small uppercase label above the title (e.g. region type). */
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional element on the right (button, share, badge). */
  action?: React.ReactNode;
  /** Optional content below the header (search, share row…). */
  children?: React.ReactNode;
}

// Consistent interior-page header — a lighter sibling of the homepage hero.
// Left accent bar + tinted panel keeps interior pages on-brand without competing
// with the homepage's full hero.
export function PageHeader({ eyebrow, title, subtitle, action, children }: Props) {
  return (
    <section className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-earth-border bg-gradient-to-br from-earth-surface to-earth-dark p-5 shadow-sm sm:p-6">
      <span
        aria-hidden="true"
        className="absolute inset-y-4 left-0 w-1 rounded-full bg-seismic-orange/70"
      />
      <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4 pl-3">{children}</div>}
    </section>
  );
}
