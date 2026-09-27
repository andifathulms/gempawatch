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
 * Interior-page header — type on paper, closed by a hairline.
 *
 * It used to be a bordered, shadowed card with an orange hatch pattern, which
 * put a box around the one thing on the page that should lead. "Fewer boxes"
 * (DESIGN.md §3): the headline carries the hierarchy by size and weight, and
 * the rule underneath hands over to the content.
 */
export function PageHeader({ eyebrow, title, subtitle, action, children }: Props) {
  return (
    <section className="animate-fade-in-up border-b border-rule pb-6 sm:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-fluid-000 font-bold uppercase tracking-[0.14em] text-ink-3">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-fluid-5 font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-fluid-0 leading-relaxed text-ink-2 sm:text-fluid-1">
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
