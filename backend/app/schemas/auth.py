from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.schemas.common import utc_iso

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$")


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(max_length=320)
    password: str = Field(min_length=10, max_length=128)
    name: str | None = Field(default=None, max_length=80)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_RE.match(value):
            raise ValueError("must be a valid email address")
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(max_length=320)
    password: str = Field(max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    is_demo: bool
    created_at: datetime

    @field_serializer("created_at")
    def _as_utc(self, value: datetime) -> str | None:
        return utc_iso(value)
