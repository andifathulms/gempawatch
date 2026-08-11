"""
Composite seismic-activity score — the single calibrated number surfaced to
users so they don't have to interpret four raw event counts themselves.

Design goals (senior/defensible):
  * Transparent weighted sum, every component documented and capped.
  * Scored from historical *pattern* only — never framed as prediction.
  * Distinct from tsunami tier (that answers a different question).

The formula is intentionally simple and explainable on the methodology page.
Components (weights sum to 100):

  frequency  (0–40)  events M4+ per year within 100km, saturating at 5/yr
  magnitude  (0–30)  largest recorded magnitude, mapped M4→0 … M9→30
  shallow    (0–15)  share of nearby events shallower than 70km (damaging)
  proximity  (0–15)  closeness to nearest fault, full within ~10km, 0 by 100km

Percentile is computed separately by ranking a region's score against all
other scored regions (gives "more active than X% of Indonesia").
"""
from dataclasses import dataclass

FREQUENCY_WEIGHT = 40
MAGNITUDE_WEIGHT = 30
SHALLOW_WEIGHT = 15
PROXIMITY_WEIGHT = 15

FREQUENCY_SATURATION_PER_YEAR = 5.0  # events/yr that maxes out the frequency term
FAULT_PROXIMITY_RANGE_KM = 100.0  # beyond this, fault proximity contributes 0

# Activity tier thresholds on the 0–100 composite.
HIGH_THRESHOLD = 60
MODERATE_THRESHOLD = 30


@dataclass
class ScoreInputs:
    m4_count: int
    coverage_years: float
    largest_magnitude: float | None
    shallow_ratio: float | None  # 0..1
    nearest_fault_distance_km: float | None


def _frequency_component(m4_count: int, coverage_years: float) -> float:
    if coverage_years <= 0:
        return 0.0
    per_year = m4_count / coverage_years
    return min(1.0, per_year / FREQUENCY_SATURATION_PER_YEAR) * FREQUENCY_WEIGHT


def _magnitude_component(largest_magnitude: float | None) -> float:
    if not largest_magnitude:
        return 0.0
    # Map M4 -> 0, M9 -> full weight; clamp outside.
    frac = max(0.0, min(1.0, (largest_magnitude - 4.0) / 5.0))
    return frac * MAGNITUDE_WEIGHT


def _shallow_component(shallow_ratio: float | None) -> float:
    if shallow_ratio is None:
        return 0.0
    return max(0.0, min(1.0, shallow_ratio)) * SHALLOW_WEIGHT


def _proximity_component(distance_km: float | None) -> float:
    if distance_km is None:
        return 0.0
    frac = max(0.0, (FAULT_PROXIMITY_RANGE_KM - distance_km) / FAULT_PROXIMITY_RANGE_KM)
    return frac * PROXIMITY_WEIGHT


def compute_composite_score(inputs: ScoreInputs) -> float:
    """Return a 0–100 composite seismic-activity score."""
    score = (
        _frequency_component(inputs.m4_count, inputs.coverage_years)
        + _magnitude_component(inputs.largest_magnitude)
        + _shallow_component(inputs.shallow_ratio)
        + _proximity_component(inputs.nearest_fault_distance_km)
    )
    return round(score, 1)


def score_breakdown(inputs: ScoreInputs) -> list[dict]:
    """
    The same four terms compute_composite_score() sums, itemised.

    The composite is a weighted sum whose parts were computed and thrown away,
    which meant two regions could share a score for completely different
    reasons and the product had no way to say so. Frequency saturates at
    5 events/yr, so every genuinely active area pins that term at 40/40 and
    stops differentiating — above that line the score is moved entirely by the
    other three. That is worth showing rather than hiding.

    Each component is rounded to 1dp INDEPENDENTLY, so the printed parts can
    differ from the printed total by up to 0.2. The total is the authority: it
    is rounded once from the unrounded sum. Callers displaying both must say so
    rather than letting a reader assume the column adds up.

    `basis` is the input that drove the term, so a reader can check the
    arithmetic against the documented rule rather than trusting the number.
    """
    per_year = (
        inputs.m4_count / inputs.coverage_years if inputs.coverage_years > 0 else None
    )
    return [
        {
            "key": "frequency",
            "points": round(
                _frequency_component(inputs.m4_count, inputs.coverage_years), 1
            ),
            "max_points": FREQUENCY_WEIGHT,
            "basis": {"events_per_year": round(per_year, 2) if per_year else None},
            "saturated": bool(
                per_year is not None and per_year >= FREQUENCY_SATURATION_PER_YEAR
            ),
        },
        {
            "key": "magnitude",
            "points": round(_magnitude_component(inputs.largest_magnitude), 1),
            "max_points": MAGNITUDE_WEIGHT,
            "basis": {"largest_magnitude": inputs.largest_magnitude},
            "saturated": bool(
                inputs.largest_magnitude is not None and inputs.largest_magnitude >= 9.0
            ),
        },
        {
            "key": "shallow",
            "points": round(_shallow_component(inputs.shallow_ratio), 1),
            "max_points": SHALLOW_WEIGHT,
            "basis": {
                "shallow_ratio": (
                    round(inputs.shallow_ratio, 3)
                    if inputs.shallow_ratio is not None
                    else None
                )
            },
            "saturated": bool(
                inputs.shallow_ratio is not None and inputs.shallow_ratio >= 1.0
            ),
        },
        {
            "key": "proximity",
            "points": round(
                _proximity_component(inputs.nearest_fault_distance_km), 1
            ),
            "max_points": PROXIMITY_WEIGHT,
            "basis": {"nearest_fault_distance_km": inputs.nearest_fault_distance_km},
            "saturated": bool(
                inputs.nearest_fault_distance_km is not None
                and inputs.nearest_fault_distance_km <= 0.0
            ),
        },
    ]


def score_to_tier(score: float | None) -> str | None:
    if score is None:
        return None
    if score >= HIGH_THRESHOLD:
        return "HIGH"
    if score >= MODERATE_THRESHOLD:
        return "MODERATE"
    return "LOW"


def percentile_rank(score: float, all_scores: list[float]) -> int:
    """
    Percent of regions with a score <= this one (0–100). With a single region
    this returns 100; callers should treat percentile as meaningful only once
    several regions are scored.
    """
    if not all_scores:
        return 0
    at_or_below = sum(1 for s in all_scores if s <= score)
    return round(at_or_below / len(all_scores) * 100)
