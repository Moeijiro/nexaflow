"""The public webhook endpoint: ``POST /hooks/{token}``.

The token is the credential, so this route stays thin and strict: size limit,
JSON parse, workflow lookup, optional HMAC, then hand off to a background task
and answer 202 with the execution id.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Header, Path, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import APIError
from app.core.rate_limit import RateLimiter
from app.core.security import verify_body_signature
from app.db.session import get_db
from app.models import Workflow
from app.schemas.execution import TriggerAccepted
from app.services.engine import run_execution, start_execution

logger = logging.getLogger("nexaflow.hooks")
router = APIRouter(prefix="/hooks", tags=["webhook trigger"])

# Per token, not per IP: one noisy integration must not throttle the others.
hook_limit = RateLimiter(times=120, seconds=60, scope="hook")


@router.post(
    "/{token}",
    response_model=TriggerAccepted,
    status_code=202,
    summary="Trigger a workflow",
    responses={
        401: {"description": "Signature required or invalid"},
        404: {"description": "No workflow for this token"},
        409: {"description": "Workflow is paused"},
        413: {"description": "Payload too large"},
        422: {"description": "Body is not valid JSON"},
    },
)
async def trigger(
    request: Request,
    background: BackgroundTasks,
    token: str = Path(min_length=16, max_length=64),
    signature: str | None = Header(default=None, alias="X-Signature-256"),
    db: Session = Depends(get_db),
) -> TriggerAccepted:
    hook_limit.check(f"hook:{token[:16]}")

    raw = await request.body()
    if len(raw) > settings.max_payload_bytes:
        raise APIError(
            "payload_too_large", f"Payload exceeds {settings.max_payload_bytes} bytes.", 413
        )

    workflow = db.execute(select(Workflow).where(Workflow.token == token)).scalar_one_or_none()
    if workflow is None:
        raise APIError("unknown_workflow", "No workflow for this token.", 404)
    if not workflow.enabled:
        raise APIError("workflow_paused", "This workflow is paused.", 409)

    # Verified over the exact bytes received, before parsing.
    if workflow.signing_secret and not verify_body_signature(
        raw, workflow.signing_secret, signature
    ):
        raise APIError(
            "invalid_signature", "Missing or invalid X-Signature-256 header.", 401
        )

    try:
        payload = json.loads(raw or b"{}")
    except json.JSONDecodeError as exc:
        raise APIError("invalid_json", f"Body must be JSON: {exc.msg}", 422) from exc
    if not isinstance(payload, (dict, list)):
        raise APIError("invalid_json", "Body must be a JSON object or array.", 422)

    execution = start_execution(db, workflow, payload)
    background.add_task(run_execution, execution.id)
    logger.info("Queued execution %s for workflow %s", execution.id, workflow.id)

    return TriggerAccepted(execution_id=execution.id, workflow=workflow.name)
