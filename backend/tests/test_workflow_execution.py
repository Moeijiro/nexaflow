"""Webhook in, transform, action out, execution recorded."""

from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from tests.conftest import Outbound, token_of

PAYLOAD = {"order_id": 1024, "customer": "Alex", "amount": 49.99}


def test_a_successful_run_renders_the_template_and_logs_it(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow()

    response = auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)
    assert response.status_code == 202
    assert response.json()["execution_id"] > 0

    assert outbound.requests[-1].url.host == "discord.com"
    assert outbound.last_json["content"] == "New order #1024 from Alex"

    execution = auth_client.get("/api/executions").json()["items"][0]
    assert execution["status"] == "success"
    assert execution["attempts"] == 1
    assert execution["trigger_payload"] == PAYLOAD
    assert execution["transformed_payload"] is None
    assert execution["action_result"]["status_code"] == 204
    assert execution["duration_ms"] > 0
    assert execution["workflow_name"] == workflow["name"]


def test_the_transform_step_reshapes_the_payload_before_the_action(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow(
        transform_template='{"id": "{{order.id}}", "total": {{order.amount}}}',
        action_config={
            "webhook_url": "https://discord.com/api/webhooks/123456/token",
            "message_template": "Order {{id}} — {{total}}",
        },
    )

    auth_client.post(
        f"/hooks/{token_of(workflow)}", json={"order": {"id": "A-9", "amount": 12.5}}
    )

    assert outbound.last_json["content"] == "Order A-9 — 12.5"
    execution = auth_client.get("/api/executions").json()["items"][0]
    assert execution["transformed_payload"] == {"id": "A-9", "total": 12.5}


def test_an_invalid_transform_template_is_refused_at_save_time(
    auth_client: TestClient,
) -> None:
    response = auth_client.post(
        "/api/workflows",
        json={
            "name": "Broken",
            "action_type": "discord",
            "action_config": {
                "webhook_url": "https://discord.com/api/webhooks/1/t",
                "message_template": "x",
            },
            "transform_template": '{"id": {{order.id}}',  # missing brace
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_transform"


def test_a_failed_action_is_recorded_with_its_error(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow()
    outbound.queue(httpx.Response(400, text="Invalid Webhook Token"))

    auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)

    execution = auth_client.get("/api/executions").json()["items"][0]
    assert execution["status"] == "failed"
    assert execution["attempts"] == 1  # 400 is not retryable
    assert "400" in execution["error"]
    assert "Invalid Webhook Token" in execution["action_result"]["response"]


def test_a_retryable_failure_is_attempted_three_times(
    auth_client: TestClient, make_workflow, outbound: Outbound, monkeypatch
) -> None:
    monkeypatch.setattr("app.services.engine.BASE_BACKOFF_SECONDS", 0)
    workflow = make_workflow()
    outbound.queue(*(httpx.Response(502) for _ in range(3)))

    auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)

    execution = auth_client.get("/api/executions").json()["items"][0]
    assert execution["status"] == "failed"
    assert execution["attempts"] == 3
    assert len(outbound.requests) == 3


def test_a_paused_workflow_refuses_the_trigger(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow(enabled=False)

    response = auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "workflow_paused"
    assert outbound.requests == []
    assert auth_client.get("/api/executions").json()["total"] == 0


def test_an_unknown_token_is_a_404(client: TestClient) -> None:
    assert client.post("/hooks/" + "x" * 32, json=PAYLOAD).status_code == 404


def test_the_webhook_needs_no_session(
    client: TestClient, make_workflow, outbound: Outbound
) -> None:
    """The token is the credential; the caller is a third-party system."""
    workflow = make_workflow()
    client.cookies.clear()
    assert client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD).status_code == 202


def test_payload_limits_and_json_validation(auth_client: TestClient, make_workflow) -> None:
    workflow = make_workflow()
    url = f"/hooks/{token_of(workflow)}"

    not_json = auth_client.post(
        url, content=b"order_id=1", headers={"Content-Type": "application/json"}
    )
    assert not_json.status_code == 422
    assert auth_client.post(url, json={"blob": "x" * 70_000}).status_code == 413


def test_signed_workflows_require_a_valid_signature(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    import json

    from app.core.security import sign_body

    workflow = make_workflow(require_signature=True)
    secret = workflow["signing_secret"]
    assert secret  # shown once, at creation
    url = f"/hooks/{token_of(workflow)}"
    body = json.dumps(PAYLOAD).encode()
    headers = {"Content-Type": "application/json"}

    assert auth_client.post(url, content=body, headers=headers).status_code == 401
    assert auth_client.post(
        url, content=body, headers={**headers, "X-Signature-256": "sha256=deadbeef"}
    ).status_code == 401
    assert auth_client.post(
        url, content=body, headers={**headers, "X-Signature-256": sign_body(body, secret)}
    ).status_code == 202


def test_the_test_button_runs_the_real_pipeline(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow()

    response = auth_client.post(
        f"/api/workflows/{workflow['id']}/test", json={"payload": {"order_id": 7, "customer": "Zoe"}}
    )
    assert response.status_code == 202

    assert outbound.last_json["content"] == "New order #7 from Zoe"
    execution = auth_client.get("/api/executions").json()["items"][0]
    assert execution["is_test"] is True
    assert execution["status"] == "success"


def test_secrets_are_redacted_and_encrypted_at_rest(
    auth_client: TestClient, make_workflow
) -> None:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import Workflow
    from tests.conftest import DISCORD_CONFIG

    created = make_workflow()
    detail = auth_client.get(f"/api/workflows/{created['id']}").json()
    assert detail["action_config"]["webhook_url"] == "••••••••"
    assert DISCORD_CONFIG["webhook_url"] not in str(detail)

    with SessionLocal() as db:
        stored = db.execute(select(Workflow)).scalar_one()
    assert DISCORD_CONFIG["webhook_url"] not in str(stored.action_config)
    assert "__enc__" in stored.action_config["webhook_url"]


def test_stats_match_the_executions(
    auth_client: TestClient, make_workflow, outbound: Outbound
) -> None:
    workflow = make_workflow()
    for _ in range(2):
        auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)
    outbound.queue(httpx.Response(400))
    auth_client.post(f"/hooks/{token_of(workflow)}", json=PAYLOAD)

    stats = auth_client.get("/api/stats").json()
    assert stats["executions_total"] == 3
    assert stats["succeeded"] == 2
    assert stats["failed"] == 1
    assert stats["success_rate"] == 66.7
    assert stats["active_workflows"] == 1
    assert len(stats["series"]) == 24
    assert sum(point["total"] for point in stats["series"]) == 3
