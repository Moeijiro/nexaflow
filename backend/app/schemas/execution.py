from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer

from app.schemas.common import utc_iso


class ExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    status: str
    attempts: int
    is_test: bool
    started_at: datetime
    finished_at: datetime | None
    duration_ms: int | None
    trigger_payload: dict[str, Any] | None
    transformed_payload: dict[str, Any] | None
    action_result: dict[str, Any] | None
    error: str | None

    @field_serializer("started_at", "finished_at")
    def _as_utc(self, value: datetime | None) -> str | None:
        return utc_iso(value)


class ExecutionWithWorkflow(ExecutionOut):
    workflow_name: str
    action_type: str


class ExecutionPage(BaseModel):
    items: list[ExecutionWithWorkflow]
    total: int
    limit: int
    offset: int


class TriggerAccepted(BaseModel):
    accepted: bool = True
    execution_id: int
    workflow: str
    status: str = "processing"
