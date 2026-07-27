from __future__ import annotations

METRICS_LIST: tuple[str, ...] = (
    "פילוח סוציו-אקונומי",
    "נטייה פוליטית משוערכת",
    "מדד השפעה מקומית",
    "רמת מעורבות דיגיטלית",
    "רגישות לנושאים כלכליים",
    "זיקה למסורת/דת",
    "פוטנציאל הנעה לפעולה",
    "מדד חסינות למסרי נגד",
    "סטטוס תעסוקתי במקרו",
    "שיוך קהילתי/מגזרי",
    "ערוץ תקשורת מועדף",
    "רמת אמון במערכות ממוסדות",
    "עניין בנושאי ביטחון",
    "תפיסת איומים קיומיים",
    "מדד אקטיביזם בשטח",
    "היסטוריית הצבעה משוערת",
    "רמת תמיכה בשינוי סטטוס-קוו",
    "צריכת מדיה מובילה",
    "רגישות למובילי דעת קהל",
    "פרופיל פסיכולוגי: מונע פחד",
    "פרופיל פסיכולוגי: מונע תקווה",
    "מדד לחץ חברתי סביבתי",
    "סבירות להשתתפות אקטיבית",
    "עמדה בנושאי פנים וקהילה",
    "רמת פתוחות לשינוי עמדה",
    "רמת מעורבות בארגונים מקומיים",
    "מדד חשיפה לפייק ניוז",
    "סטטוס משפחתי והשפעתו",
    "רמת שביעות רצון מהמצב הקיים",
    "מדד אופטימיזם לאומי",
)


def _metric_score(name: str, metric: str) -> int:
    seed = f"{name}:{metric}"
    hash_val = 0
    for char in seed:
        hash_val = ((hash_val << 5) - hash_val + ord(char)) & 0xFFFFFFFF
    if hash_val & 0x80000000:
        hash_val = -((hash_val ^ 0xFFFFFFFF) + 1)
    return 60 + (abs(hash_val) % 41)


def build_operational_profile(name: str, index: int) -> dict[str, str]:
    first_name = name.split(" ", 1)[0] if name.strip() else name
    flash = (
        "התרעת רגישות גבוהה למסרי ביטחון ביממה האחרונה"
        if index % 3 == 0
        else "זוהה חלון השפעה קצר לשינוי עמדה סביב נושאים כלכליים"
    )
    message = (
        f"שלום {first_name}, רצינו לעדכן אותך בנושאים שמשפיעים ישירות על הקהילה והמשפחה שלך. "
        "נשמח לשוחח כמה דקות ולהציג את התוכנית המעשית שלנו."
    )
    return {"flashAlert": flash, "actionableMessage": message}


def analyze_voters_locally(names: list[str]) -> list[dict]:
    voters: list[dict] = []
    for index, name in enumerate(names):
        metrics = {metric: _metric_score(name, metric) for metric in METRICS_LIST}
        channel = (
            "WhatsApp (הודעה מותאמת)"
            if index % 2 == 0
            else "שיחת טלפון אישית מנציג"
        )
        voters.append(
            {
                "id": f"V-{index + 1}",
                "name": name,
                "metrics": metrics,
                "recommendations": {
                    "channel": channel,
                    "trigger": "להדגיש יציבות פיננסית וביטחון קהילתי על בסיס פרופיל 30 הנקודות המלא.",
                    "avoid": "להימנע לחלוטין ממסרים אידאולוגיים כלליים שלא נוגעים לפרט.",
                },
                "operational": build_operational_profile(name, index),
            }
        )
    return voters
