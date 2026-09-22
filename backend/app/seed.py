"""Demo data: ``python -m app.seed``.

Creates one clearly marked demo account with three workflows and then *runs*
them against a local sink, so the executions in the dashboard are real rows
produced by the real engine. Nothing is inserted into the executions table by
hand, and the account is flagged ``is_demo`` so the UI can say what it is.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any

import httpx

from app.actions.registry import encrypt_config, validate_config
from app.core.security import generate_workflow_token, hash_password
from app.db.session import SessionLocal, init_db
from app.models import User, Workflow
from app.services.engine import run_execution, start_execution
from app.services.http_client import set_transport

DEMO_EMAIL = "demo@nexaflow.dev"
DEMO_PASSWORD = "nexaflow-demo-1234"

WORKFLOWS: list[dict[str, Any]] = [
    {
        "name": "Lead notifications",
        "description": "Website form submissions land in the sales channel.",
        "action_type": "discord",
        "action_config": {
            "webhook_url": "https://discord.com/api/webhooks/000000000000000000/demo-seed-token",
            "message_template": (
                "**New lead** — {{name}}\nEmail: {{email}}\nPlan interest: {{plan}}"
            ),
        },
        "payloads": [
            {"name": "Alex Rivera", "email": "alex@example.com", "plan": "developer"},
            {"name": "Sam Okafor", "email": "sam@example.com", "plan": "pro"},
            {"name": "Priya Raman", "email": "priya@example.com", "plan": "free"},
        ],
    },
    {
        "name": "Order processing",
        "description": "Shop webhook, reshaped and forwarded to the billing API.",
        "action_type": "http",
        "action_config": {
            "method": "POST",
            "url": "https://example.com/v1/orders",
            "headers": {"Authorization": "Bearer demo-seed-token"},
            "body_template": '{"order": "{{id}}", "total": {{total}}, "currency": "{{currency}}"}',
        },
        "transform_template": (
            '{"id": "{{order.id}}", "total": {{order.amount}}, "currency": "{{order.currency}}"}'
        ),
        "payloads": [
            {"order": {"id": "A-1042", "amount": 129.5, "currency": "EUR"}},
            {"order": {"id": "A-1043", "amount": 49.99, "currency": "EUR"}},
            {"order": {"id": "A-1044", "amount": 12.0, "currency": "EUR"}},
        ],
    },
    {
        "name": "Uptime alerts",
        "description": "Monitoring webhook to the on-call Telegram chat.",
        "action_type": "telegram",
        "action_config": {
            "bot_token": "000000000:demo-seed-token-not-a-real-bot",
            "chat_id": "-1001234567890",
            "message_template": "🚨 {{service}} is {{status}} ({{region}})",
        },
        "payloads": [
            {"service": "checkout-api", "status": "degraded", "region": "eu-central"},
            {"service": "checkout-api", "status": "recovered", "region": "eu-central"},
        ],
    },
]


def _demo_transport() -> httpx.MockTransport:
    """Answers every outbound call locally.

    The seed must not send traffic to Discord or Telegram with fake tokens, so
    demo runs talk to this instead. The SSRF guard still runs, which means the
    configured hosts have to resolve — seeding without DNS records those runs
    as failures, honestly. One call is failed on purpose: a dashboard
    where nothing ever fails is not a useful demo.
    """
    state = {"calls": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        state["calls"] += 1
        # Calls 6-8 fail on purpose: that is one execution exhausting all three
        # attempts, so the demo shows a failed run and the retry ladder rather
        # than a dashboard where nothing ever goes wrong.
        if state["calls"] in (6, 7, 8):
            return httpx.Response(503, text="Service temporarily unavailable")
        # Each destination answers the way the real one does, so the adapters
        # take the same branch they would in production.
        host = request.url.host
        if host == "api.telegram.org":
            return httpx.Response(200, json={"ok": True, "result": {"message_id": state["calls"]}})
        if host.endswith("discord.com"):
            return httpx.Response(204)
        return httpx.Response(200, json={"ok": True, "received": True})

    return httpx.MockTransport(handler)


async def seed(reset: bool) -> int:
    init_db()
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).one_or_none()
        if existing and not reset:
            print(f"Demo account already exists: {DEMO_EMAIL}")
            print("Re-run with --reset to rebuild it.")
            return 0
        if existing:
            db.delete(existing)
            db.commit()

        user = User(
            email=DEMO_EMAIL,
            name="Demo Account",
            password_hash=hash_password(DEMO_PASSWORD),
            is_demo=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        created: list[tuple[Workflow, list[dict]]] = []
        for spec in WORKFLOWS:
            config = validate_config(spec["action_type"], spec["action_config"])
            workflow = Workflow(
                user_id=user.id,
                name=spec["name"],
                description=spec["description"],
                action_type=spec["action_type"],
                action_config=encrypt_config(spec["action_type"], config),
                transform_template=spec.get("transform_template"),
                token=generate_workflow_token(),
            )
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
            created.append((workflow, spec["payloads"]))

        set_transport(_demo_transport())
        try:
            for workflow, payloads in created:
                for payload in payloads:
                    execution = start_execution(db, workflow, payload)
                    await run_execution(execution.id)
        finally:
            set_transport(None)

    print("Demo data ready.")
    print(f"  email:    {DEMO_EMAIL}")
    print(f"  password: {DEMO_PASSWORD}")
    print(f"  workflows: {len(WORKFLOWS)}")
    print(
        "\nThe account is flagged is_demo. Its executions are real runs of the real\n"
        "engine against a local sink — no rows were fabricated."
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="Rebuild the demo account.")
    args = parser.parse_args()
    return asyncio.run(seed(args.reset))


if __name__ == "__main__":
    sys.exit(main())
