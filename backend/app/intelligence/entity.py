from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

TITLE_PATTERN = re.compile(
    r"^(mr|mrs|ms|dr|prof|rav|rabbi|sheikh|מר|גב'|גב|ד\"ר|ד׳ר|פרופ|הרב|שייח'|שייח)\.?\s+",
    re.IGNORECASE,
)

HEBREW_TO_LATIN = str.maketrans(
    {
        "א": "a",
        "ב": "b",
        "ג": "g",
        "ד": "d",
        "ה": "h",
        "ו": "v",
        "ז": "z",
        "ח": "ch",
        "ט": "t",
        "י": "y",
        "כ": "k",
        "ך": "k",
        "ל": "l",
        "מ": "m",
        "ם": "m",
        "נ": "n",
        "ן": "n",
        "ס": "s",
        "ע": "a",
        "פ": "p",
        "ף": "f",
        "צ": "ts",
        "ץ": "ts",
        "ק": "k",
        "ר": "r",
        "ש": "sh",
        "ת": "t",
    }
)


def normalize_name(name: str) -> str:
    cleaned = name.strip()
    while True:
        updated = TITLE_PATTERN.sub("", cleaned, count=1)
        if updated == cleaned:
            break
        cleaned = updated
    cleaned = re.sub(r"\s+", " ", cleaned.lower()).strip()
    return cleaned


def _word_jaccard(a: str, b: str) -> float:
    words_a = set(a.split())
    words_b = set(b.split())
    if not words_a or not words_b:
        return 0.0
    inter = len(words_a & words_b)
    union = len(words_a | words_b)
    return inter / union if union else 0.0


def name_similarity(a: str, b: str) -> float:
    na, nb = normalize_name(a), normalize_name(b)
    if not na or not nb:
        return 0.0
    seq = SequenceMatcher(None, na, nb).ratio()
    jaccard = _word_jaccard(na, nb)
    return 0.4 * seq + 0.6 * jaccard


def hebrew_to_latin_approximation(text: str) -> str:
    return text.translate(HEBREW_TO_LATIN)


def generate_name_variants(name: str) -> list[str]:
    base = normalize_name(name)
    variants = {base, base.replace("  ", " ")}
    latin = hebrew_to_latin_approximation(base)
    if latin.strip():
        variants.add(latin)
        variants.add(latin.replace("y", "i"))
        variants.add(re.sub(r"(.)\1+", r"\1", latin))
    parts = base.split()
    if len(parts) >= 2:
        variants.add(f"{parts[0]} {parts[-1]}")
        variants.add(f"{parts[-1]} {parts[0]}")
    return sorted(v for v in variants if v)


def resolve_entity(
    name: str,
    location: str = "",
    candidate_pool: list[dict[str, Any]] | None = None,
    threshold: float = 0.75,
) -> dict[str, Any]:
    pool = candidate_pool or []
    best: dict[str, Any] | None = None
    best_score = 0.0
    alternatives: list[dict[str, Any]] = []

    target_loc = location.strip().lower()
    for candidate in pool:
        candidate_name = str(candidate.get("name") or candidate.get("entity") or "")
        score = name_similarity(name, candidate_name)
        cand_loc = str(candidate.get("location") or "").strip().lower()
        if target_loc and cand_loc and target_loc in cand_loc:
            score = min(1.0, score + 0.15)
        if score >= threshold:
            alternatives.append({"entity": candidate, "confidence": round(score, 3)})
        if score > best_score:
            best_score = score
            best = candidate

    alternatives.sort(key=lambda item: item["confidence"], reverse=True)
    matched = best is not None and best_score >= threshold
    return {
        "matched": matched,
        "entity": best if matched else None,
        "confidence": round(best_score, 3),
        "alternatives": alternatives[:5],
    }
