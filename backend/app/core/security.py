"""Passwords, sessions, API keys, workflow tokens and credential encryption.

Each key is derived from ``SECRET_KEY`` through HKDF with its own info label,
so the session signer and the credential cipher never share key material.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.core.config import settings

SESSION_COOKIE_NAME = "nexaflow_session"
API_KEY_HEADER = "X-API-Key"
API_KEY_PREFIX = "nxf_live"
JWT_ALGORITHM = "HS256"

# 128 * r * N = 16 MiB per hash. maxmem must be passed explicitly: OpenSSL's
# default ceiling is 32 MiB and silently rejects anything above it.
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_MAXMEM = 256 * 1024 * 1024


def _derive_key(info: str, length: int = 32) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(), length=length, salt=b"nexaflow", info=info.encode()
    ).derive(settings.secret_key.encode())


_fernet = Fernet(base64.urlsafe_b64encode(_derive_key("integration-credentials")))
_jwt_key = _derive_key("session-jwt")


# --- Passwords -------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P,
        dklen=32, maxmem=SCRYPT_MAXMEM,
    )
    return "scrypt${}${}${}${}${}".format(
        SCRYPT_N, SCRYPT_R, SCRYPT_P,
        base64.b64encode(salt).decode(), base64.b64encode(digest).decode(),
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, digest_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        expected = base64.b64decode(digest_b64)
        digest = hashlib.scrypt(
            password.encode(), salt=base64.b64decode(salt_b64),
            n=int(n), r=int(r), p=int(p), dklen=len(expected), maxmem=SCRYPT_MAXMEM,
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest, expected)


# --- Sessions --------------------------------------------------------------
def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=settings.access_token_ttl_minutes)).timestamp()),
            "jti": secrets.token_urlsafe(8),
        },
        _jwt_key,
        algorithm=JWT_ALGORITHM,
    )


def read_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, _jwt_key, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


# --- API keys --------------------------------------------------------------
def generate_api_key() -> tuple[str, str, str]:
    """``(raw, prefix, digest)``.

    A plain SHA-256 is right here: the key is 256 bits of entropy, so there is
    nothing to brute force and a slow KDF would tax every authenticated call.
    Passwords are the opposite case — see ``hash_password``.
    """
    secret = secrets.token_urlsafe(32)
    raw = f"{API_KEY_PREFIX}_{secret}"
    return raw, f"{API_KEY_PREFIX}_{secret[:6]}", hash_api_key(raw)


def hash_api_key(raw: str) -> str:
    return hashlib.sha256(raw.strip().encode()).hexdigest()


# --- Webhook tokens and signatures ------------------------------------------
def generate_workflow_token() -> str:
    return secrets.token_urlsafe(32)


def generate_signing_secret() -> str:
    return secrets.token_urlsafe(24)


def sign_body(body: bytes, secret: str) -> str:
    return f"sha256={hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()}"


def verify_body_signature(body: bytes, secret: str, header_value: str | None) -> bool:
    if not header_value:
        return False
    return hmac.compare_digest(sign_body(body, secret), header_value.strip())


# --- Integration credentials at rest -----------------------------------------
def encrypt_secret(raw: str) -> str:
    return _fernet.encrypt(raw.encode()).decode()


def decrypt_secret(blob: str) -> str | None:
    try:
        return _fernet.decrypt(blob.encode()).decode()
    except (InvalidToken, ValueError):
        return None
