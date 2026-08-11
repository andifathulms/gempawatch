interface Props {
  /** Small uppercase label above the title (e.g. region type). */
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional element on the right (button, share, badge). */
  action?: React.ReactNode;
  /** Optional content below the header (search, share row, filters…). */
  children?: React.ReactNode;
}

/**
 * Interior-page header — the lighter sibling of the homepage hero.
 *
 * A hairline contour pattern replaces the old flat gradient: it reads as
 * topography at a glance, gives the page a fixed visual anchor, and costs
 * nothing because it is a repeating gradient rather than an image.
 */
export function PageHeader({ eyebrow, title, subtitle, action, children }: Props) {
  return (
    <section className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-earth-border bg-earth-surface px-5 py-6 shadow-raised sm:px-7 sm:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 22px, rgba(232,116,59,0.05) 22px 23px)",
          maskImage: "linear-gradient(to left, black, transparent 62%)",
          WebkitMaskImage: "linear-gradient(to left, black, transparent 62%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-display text-fluid-000 font-semibold uppercase tracking-[0.16em] text-seismic-orange">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 text-fluid-4 font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2.5 max-w-2xl text-fluid-00 leading-relaxed text-text-secondary sm:text-fluid-0">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="relative mt-5">{children}</div>}
    </section>
  );
}
