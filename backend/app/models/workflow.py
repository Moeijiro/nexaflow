"""A workflow: one trigger, an optional transform, one action."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, utcnow

if TYPE_CHECKING:
    from app.models.execution import Execution
    from app.models.user import User


class TriggerType(StrEnum):
    INCOMING_WEBHOOK = "incoming_webhook"


class ActionType(StrEnum):
    DISCORD = "discord"
    TELEGRAM = "telegram"
    HTTP = "http"


class Workflow(Base, TimestampMixin):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(String(200), default=None)
    trigger_type: Mapped[str] = mapped_column(String(32), default=TriggerType.INCOMING_WEBHOOK)
    action_type: Mapped[str] = mapped_column(String(32))

    # Adapter settings. Credentials are encrypted at rest and never returned.
    action_config: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # Optional step between trigger and action: a JSON template rendered from
    # the incoming payload. When set, its result is what the action receives.
    transform_template: Mapped[str | None] = mapped_column(Text, default=None)

    # 32 bytes of entropy: the webhook URL is this workflow's credential.
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    signing_secret: Mapped[str | None] = mapped_column(String(128), default=None)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped["User"] = relationship(back_populates="workflows")
    executions: Mapped[list["Execution"]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan"
    )
