interface Props {
  title: React.ReactNode;
  /** One line that says what's inside, so a closed row still informs. */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A ruled, expandable row — native <details>, so it works without JS, keeps
 * its content in the page (indexed, findable with Ctrl+F) and is keyboard
 * operable for free.
 *
 * This is how methodology sits under an answer: every derivation is one tap
 * away, but it no longer competes with the answer for the first read. Stack
 * several inside <DisclosureGroup> to share the top rule.
 */
export function Disclosure({ title, summary, defaultOpen, children }: Props) {
  return (
    <details className="group border-b border-rule" open={defaultOpen}>
      <summary className="flex min-h-tap-comfortable cursor-pointer list-none items-baseline gap-x-4 gap-y-1 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-0.5">
          <span className="text-fluid-0 font-bold text-ink">{title}</span>
          {summary && <span className="text-fluid-00 text-ink-3">{summary}</span>}
        </span>
        <span
          aria-hidden="true"
          className="font-mono text-fluid-1 leading-none text-ink-3 transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

export function DisclosureGroup({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-rule">{children}</div>;
}
