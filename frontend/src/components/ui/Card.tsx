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
  /**
   * How the title carries.
   *
   * `section` (default) is a real heading — the page's second level. `eyebrow`
   * is the old 12.5px uppercase label, kept for panels that are genuinely
   * subordinate to a heading already above them, so it has to be asked for
   * rather than being what every panel silently gets.
   */
  titleAs?: "section" | "eyebrow";
  /** Anchor target, so a page's contents list can link to this panel. */
  id?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The workhorse panel.
 *
 * The title used to be 12px uppercase in the secondary tone, on the theory that
 * a panel label should read as an instrument marking rather than a document
 * heading. The cost was that it rendered *smaller and dimmer than the body copy
 * it introduced*, and since every h2 on the site comes from this component, the
 * whole page went from a ~58px h1 straight to 12px with nothing in between.
 * There was no second level to scan, so a reader landing cold had no way to
 * build a map of the page.
 *
 * So the default is a real section heading. Under "Kertas & Tinta" the panel
 * itself is quiet — a hairline and a white surface, no shadow, no accent tick —
 * because a box is for an object you act on, not for every block of content.
 */
export function Card({
  title,
  subtitle,
  action,
  footer,
  variant = "default",
  titleAs = "section",
  id,
  children,
  className,
}: Props) {
  const titleClass =
    titleAs === "eyebrow"
      ? "text-fluid-000 font-bold uppercase tracking-[0.14em] text-ink-3"
      : "text-fluid-2 font-extrabold tracking-tight text-ink";
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
      className={`overflow-hidden rounded-xl border border-rule bg-surface ${className ?? ""}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            {title && (
              <h2 className={titleClass}>{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-fluid-00 leading-relaxed text-ink-2">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={body}>{children}</div>
      {footer && (
        <div className="border-t border-rule px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}
