"""Shared serialisation helpers."""

from __future__ import annotations

from datetime import datetime, timezone


def utc_iso(value: datetime | None) -> str | None:
    """Serialise as explicit UTC.

    SQLite hands back naive datetimes that are UTC; without a zone a browser
    reads them as local time, and "just now" becomes "3 hours ago".
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()
