"""FastAPI application entry point."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, executions, hooks, keys, misc, workflows
from app.core.config import settings
from app.core.errors import install_error_handlers
from app.core.security import API_KEY_HEADER
from app.db.session import init_db

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)-8s %(name)s: %(message)s"
)
logger = logging.getLogger("nexaflow")

DESCRIPTION = """
NexaFlow connects a webhook to an action somewhere else, with an optional
transform in between.

* `POST /hooks/{token}` accepts JSON and answers `202` with an execution id;
  the workflow runs in the background with up to three attempts.
* `/api/*` is the management API, used by the dashboard with a session cookie
  or by scripts with an `X-API-Key` header.
* Errors always look like `{"error": {"code": "...", "message": "..."}}`.
"""


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    logger.info(
        "NexaFlow API ready (environment=%s, attempts=%s)",
        settings.environment,
        settings.max_attempts,
    )
    yield


app = FastAPI(
    title="NexaFlow API",
    description=DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", API_KEY_HEADER, "X-Signature-256"],
)

install_error_handlers(app)

for router in (auth.router, workflows.router, executions.router, keys.router, misc.router, hooks.router):
    app.include_router(router)


@app.get("/", include_in_schema=False)
def index() -> JSONResponse:
    return JSONResponse(
        {"service": "nexaflow-api", "docs": "/docs", "health": "/api/health"}
    )
