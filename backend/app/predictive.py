import math
from typing import Iterable

DEFAULT_FEATURE_WEIGHTS: dict[str, float] = {
    "age_normalized": 0.35,
    "city_turnout_history": 0.25,
    "contactability": 0.15,
    "past_support_signal": 0.20,
    "engagement_index": 0.05,
}


def sigmoid(x: float) -> float:
    """Logistic function — maps any real value to (0, 1)."""
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def weighted_linear_score(features: dict[str, float], weights: dict[str, float] | None = None) -> float:
    active_weights = weights or DEFAULT_FEATURE_WEIGHTS
    total = 0.0
    for key, weight in active_weights.items():
        total += features.get(key, 0.0) * weight
    return total


def predict_probability(
    features: dict[str, float],
    *,
    weights: dict[str, float] | None = None,
    bias: float = -0.2,
) -> float:
    linear = weighted_linear_score(features, weights) + bias
    return sigmoid(linear)


def predict_label(score: float, threshold: float = 0.5) -> str:
    return "positive" if score >= threshold else "negative"


def batch_predict(
    feature_rows: Iterable[dict[str, float]],
    *,
    threshold: float = 0.5,
    weights: dict[str, float] | None = None,
) -> list[dict[str, float | str]]:
    results: list[dict[str, float | str]] = []
    for features in feature_rows:
        score = predict_probability(features, weights=weights)
        results.append({"score": score, "label": predict_label(score, threshold), "threshold": threshold})
    return results
