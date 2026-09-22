"""Authentication and the ownership boundary between accounts."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import PASSWORD

PROTECTED = ["/api/auth/me", "/api/workflows", "/api/executions", "/api/keys", "/api/stats"]


@pytest.mark.parametrize("path", PROTECTED)
def test_management_routes_require_a_session(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


def test_register_issues_an_httponly_session(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register", json={"email": " Dev@Example.COM ", "password": PASSWORD}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "dev@example.com"
    assert "HttpOnly" in response.headers["set-cookie"]
    assert client.get("/api/auth/me").status_code == 200


def test_password_is_hashed_with_scrypt(auth_client: TestClient) -> None:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import User

    with SessionLocal() as db:
        user = db.execute(select(User)).scalar_one()
    assert user.password_hash.startswith("scrypt$")
    assert PASSWORD not in user.password_hash


def test_login_answers_the_same_for_both_failures(auth_client: TestClient) -> None:
    wrong = auth_client.post(
        "/api/auth/login", json={"email": "dev@example.com", "password": "not-it-at-all"}
    )
    unknown = auth_client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": PASSWORD}
    )
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_logout_clears_the_session(auth_client: TestClient) -> None:
    assert auth_client.post("/api/auth/logout").status_code == 204
    auth_client.cookies.clear()
    assert auth_client.get("/api/auth/me").status_code == 401


def test_another_account_cannot_reach_the_workflow(
    auth_client: TestClient, make_workflow
) -> None:
    workflow = make_workflow()
    auth_client.post("/api/auth/logout")
    auth_client.cookies.clear()
    auth_client.post(
        "/api/auth/register", json={"email": "other@example.com", "password": PASSWORD}
    )

    # 404, not 403: the API does not confirm that the id exists.
    assert auth_client.get(f"/api/workflows/{workflow['id']}").status_code == 404
    assert auth_client.delete(f"/api/workflows/{workflow['id']}").status_code == 404
    assert auth_client.patch(
        f"/api/workflows/{workflow['id']}", json={"enabled": False}
    ).status_code == 404
    assert auth_client.get("/api/workflows").json() == []


def test_executions_are_scoped_to_the_account(
    auth_client: TestClient, make_workflow, outbound
) -> None:
    from tests.conftest import token_of

    workflow = make_workflow()
    auth_client.post(f"/hooks/{token_of(workflow)}", json={"order_id": 1})
    assert auth_client.get("/api/executions").json()["total"] == 1

    auth_client.post("/api/auth/logout")
    auth_client.cookies.clear()
    auth_client.post(
        "/api/auth/register", json={"email": "other@example.com", "password": PASSWORD}
    )
    assert auth_client.get("/api/executions").json()["total"] == 0
