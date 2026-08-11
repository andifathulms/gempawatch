import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

/**
 * One button, three weights.
 *
 * Before this existed every call-to-action carried its own hand-rolled class
 * string, so the primary orange button was a slightly different height, radius,
 * and hover behaviour on each page. Anything that navigates renders as a Link;
 * anything that acts renders as a <button> — never the other way round, since
 * that costs middle-click, right-click, and prefetch.
 */

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
  "transition-[filter,background-color,border-color,transform,box-shadow] " +
  "duration-200 ease-out-soft active:scale-[0.98] disabled:pointer-events-none " +
  "disabled:opacity-50 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-seismic-orange text-earth-dark shadow-glow hover:brightness-110",
  secondary:
    "border border-earth-border bg-earth-surface text-text-primary " +
    "hover:border-seismic-orange hover:bg-earth-raised",
  ghost:
    "text-text-secondary hover:bg-earth-surface hover:text-text-primary",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-fluid-000",
  md: "px-4 py-2.5 text-fluid-00",
  lg: "px-6 py-3 text-fluid-0",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  external,
  children,
  ...rest
}: CommonProps & {
  href: string;
  /** Renders a plain anchor with the safe rel/target pair. */
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`;
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
