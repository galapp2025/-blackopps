from __future__ import annotations

import io
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.intelligence.pipeline import EnrichmentPipeline

FONT_DIR = Path(__file__).resolve().parent / "fonts"
HEBREW_FONT = "Hebrew"
HEBREW_FONT_BOLD = "Hebrew-Bold"


def _resolve_font_file(filename: str) -> Path:
    bundled = FONT_DIR / filename
    if bundled.is_file():
        return bundled
    system = Path("/usr/share/fonts/truetype/dejavu") / filename
    if system.is_file():
        return system
    raise FileNotFoundError(f"Missing font file {filename} (checked {FONT_DIR} and dejavu system path)")


@lru_cache(maxsize=1)
def _register_hebrew_fonts() -> None:
    regular_path = _resolve_font_file("DejaVuSans.ttf")
    bold_path = _resolve_font_file("DejaVuSans-Bold.ttf")
    if HEBREW_FONT not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(HEBREW_FONT, str(regular_path)))
    if HEBREW_FONT_BOLD not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(HEBREW_FONT_BOLD, str(bold_path)))


def _p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(str(text)), style)


class BriefingPDF:
    """Builds classified PDF intelligence briefings for field operations."""

    def __init__(self, classification: str = "CONFIDENTIAL") -> None:
        self.classification = classification

    def render(self, name: str, briefing: dict[str, Any], pipeline: EnrichmentPipeline) -> bytes:
        _register_hebrew_fonts()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "BriefTitle",
            parent=styles["Heading1"],
            fontName=HEBREW_FONT_BOLD,
            textColor=colors.HexColor("#991B1B"),
            spaceAfter=12,
            alignment=TA_RIGHT,
        )
        heading_style = ParagraphStyle(
            "BriefHeading",
            parent=styles["Heading2"],
            fontName=HEBREW_FONT_BOLD,
            alignment=TA_RIGHT,
        )
        body = ParagraphStyle(
            "BriefBody",
            parent=styles["BodyText"],
            fontName=HEBREW_FONT,
            alignment=TA_RIGHT,
            leading=16,
        )
        meta = ParagraphStyle(
            "BriefMeta",
            parent=styles["Normal"],
            fontName=HEBREW_FONT,
            alignment=TA_RIGHT,
            textColor=colors.HexColor("#64748B"),
        )

        story: list[Any] = []
        story.append(_p(f"{self.classification} // BLACKOPPS FIELD BRIEFING", body))
        story.append(Spacer(1, 0.3 * cm))
        story.append(_p(f"נושא: {name}", title_style))
        story.append(_p(f"נוצר: {datetime.now(UTC).isoformat()}", meta))
        story.append(Spacer(1, 0.5 * cm))

        scores = briefing.get("dimension_scores") or {}
        score_rows = [
            [_p("מדד", body), _p("ערך", body)],
            [_p("Composite", body), _p(str(briefing.get("composite_score", "—")), body)],
            [_p("Tier", body), _p(str(briefing.get("tier", "—")), body)],
            [_p("Confidence", body), _p(str(briefing.get("confidence", "—")), body)],
            [_p("Political", body), _p(str(scores.get("political", "—")), body)],
            [_p("Community", body), _p(str(scores.get("community", "—")), body)],
            [_p("Voter", body), _p(str(scores.get("voter", "—")), body)],
            [_p("Financial", body), _p(str(scores.get("financial", "—")), body)],
        ]
        table = Table(score_rows, hAlign="RIGHT", colWidths=[5 * cm, 8 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTNAME", (0, 0), (-1, -1), HEBREW_FONT),
                    ("FONTNAME", (0, 0), (-1, 0), HEBREW_FONT_BOLD),
                    ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 0.5 * cm))

        story.append(_p("המלצה", heading_style))
        story.append(_p(str(briefing.get("recommendation", "—")), body))
        story.append(Spacer(1, 0.3 * cm))
        story.append(_p("אסטרטגיית Engagement", heading_style))
        story.append(_p(str(briefing.get("engagement_strategy", "—")), body))

        evidence = briefing.get("evidence") or []
        if evidence:
            story.append(Spacer(1, 0.4 * cm))
            story.append(_p("שרשרת ראיות", heading_style))
            for item in evidence[:12]:
                story.append(_p(f"• {item}", body))

        cluster = briefing.get("network_cluster") or {}
        story.append(Spacer(1, 0.4 * cm))
        story.append(_p("Network Cluster", heading_style))
        story.append(
            _p(
                f"גודל cluster: {cluster.get('size', 0)} | hubs: {cluster.get('hub_count', 0)}",
                body,
            )
        )
        for node in (cluster.get("cluster") or [])[:8]:
            if isinstance(node, dict):
                story.append(
                    _p(
                        f"• {node.get('entity', 'node')} via {node.get('via', '—')} ({node.get('relation', 'link')})",
                        body,
                    )
                )

        timeline = briefing.get("timeline") or []
        if timeline:
            story.append(Spacer(1, 0.4 * cm))
            story.append(_p("Timeline", heading_style))
            for snap in timeline[-5:]:
                if isinstance(snap, dict):
                    story.append(
                        _p(
                            f"• {snap.get('ts', '—')}: composite {snap.get('composite', '—')} tier {snap.get('tier', '—')}",
                            body,
                        )
                    )

        story.append(Spacer(1, 0.6 * cm))
        story.append(_p(f"Distribution: {self.classification} — authorized personnel only.", meta))

        doc.build(story)
        return buffer.getvalue()


def generate_briefing_pdf(
    name: str,
    briefing: dict[str, Any],
    pipeline: EnrichmentPipeline,
    classification: str = "CONFIDENTIAL",
) -> bytes:
    generator = BriefingPDF(classification=classification)
    return generator.render(name, briefing, pipeline)
