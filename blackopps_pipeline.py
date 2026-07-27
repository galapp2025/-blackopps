#!/usr/bin/env python3
"""BlackOpps offline GOTV pipeline — Excel import + classification + battle plan.

Usage:
  backend/.venv/bin/python3 blackopps_pipeline.py
  backend/.venv/bin/python3 blackopps_pipeline.py --file=petah_tikva.xlsx
  backend/.venv/bin/python3 blackopps_pipeline.py --skip-import
  backend/.venv/bin/python3 blackopps_pipeline.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.database import SessionLocal, engine  # noqa: E402
from app.intelligence.gotv import GOTVPredictor, gotv_battleplan  # noqa: E402
from app.models import Base, Voter  # noqa: E402
from app.services_voters import classify_db_voters, import_voters, parse_excel_voters  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="BlackOpps GOTV pipeline")
    parser.add_argument("--file", default="upload/file.xlsx", help="Excel path relative to repo root")
    parser.add_argument("--skip-import", action="store_true", help="Skip Excel import; classify DB only")
    parser.add_argument("--dry-run", action="store_true", help="Show battle plan without writing GOTV fields")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    predictor = GOTVPredictor()

    try:
        if not args.skip_import:
            path = ROOT / args.file
            if not path.is_file():
                # fallback demo names
                print(f"File not found: {path} — using demo roster")
                records = [
                    {"first_name": "ישראל", "last_name": "ישראלי", "city": "פתח תקווה", "support_score": 0.62},
                    {"first_name": "שרה", "last_name": "כהן", "city": "פתח תקווה", "support_score": 0.41},
                    {"first_name": "דוד", "last_name": "לוי", "city": "פתח תקווה", "support_score": 0.78},
                ]
            else:
                records = parse_excel_voters(path.read_bytes())
            if args.dry_run:
                print(json.dumps({"would_import": len(records), "sample": records[:3]}, ensure_ascii=False, indent=2))
            else:
                result = import_voters(db, records)
                print(json.dumps({"import": result}, ensure_ascii=False, indent=2))

        if args.dry_run:
            voters = db.query(Voter).all()
            payload = [
                {
                    "name": f"{v.first_name} {v.last_name}".strip(),
                    "support_score": v.support_score if v.support_score is not None else 0.5,
                    "turnout_history": v.turnout_history
                    if v.turnout_history is not None
                    else (v.turnout_score if v.turnout_score is not None else 0.55),
                }
                for v in voters
            ]
            profiles = predictor.classify_batch(payload)
            battle = gotv_battleplan(profiles)
            print(json.dumps({"classified": len(profiles), "battleplan": battle}, ensure_ascii=False, indent=2))
            return 0

        result = classify_db_voters(db, predictor)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
