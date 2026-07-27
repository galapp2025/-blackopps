from __future__ import annotations

import json
import logging
from typing import Any

from app.config import get_settings
from app.intelligence.metrics import METRICS_LIST, analyze_voters_locally

logger = logging.getLogger("blackopps.intelligence")

MAX_AI_BATCH = 12


def _build_prompt(names: list[str]) -> str:
    metrics_json = ", ".join(f'"{m}"' for m in METRICS_LIST)
    return f"""You are the core intelligence engine of BlackOpps.
Analyze the following list of voters from an election campaign context: {json.dumps(names, ensure_ascii=False)}.
For each person, generate a profile based on exactly 30 strategic data points.

In addition, implement the newly authorized operational features:
1. Omnichannel Execution: Generate the exact, tailor-made WhatsApp text message to mobilize this individual based on their profile.
2. Micro-Targeting Flash Alerts: Detect any critical vulnerability, shift in opinion, or sudden opportunity for influence.

Return strict JSON with this shape:
{{
  "voters": [
    {{
      "id": "V-1",
      "name": "string",
      "metrics": {{ "metric name in Hebrew": number between 40 and 100 }},
      "recommendations": {{
        "channel": "string in Hebrew",
        "trigger": "string in Hebrew",
        "avoid": "string in Hebrew"
      }},
      "operational": {{
        "flashAlert": "string in Hebrew",
        "actionableMessage": "string in Hebrew"
      }}
    }}
  ]
}}

The metrics object must use exactly these 30 Hebrew keys:
{metrics_json}"""


def _normalize_ai_voters(raw: Any, names: list[str]) -> list[dict]:
    fallback = analyze_voters_locally(names)
    if not isinstance(raw, dict):
        return fallback

    voters_raw = raw.get("voters")
    if not isinstance(voters_raw, list):
        return fallback

    normalized: list[dict] = []
    for index, item in enumerate(voters_raw):
        base = fallback[index] if index < len(fallback) else fallback[0]
        if not isinstance(item, dict):
            normalized.append({**base, "id": f"V-{index + 1}"})
            continue

        name = item.get("name") if isinstance(item.get("name"), str) else names[index] if index < len(names) else base["name"]
        metrics = item.get("metrics") if isinstance(item.get("metrics"), dict) else base["metrics"]
        rec = item.get("recommendations") if isinstance(item.get("recommendations"), dict) else {}
        op = item.get("operational") if isinstance(item.get("operational"), dict) else base["operational"]

        normalized.append(
            {
                "id": f"V-{index + 1}",
                "name": name,
                "metrics": metrics,
                "recommendations": {**base["recommendations"], **rec},
                "operational": op if op else base["operational"],
            }
        )
    return normalized


def _analyze_with_openai(names: list[str], api_key: str) -> list[dict] | None:
    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed; using local analysis")
        return None

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=get_settings().openai_model,
        messages=[{"role": "user", "content": _build_prompt(names)}],
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content or "{}"
    data = json.loads(text)
    return _normalize_ai_voters(data, names)


def analyze_names_batch(names: list[str]) -> list[dict]:
    cleaned = [n.strip() for n in names if n and n.strip()][:MAX_AI_BATCH]
    if not cleaned:
        return []

    settings = get_settings()
    if settings.openai_api_key:
        try:
            ai_result = _analyze_with_openai(cleaned, settings.openai_api_key)
            if ai_result:
                return ai_result
        except Exception as exc:  # noqa: BLE001
            logger.exception("OpenAI analyze failed: %s", exc)

    return analyze_voters_locally(cleaned)
