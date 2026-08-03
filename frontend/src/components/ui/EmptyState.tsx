interface Props {
  /** One short sentence: what is not here. */
  title: string;
  /** Why, and what the reader can do about it. */
  description?: React.ReactNode;
  /** Recovery action — reload, clear a filter, pick a point. */
  action?: React.ReactNode;
  tone?: "neutral" | "warning";
}

/**
 * Shared empty and failure state.
 *
 * Every list on the site used to render its own centred grey sentence, which
 * meant "no earthquakes in the last 24 hours" (good news, normal) looked
 * identical to "the data failed to load" (a fault the reader should retry).
 * The tone prop makes that distinction visible.
 */
export function EmptyState({ title, description, action, tone = "neutral" }: Props) {
  const warning = tone === "warning";
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border px-5 py-10 text-center ${
        warning
          ? "border-risk-amber/30 bg-risk-amber/[0.05]"
          : "border-dashed border-earth-border bg-earth-dark/30"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          warning
            ? "bg-risk-amber/15 text-risk-amber"
            : "bg-earth-raised text-text-muted"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          {warning ? (
            <>
              <path d="M10 6.5v4.2" />
              <path d="M10 13.8v.2" />
              <path d="M10 2.5 1.8 16.5h16.4L10 2.5Z" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx="10" cy="10" r="7" />
              <path d="M6.8 10h6.4" />
            </>
          )}
        </svg>
      </span>
      <p
        className={`text-sm font-medium ${warning ? "text-risk-amber" : "text-text-secondary"}`}
      >
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
