"""API keys: shown once, stored hashed, usable instead of the session."""

from __future__ import annotations

from fastapi.testclient import TestClient


def create_key(client: TestClient, name: str = "CI pipeline") -> dict:
    response = client.post("/api/keys", json={"name": name})
    assert response.status_code == 201
    return response.json()


def test_the_raw_key_is_returned_once(auth_client: TestClient) -> None:
    created = create_key(auth_client)
    assert created["key"].startswith("nxf_live_")
    assert created["prefix"] == created["key"][:15]

    listed = auth_client.get("/api/keys").json()[0]
    assert "key" not in listed
    assert listed["prefix"] == created["prefix"]


def test_only_a_digest_is_stored(auth_client: TestClient) -> None:
    import hashlib

    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import APIKey

    created = create_key(auth_client)
    with SessionLocal() as db:
        stored = db.execute(select(APIKey)).scalar_one()
    assert stored.hashed_key == hashlib.sha256(created["key"].encode()).hexdigest()


def test_a_key_authenticates_the_management_api(
    auth_client: TestClient, make_workflow
) -> None:
    make_workflow()
    created = create_key(auth_client)
    auth_client.cookies.clear()  # the key is now the only credential

    response = auth_client.get("/api/workflows", headers={"X-API-Key": created["key"]})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_a_revoked_key_stops_working(auth_client: TestClient) -> None:
    created = create_key(auth_client)
    assert auth_client.post(f"/api/keys/{created['id']}/revoke").status_code == 200

    auth_client.cookies.clear()
    assert auth_client.get(
        "/api/workflows", headers={"X-API-Key": created["key"]}
    ).status_code == 401


def test_keys_of_another_account_are_not_reachable(auth_client: TestClient) -> None:
    created = create_key(auth_client)
    auth_client.post("/api/auth/logout")
    auth_client.cookies.clear()
    auth_client.post(
        "/api/auth/register",
        json={"email": "other@example.com", "password": "correct-horse-battery"},
    )
    assert auth_client.delete(f"/api/keys/{created['id']}").status_code == 404
    assert auth_client.post(f"/api/keys/{created['id']}/revoke").status_code == 404


def test_the_integrations_catalogue_is_honest_about_what_works(
    auth_client: TestClient,
) -> None:
    catalogue = auth_client.get("/api/integrations").json()
    assert {item["type"] for item in catalogue["available"]} == {"discord", "telegram", "http"}
    assert all(item["status"] == "available" for item in catalogue["available"])
    assert all(item["status"] == "planned" for item in catalogue["planned"])
