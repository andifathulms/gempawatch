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
