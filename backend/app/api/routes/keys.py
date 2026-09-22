"""API key management. The raw key is returned exactly once."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.errors import APIError
from app.core.security import generate_api_key
from app.db.session import get_db
from app.models import APIKey, User
from app.schemas.api_key import APIKeyCreate, APIKeyCreated, APIKeyOut

router = APIRouter(prefix="/api/keys", tags=["api keys"])


def _owned(db: Session, user: User, key_id: int) -> APIKey:
    key = db.get(APIKey, key_id)
    if key is None or key.user_id != user.id:
        raise APIError("not_found", "API key not found.", 404)
    return key


@router.get("", response_model=list[APIKeyOut], summary="List API keys")
def list_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(
        db.execute(
            select(APIKey).where(APIKey.user_id == user.id).order_by(APIKey.created_at.desc())
        ).scalars().all()
    )


@router.post("", response_model=APIKeyCreated, status_code=201, summary="Create an API key")
def create_key(
    payload: APIKeyCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIKeyCreated:
    active = db.execute(
        select(APIKey).where(APIKey.user_id == user.id, APIKey.enabled.is_(True))
    ).scalars().all()
    if len(active) >= settings.max_keys_per_user:
        raise APIError(
            "key_limit_reached",
            f"You already have {settings.max_keys_per_user} active keys. Revoke one first.",
            409,
        )

    raw, prefix, digest = generate_api_key()
    key = APIKey(user_id=user.id, name=payload.name, prefix=prefix, hashed_key=digest)
    db.add(key)
    db.commit()
    db.refresh(key)

    # `raw` is not stored anywhere: this response is the only place it exists.
    return APIKeyCreated(
        id=key.id, name=key.name, prefix=key.prefix, enabled=True,
        created_at=key.created_at, last_used_at=None, revoked_at=None, key=raw,
    )


@router.post("/{key_id}/revoke", response_model=APIKeyOut, summary="Revoke a key")
def revoke_key(
    key_id: int = Path(ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIKey:
    key = _owned(db, user, key_id)
    if not key.active:
        raise APIError("already_revoked", "This key is already revoked.", 409)
    key.revoke()
    db.commit()
    db.refresh(key)
    return key


@router.delete("/{key_id}", status_code=204, summary="Delete a key")
def delete_key(
    key_id: int = Path(ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    db.delete(_owned(db, user, key_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
