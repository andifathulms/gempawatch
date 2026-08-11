interface Props {
  /** Names the chart. Becomes the figure's visible-to-AT caption. */
  caption: string;
  /** Column headers for the equivalent table, e.g. ["Tingkat", "Jumlah"]. */
  columns: [string, string];
  /** The chart's underlying values, in the order the chart plots them. */
  rows: Array<[string, string | number]>;
  /** The chart itself. */
  children: React.ReactNode;
  /** Optional visible note rendered under the figure. */
  note?: React.ReactNode;
}

/**
 * A chart plus the same numbers as a table, for anyone who cannot see it.
 *
 * Recharts emits bare SVG with no accessible name and no structure — a screen
 * reader gets nothing usable from it. That was not merely a loss of decoration
 * on the region page: the M4/M5/M6/M7 counts appear in the chart and nowhere
 * else on that page, so the data was genuinely unavailable rather than merely
 * awkward to reach (WCAG 1.1.1).
 *
 * The fix is native rather than ARIA. A <figure>/<figcaption> names the graphic
 * with real elements, the SVG is hidden from the tree because it conveys
 * nothing a screen reader can use, and the values are published as an ordinary
 * <table> that is visually hidden but fully navigable — row and column headers
 * included, so table navigation works the way a screen-reader user expects.
 * No role, no aria-label, no chart-specific ARIA pattern.
 */
export function ChartFigure({ caption, columns, rows, children, note }: Props) {
  return (
    <figure className="m-0">
      <figcaption className="sr-only">{caption}</figcaption>

      <div aria-hidden="true">{children}</div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns[0]}</th>
            <th scope="col">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {note}
    </figure>
  );
}
