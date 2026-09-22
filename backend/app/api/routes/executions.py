"""Execution history across all workflows."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.errors import APIError
from app.db.session import get_db
from app.models import Execution, User, Workflow
from app.schemas.execution import ExecutionOut, ExecutionPage, ExecutionWithWorkflow

router = APIRouter(prefix="/api/executions", tags=["executions"])


def _join(db: Session, user_id: int, *conditions):
    return (
        select(Execution, Workflow.name, Workflow.action_type)
        .join(Workflow, Workflow.id == Execution.workflow_id)
        .where(Execution.user_id == user_id, *conditions)
    )


@router.get("", response_model=ExecutionPage, summary="Recent executions")
def list_executions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: str | None = Query(default=None, alias="status", max_length=16),
    workflow_id: int | None = Query(default=None, ge=1),
) -> ExecutionPage:
    conditions = []
    if status_filter:
        conditions.append(Execution.status == status_filter)
    if workflow_id:
        conditions.append(Execution.workflow_id == workflow_id)

    rows = db.execute(
        _join(db, user.id, *conditions)
        .order_by(Execution.started_at.desc(), Execution.id.desc())
        .offset(offset).limit(limit)
    ).all()
    total = db.execute(
        select(func.count()).select_from(Execution)
        .where(Execution.user_id == user.id, *conditions)
    ).scalar_one()

    return ExecutionPage(
        items=[_serialise(row) for row in rows], total=total, limit=limit, offset=offset
    )


@router.get("/{execution_id}", response_model=ExecutionWithWorkflow, summary="Execution detail")
def get_execution(
    execution_id: int = Path(ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExecutionWithWorkflow:
    row = db.execute(_join(db, user.id, Execution.id == execution_id)).first()
    if row is None:
        raise APIError("not_found", "Execution not found.", 404)
    return _serialise(row)


def _serialise(row) -> ExecutionWithWorkflow:  # noqa: ANN001
    """The row is (Execution, workflow name, action type) from one join."""
    execution, name, action_type = row
    return ExecutionWithWorkflow(
        **ExecutionOut.model_validate(execution).model_dump(),
        workflow_name=name,
        action_type=action_type,
    )
