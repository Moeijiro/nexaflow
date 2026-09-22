"""One place that creates outbound HTTP clients.

Tests install a mock transport here instead of patching each action.
"""

from __future__ import annotations

import httpx

from app.core.config import settings

_transport: httpx.AsyncBaseTransport | None = None


def set_transport(transport: httpx.AsyncBaseTransport | None) -> None:
    global _transport
    _transport = transport


def build_client(timeout: float | None = None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=timeout or settings.action_timeout_seconds,
        transport=_transport,
        follow_redirects=False,  # a redirect could escape the SSRF check
        headers={"User-Agent": "NexaFlow/1.0"},
    )
