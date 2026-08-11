interface Props {
  title?: React.ReactNode;
  /** One line of context under the title — what the panel shows, or its caveat. */
  subtitle?: React.ReactNode;
  /** Optional element on the right of the title row (link, badge, toggle…). */
  action?: React.ReactNode;
  /** Pinned to the bottom behind a rule — attribution, footnotes, links. */
  footer?: React.ReactNode;
  /** `flush` removes body padding so maps and tables can reach the card edge. */
  variant?: "default" | "flush";
  /** Anchor target, so a page's contents list can link to this panel. */
  id?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The workhorse panel.
 *
 * The title is set in the display face with wide tracking so it reads as a
 * label on an instrument rather than a heading in a document — which keeps a
 * page full of cards from competing with its own h1.
 */
export function Card({
  title,
  subtitle,
  action,
  footer,
  variant = "default",
  id,
  children,
  className,
}: Props) {
  const hasHeader = Boolean(title || action || subtitle);
  const body =
    variant === "flush"
      ? hasHeader
        ? "px-1 pb-1"
        : "p-1"
      : hasHeader
        ? "px-4 pb-4 sm:px-5 sm:pb-5"
        : "p-4 sm:p-5";

  return (
    <section
      id={id}
      className={`overflow-hidden rounded-xl border border-earth-border bg-earth-surface shadow-raised ${className ?? ""}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 font-display text-fluid-000 font-semibold uppercase tracking-[0.14em] text-text-secondary">
                <span
                  aria-hidden="true"
                  className="h-3.5 w-0.5 shrink-0 rounded-full bg-seismic-orange"
                />
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1.5 text-fluid-00 leading-relaxed text-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={body}>{children}</div>
      {footer && (
        <div className="border-t border-earth-border bg-earth-dark/40 px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}
