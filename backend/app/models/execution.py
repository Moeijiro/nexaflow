"""One run of a workflow, from trigger to action result."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.workflow import Workflow


class ExecutionStatus(StrEnum):
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class Execution(Base):
    __tablename__ = "executions"
    __table_args__ = (
        Index("ix_executions_user_started", "user_id", "started_at"),
        Index("ix_executions_workflow_started", "workflow_id", "started_at"),
        Index("ix_executions_status_started", "status", "started_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    workflow_id: Mapped[int] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), index=True
    )

    status: Mapped[str] = mapped_column(String(16), default=ExecutionStatus.PROCESSING)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    # True when triggered from the dashboard's "Test" button rather than a webhook.
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    duration_ms: Mapped[int | None] = mapped_column(Integer, default=None)

    trigger_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    # What the transform step produced, when the workflow has one.
    transformed_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    action_result: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    error: Mapped[str | None] = mapped_column(Text, default=None)

    workflow: Mapped["Workflow"] = relationship(back_populates="executions")
