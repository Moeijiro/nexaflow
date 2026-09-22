"""Authentication and ownership.

The dashboard authenticates with an HttpOnly session cookie; scripts can send
``X-API-Key`` instead. Both resolve to the same user through one dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, Header, Path, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import APIError
from app.core.security import (
    API_KEY_HEADER,
    SESSION_COOKIE_NAME,
    hash_api_key,
    read_access_token,
)
from app.db.session import get_db
from app.models import APIKey, User, Workflow

UNAUTHENTICATED = APIError(
    "unauthenticated", "Sign in to continue.", status.HTTP_401_UNAUTHORIZED
)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias=API_KEY_HEADER),
) -> User:
    user = _from_api_key(db, x_api_key) if x_api_key else _from_cookie(db, request)
    if user is None or not user.is_active:
        raise UNAUTHENTICATED
    return user


def _from_cookie(db: Session, request: Request) -> User | None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    payload = read_access_token(token)
    if not payload:
        return None
    return db.get(User, int(payload["sub"]))


def _from_api_key(db: Session, raw_key: str) -> User | None:
    """Looked up by digest — the raw key is never stored."""
    api_key = db.execute(
        select(APIKey).where(APIKey.hashed_key == hash_api_key(raw_key))
    ).scalar_one_or_none()
    if api_key is None or not api_key.active:
        return None
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return api_key.user


def get_owned_workflow(
    workflow_id: int = Path(ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Workflow:
    """A workflow the caller owns, or 404 — never a hint that it exists."""
    workflow = db.get(Workflow, workflow_id)
    if workflow is None or workflow.user_id != user.id:
        raise APIError("not_found", "Workflow not found.", status.HTTP_404_NOT_FOUND)
    return workflow
