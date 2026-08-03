// Shared display formatting. Centralised so a magnitude or a timestamp reads
// identically on the map, in a list, and on a share card.

const ID = "id-ID";

/** "1.284" — Indonesian thousands grouping. */
export function num(value: number): string {
  return value.toLocaleString(ID);
}

/** "M5,4" is wrong in Indonesian locale for magnitudes — seismology uses a dot. */
export function magnitude(value: number | null | undefined): string {
  return value == null ? "—" : `M${value.toFixed(1)}`;
}

export function depth(km: number | null | undefined): string {
  return km == null ? "—" : `${Math.round(km)} km`;
}

/**
 * "12 menit lalu" / "3 jam lalu" / "5 Mar 2025".
 *
 * Recency is the whole point of the live feed, and an absolute timestamp makes
 * the reader do the subtraction. Past ~2 days the relative form stops helping,
 * so it falls back to a date. Always pair with a `title` carrying the exact
 * time — see `absolute` — so precision is one hover away.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);

  if (!Number.isFinite(seconds)) return "—";
  if (seconds < 0) return "baru saja";
  if (seconds < 60) return "baru saja";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.round(hours / 24);
  if (days <= 2) return `${days} hari lalu`;

  return then.toLocaleDateString(ID, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Full timestamp for tooltips and detail rows. */
export function absolute(iso: string): string {
  return new Date(iso).toLocaleString(ID, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "17 Des 2004" — compact date for timeline entries and captions. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(ID, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Region type comes from the API lowercase ("kabupaten"); title-case for display. */
export function regionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
