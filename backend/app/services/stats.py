"""Dashboard figures, computed from the rows that exist.

Nothing is estimated or seeded: an empty account shows zeros.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import Execution, ExecutionStatus, Workflow

SERIES_HOURS = 24


def _hour_bucket(db: Session):
    """Truncate to the hour, portably: SQLite has no date_trunc."""
    if db.bind.dialect.name == "sqlite":
        return func.strftime("%Y-%m-%dT%H:00:00", Execution.started_at)
    return func.to_char(
        func.date_trunc("hour", Execution.started_at), 'YYYY-MM-DD"T"HH24:00:00'
    )


def overview(db: Session, user_id: int) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    series_start = (now - timedelta(hours=SERIES_HOURS - 1)).replace(
        minute=0, second=0, microsecond=0
    )

    def count(*conditions) -> int:
        return db.execute(
            select(func.count()).select_from(Execution)
            .where(Execution.user_id == user_id, *conditions)
        ).scalar_one()

    total = count()
    succeeded = count(Execution.status == ExecutionStatus.SUCCESS.value)
    failed = count(Execution.status == ExecutionStatus.FAILED.value)
    avg_ms = db.execute(
        select(func.avg(Execution.duration_ms)).where(Execution.user_id == user_id)
    ).scalar_one()

    bucket = _hour_bucket(db)
    rows = db.execute(
        select(
            bucket.label("bucket"),
            func.count().label("total"),
            func.sum(
                case((Execution.status == ExecutionStatus.FAILED.value, 1), else_=0)
            ).label("failed"),
        )
        .where(Execution.user_id == user_id, Execution.started_at >= series_start)
        .group_by("bucket")
        .order_by("bucket")
    ).all()
    counted = {row.bucket: (row.total, int(row.failed or 0)) for row in rows}

    series = []
    for offset in range(SERIES_HOURS):
        moment = series_start + timedelta(hours=offset)
        label = moment.strftime("%Y-%m-%dT%H:00:00")
        hits, errors = counted.get(label, (0, 0))
        series.append({"bucket": label, "total": hits, "failed": errors})

    workflows_total = db.execute(
        select(func.count()).select_from(Workflow).where(Workflow.user_id == user_id)
    ).scalar_one()
    workflows_active = db.execute(
        select(func.count()).select_from(Workflow)
        .where(Workflow.user_id == user_id, Workflow.enabled.is_(True))
    ).scalar_one()

    return {
        "workflows": workflows_total,
        "active_workflows": workflows_active,
        "executions_total": total,
        "executions_today": count(Execution.started_at >= start_of_day),
        "succeeded": succeeded,
        "failed": failed,
        "success_rate": round(succeeded / total * 100, 1) if total else None,
        "avg_duration_ms": int(avg_ms) if avg_ms is not None else None,
        "series": series,
    }
