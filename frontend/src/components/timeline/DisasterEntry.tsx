import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { QuakeFieldCanvas } from "@/components/map/QuakeFieldCanvas";
import { DisasterSeismogramFragment } from "./DisasterSeismogramFragment";
import { num } from "@/lib/format";
import type { HistoricalDisaster } from "@/lib/types";
import type { DisasterFragment } from "@/lib/seismogram";

/**
 * Casualties above this mark an entry as one of the defining disasters —
 * a larger title, nothing louder. Restraint matters more here than anywhere
 * else in the app: these are deaths, not risk indicators, so no red.
 */
function isMajor(casualties: number | null): boolean {
  return (casualties ?? 0) >= 5000;
}

interface Props {
  disaster: HistoricalDisaster;
  fragment?: DisasterFragment | null;
}

/**
 * One archived disaster as a story row: where it happened (a locator drawn
 * from the quake field, with the 100 km around the epicentre kept in colour),
 * what happened, the human toll, and the regional record it sits in. Rows are
 * separated by rules rather than boxed, so the archive reads as one document.
 */
export function DisasterEntry({ disaster, fragment }: Props) {
  const major = isMajor(disaster.casualties);
  const date = new Date(disaster.event_date);
  const { latitude: lat, longitude: lng } = disaster;

  return (
    <article className="grid gap-5 border-t border-rule py-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div className="gw-paper-grid h-[180px] overflow-hidden rounded-xl border border-rule md:h-[200px]">
        <QuakeFieldCanvas
          className="h-full w-full"
          label={`Lokasi ${disaster.name}: gempa M4.5+ sejak 1970 dalam radius 100 km dari episentrum tetap berwarna.`}
          bbox={[lng - 1.7, lat - 1.5, lng + 1.7, lat + 1.5]}
          focus={{ lat, lon: lng, radiusKm: 100 }}
          scale={1.1}
        />
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-fluid-000 tabular-nums text-ink-3">
              <time dateTime={disaster.event_date}>
                {date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </time>
            </p>
            <h3 className={`mt-1 font-extrabold tracking-tight ${major ? "text-fluid-4" : "text-fluid-3"}`}>
              {disaster.name}
            </h3>
          </div>
          {disaster.magnitude != null && (
            <MagnitudeBadge
              magnitude={disaster.magnitude}
              // Historical entries carry no depth in the dataset; 20 km is a
              // stand-in that keeps the badge on the shallow end of the ramp,
              // which is where destructive events overwhelmingly sit.
              depthKm={20}
              size={major ? 56 : 46}
            />
          )}
        </div>

        <p className="max-w-[68ch] text-fluid-0 leading-relaxed text-ink-2">{disaster.description}</p>

        {(disaster.casualties != null || disaster.displaced != null) && (
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            {disaster.casualties != null && (
              <div>
                <dd className="text-fluid-3 font-extrabold tabular-nums tracking-tight text-ink">
                  {num(disaster.casualties)}
                </dd>
                <dt className="text-fluid-000 text-ink-3">korban jiwa</dt>
              </div>
            )}
            {disaster.displaced != null && (
              <div>
                <dd className="text-fluid-3 font-extrabold tabular-nums tracking-tight text-ink">
                  {num(disaster.displaced)}
                </dd>
                <dt className="text-fluid-000 text-ink-3">kehilangan tempat tinggal / mengungsi</dt>
              </div>
            )}
          </dl>
        )}

        {fragment && (
          <div className="pt-1">
            <DisasterSeismogramFragment
              regionName={fragment.regionName}
              events={fragment.events}
              disasterDateIso={disaster.event_date}
            />
            <p className="mt-1 text-fluid-000 text-ink-3">
              Rekaman gempa M5+ {fragment.regionName} sejak 1970; kejadian ini ditandai hitam.
            </p>
          </div>
        )}

        {disaster.source_links.length > 0 && (
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-fluid-000">
            <span className="text-ink-3">Rujukan:</span>
            {disaster.source_links.map((link, i) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 underline underline-offset-2 transition-colors hover:text-ink"
              >
                Sumber {i + 1} ↗
              </a>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
