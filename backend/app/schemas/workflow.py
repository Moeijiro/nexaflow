from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.schemas.common import utc_iso

ActionLiteral = Literal["discord", "telegram", "http"]


class WorkflowCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=200)
    action_type: ActionLiteral
    action_config: dict[str, Any]
    transform_template: str | None = Field(default=None, max_length=8000)
    enabled: bool = True
    trigger_type: Literal["incoming_webhook"] = "incoming_webhook"
    require_signature: bool = False


class WorkflowUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=200)
    action_config: dict[str, Any] | None = None
    transform_template: str | None = Field(default=None, max_length=8000)
    enabled: bool | None = None
    require_signature: bool | None = None


class WorkflowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    trigger_type: str
    action_type: str
    action_config: dict[str, Any]     # secrets redacted
    transform_template: str | None
    enabled: bool
    signature_required: bool
    webhook_url: str
    created_at: datetime
    updated_at: datetime
    executions: int = 0
    last_execution_at: datetime | None = None
    last_status: str | None = None

    @field_serializer("created_at", "updated_at", "last_execution_at")
    def _as_utc(self, value: datetime | None) -> str | None:
        return utc_iso(value)


class WorkflowDetail(WorkflowOut):
    """Adds what is only ever shown once, plus a ready-to-run example."""

    signing_secret: str | None = None
    curl_example: str


class TestRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payload: dict[str, Any] = Field(
        default_factory=lambda: {"order_id": 1024, "customer": "Alex", "amount": 49.99}
    )
