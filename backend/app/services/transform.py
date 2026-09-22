"""The optional step between trigger and action.

A transform is a JSON template: the same ``{{path}}`` placeholders, rendered
against the incoming payload, parsed back into an object. Its result is what
the action then sees, and it is stored on the execution so the dashboard can
show the before and after.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.services.templating import PLACEHOLDER, render


class TransformError(ValueError):
    """The template did not produce valid JSON."""


@dataclass(slots=True)
class TransformResult:
    payload: Any
    missing: list[str]


def validate_template(template: str) -> None:
    """Check the shape at save time rather than on every execution.

    Every placeholder becomes ``0`` for the check, which is valid both bare
    (``{{amount}}``) and quoted (``"{{id}}"``), so only real JSON mistakes are
    rejected.
    """
    probe = PLACEHOLDER.sub("0", template)
    try:
        json.loads(probe)
    except json.JSONDecodeError as exc:
        raise TransformError(f"Transform template is not valid JSON: {exc.msg}") from exc


def apply_transform(template: str, payload: Any) -> TransformResult:
    rendered = render(template, payload, json_string=True)
    try:
        return TransformResult(payload=json.loads(rendered.text), missing=rendered.missing)
    except json.JSONDecodeError as exc:
        raise TransformError(f"Transform produced invalid JSON: {exc.msg}") from exc
