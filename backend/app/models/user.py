"""Accounts."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.api_key import APIKey
    from app.models.workflow import Workflow


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(80), default=None)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Marks accounts created by `python -m app.seed`, so the UI can say so.
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    api_keys: Mapped[list["APIKey"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    workflows: Mapped[list["Workflow"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def display_name(self) -> str:
        return self.name or self.email.split("@")[0]
