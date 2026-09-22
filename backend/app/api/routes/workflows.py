"""Workflow CRUD, test runs and per-workflow execution history."""

from __future__ import annotations

import json

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.actions.registry import (
    ConfigError,
    encrypt_config,
    redact_config,
    validate_config,
)
from app.api.deps import get_current_user, get_owned_workflow
from app.core.config import settings
from app.core.errors import APIError
from app.core.security import generate_signing_secret, generate_workflow_token
from app.db.session import get_db
from app.models import Execution, User, Workflow
from app.schemas.execution import (
    ExecutionOut,
    ExecutionPage,
    ExecutionWithWorkflow,
    TriggerAccepted,
)
from app.schemas.workflow import (
    TestRunRequest,
    WorkflowCreate,
    WorkflowDetail,
    WorkflowOut,
    WorkflowUpdate,
)
from app.services.engine import run_execution, start_execution
from app.services.transform import TransformError, validate_template

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


def webhook_url(workflow: Workflow) -> str:
    return f"{settings.public_api_url}/hooks/{workflow.token}"


def curl_example(workflow: Workflow) -> str:
    sample = json.dumps({"order_id": 1024, "customer": "Alex", "amount": 49.99})
    return (
        f"curl -X POST {webhook_url(workflow)} \\\n"
        f"  -H 'Content-Type: application/json' \\\n"
        f"  -d '{sample}'"
    )


def to_out(db: Session, workflow: Workflow, model=WorkflowOut, **extra):
    count, last = db.execute(
        select(func.count(Execution.id), func.max(Execution.started_at))
        .where(Execution.workflow_id == workflow.id)
    ).one()
    last_status = db.execute(
        select(Execution.status)
        .where(Execution.workflow_id == workflow.id)
        .order_by(Execution.started_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    return model(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        trigger_type=workflow.trigger_type,
        action_type=workflow.action_type,
        action_config=redact_config(workflow.action_type, workflow.action_config),
        transform_template=workflow.transform_template,
        enabled=workflow.enabled,
        signature_required=workflow.signing_secret is not None,
        webhook_url=webhook_url(workflow),
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        executions=count or 0,
        last_execution_at=last,
        last_status=last_status,
        **extra,
    )


@router.get("", response_model=list[WorkflowOut], summary="List workflows")
def list_workflows(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[WorkflowOut]:
    workflows = db.execute(
        select(Workflow).where(Workflow.user_id == user.id).order_by(Workflow.created_at.desc())
    ).scalars().all()
    return [to_out(db, workflow) for workflow in workflows]


@router.post("", response_model=WorkflowDetail, status_code=201, summary="Create a workflow")
def create_workflow(
    payload: WorkflowCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkflowDetail:
    total = db.execute(
        select(func.count()).select_from(Workflow).where(Workflow.user_id == user.id)
    ).scalar_one()
    if total >= settings.max_workflows_per_user:
        raise APIError(
            "workflow_limit_reached",
            f"This account is limited to {settings.max_workflows_per_user} workflows.",
            409,
        )

    try:
        config = validate_config(payload.action_type, payload.action_config)
    except ConfigError as exc:
        raise APIError("invalid_action_config", str(exc), 422) from exc

    if payload.transform_template:
        try:
            validate_template(payload.transform_template)
        except TransformError as exc:
            raise APIError("invalid_transform", str(exc), 422) from exc

    signing_secret = generate_signing_secret() if payload.require_signature else None
    workflow = Workflow(
        user_id=user.id,
        name=payload.name,
        description=payload.description,
        trigger_type=payload.trigger_type,
        action_type=payload.action_type,
        action_config=encrypt_config(payload.action_type, config),
        transform_template=payload.transform_template,
        token=generate_workflow_token(),
        signing_secret=signing_secret,
        enabled=payload.enabled,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    # The signing secret is shown here and never again.
    return to_out(
        db, workflow, WorkflowDetail,
        signing_secret=signing_secret, curl_example=curl_example(workflow),
    )


@router.get("/{workflow_id}", response_model=WorkflowDetail, summary="Workflow detail")
def get_workflow(
    workflow: Workflow = Depends(get_owned_workflow), db: Session = Depends(get_db)
) -> WorkflowDetail:
    return to_out(
        db, workflow, WorkflowDetail, signing_secret=None, curl_example=curl_example(workflow)
    )


@router.patch("/{workflow_id}", response_model=WorkflowOut, summary="Update a workflow")
def update_workflow(
    payload: WorkflowUpdate,
    workflow: Workflow = Depends(get_owned_workflow),
    db: Session = Depends(get_db),
) -> WorkflowOut:
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise APIError("nothing_to_update", "No fields to update.", 400)

    if "action_config" in changes:
        try:
            config = validate_config(workflow.action_type, changes["action_config"])
        except ConfigError as exc:
            raise APIError("invalid_action_config", str(exc), 422) from exc
        workflow.action_config = encrypt_config(workflow.action_type, config)
    if "transform_template" in changes:
        template = changes["transform_template"]
        if template:
            try:
                validate_template(template)
            except TransformError as exc:
                raise APIError("invalid_transform", str(exc), 422) from exc
        workflow.transform_template = template or None
    for field in ("name", "description", "enabled"):
        if field in changes:
            setattr(workflow, field, changes[field])
    if "require_signature" in changes:
        workflow.signing_secret = (
            workflow.signing_secret or generate_signing_secret()
            if changes["require_signature"]
            else None
        )

    db.commit()
    db.refresh(workflow)
    return to_out(db, workflow)


@router.delete("/{workflow_id}", status_code=204, summary="Delete a workflow")
def delete_workflow(
    workflow: Workflow = Depends(get_owned_workflow), db: Session = Depends(get_db)
) -> Response:
    db.delete(workflow)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{workflow_id}/test",
    response_model=TriggerAccepted,
    status_code=202,
    summary="Run the workflow with a sample payload",
)
def test_workflow(
    payload: TestRunRequest,
    background: BackgroundTasks,
    workflow: Workflow = Depends(get_owned_workflow),
    db: Session = Depends(get_db),
) -> TriggerAccepted:
    """Runs the real pipeline — the execution is marked as a test, not faked."""
    execution = start_execution(db, workflow, payload.payload, is_test=True)
    background.add_task(run_execution, execution.id)
    return TriggerAccepted(execution_id=execution.id, workflow=workflow.name)


@router.get(
    "/{workflow_id}/executions",
    response_model=ExecutionPage,
    summary="Execution history for one workflow",
)
def workflow_executions(
    workflow: Workflow = Depends(get_owned_workflow),
    db: Session = Depends(get_db),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> ExecutionPage:
    items = db.execute(
        select(Execution)
        .where(Execution.workflow_id == workflow.id)
        .order_by(Execution.started_at.desc(), Execution.id.desc())
        .offset(offset).limit(limit)
    ).scalars().all()
    total = db.execute(
        select(func.count()).select_from(Execution).where(Execution.workflow_id == workflow.id)
    ).scalar_one()

    return ExecutionPage(
        items=[
            ExecutionWithWorkflow(
                **ExecutionOut.model_validate(item).model_dump(),
                workflow_name=workflow.name,
                action_type=workflow.action_type,
            )
            for item in items
        ],
        total=total, limit=limit, offset=offset,
    )
