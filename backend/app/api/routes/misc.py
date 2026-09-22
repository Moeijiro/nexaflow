"""Integrations catalogue, dashboard statistics and health."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.actions.registry import ACTIONS, describe_actions
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.schemas.api_key import StatsOut
from app.services import stats

router = APIRouter(prefix="/api", tags=["platform"])

# Integrations that are visible but not implemented. Listed separately so the
# UI can label them honestly rather than implying they work.
PLANNED = [
    {"type": "slack", "label": "Slack", "description": "Post to a Slack channel.",
     "category": "messaging", "status": "planned"},
    {"type": "email", "label": "Email", "description": "Send a templated email.",
     "category": "messaging", "status": "planned"},
    {"type": "sheets", "label": "Google Sheets", "description": "Append a row to a sheet.",
     "category": "data", "status": "planned"},
]


@router.get("/integrations", summary="Available and planned integrations")
def integrations() -> dict[str, object]:
    """Built from the action registry, so the site cannot drift from the code."""
    available = describe_actions()
    return {
        "available": available,
        "planned": PLANNED,
        "counts": {"available": len(available), "planned": len(PLANNED)},
    }


@router.get("/stats", response_model=StatsOut, summary="Dashboard figures")
def dashboard_stats(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> StatsOut:
    return StatsOut(**stats.overview(db, user.id))


@router.get("/health", summary="Liveness")
def health(db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        db.execute(text("SELECT 1"))
        database_ok = True
    except Exception:  # pragma: no cover - only on a broken DB
        database_ok = False
    return {
        "status": "ok" if database_ok else "degraded",
        "database": "ok" if database_ok else "unavailable",
        "environment": settings.environment,
        "actions": sorted(ACTIONS),
    }
