"""BlackOpps OSINT intelligence module."""

from app.intelligence.auth import AuthMiddleware, RateLimiter, SecurityHeadersMiddleware
from app.intelligence.entity import resolve_entity
from app.intelligence.gotv import GOTVPredictor, GOTVProfile, VoterCategory, gotv_battleplan
from app.intelligence.opposition import ComparisonResult, OppositionResearch, comparison_to_dict
from app.intelligence.pdf_generator import BriefingPDF, generate_briefing_pdf
from app.intelligence.pipeline import EnrichmentPipeline
from app.intelligence.scoring import InfluenceProfile, InfluenceScorer

__all__ = [
    "AuthMiddleware",
    "BriefingPDF",
    "ComparisonResult",
    "EnrichmentPipeline",
    "GOTVProfile",
    "GOTVPredictor",
    "InfluenceProfile",
    "InfluenceScorer",
    "OppositionResearch",
    "RateLimiter",
    "SecurityHeadersMiddleware",
    "VoterCategory",
    "comparison_to_dict",
    "generate_briefing_pdf",
    "gotv_battleplan",
    "resolve_entity",
]
