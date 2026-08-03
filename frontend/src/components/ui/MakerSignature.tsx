import type { ComponentType, SVGProps } from "react";

/**
 * Personal author credit for the footer.
 *
 * Deliberately kept apart from the BMKG/USGS attribution above it: that one is
 * a legal requirement about where the data comes from, this one is a byline.
 * They must never read as the same statement.
 *
 * Everything identifying the author lives in MAKER, so updating a handle or
 * adding a platform is a one-line change.
 */

type IconProps = SVGProps<SVGSVGElement>;

const GlobeIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="9.25" />
    <path d="M2.75 12h18.5" />
    <path d="M12 2.75c2.4 2.5 3.75 5.8 3.75 9.25S14.4 18.75 12 21.25c-2.4-2.5-3.75-5.8-3.75-9.25S9.6 5.25 12 2.75Z" />
  </svg>
);

const GitHubIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
  </svg>
);

const LinkedInIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" />
    <circle cx="12" cy="12" r="4.25" />
    <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

const MAKER = {
  name: "Andi Fathul Mukminin",
  links: [
    {
      label: "Portfolio",
      href: "https://andifathulms.github.io/en/",
      Icon: GlobeIcon as ComponentType<IconProps>,
    },
    {
      label: "GitHub",
      href: "https://github.com/andifathulms",
      Icon: GitHubIcon as ComponentType<IconProps>,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/andifathulmukminin/",
      Icon: LinkedInIcon as ComponentType<IconProps>,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/andifathulms/",
      Icon: InstagramIcon as ComponentType<IconProps>,
    },
  ],
} as const;

export function MakerSignature() {
  // Evaluated when the page is rendered — at build time for static exports,
  // which the publishing workflow re-runs regularly, so it stays current.
  const year = new Date().getFullYear();
  const portfolio = MAKER.links[0].href;

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
      <p className="text-xs text-text-muted">
        Designed &amp; built by{" "}
        <a
          href={portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary underline underline-offset-2 transition-colors hover:text-seismic-orange"
        >
          {MAKER.name}
        </a>{" "}
        &middot; <span className="font-mono tabular-nums">&copy; {year}</span>
      </p>

      <ul className="-ml-1.5 flex items-center gap-0.5 sm:ml-0">
        {MAKER.links.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex rounded-md p-1.5 text-text-muted transition-colors hover:bg-earth-surface hover:text-text-primary"
            >
              <Icon className="h-[18px] w-[18px]" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
