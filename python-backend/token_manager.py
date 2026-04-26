"""
Token Manager — In-memory Fyers access token storage.
Stores token + timestamp in memory (not file, since Render has ephemeral FS).
Token is refreshed at startup and via the admin endpoint.
"""

import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── In-memory token store ────────────────────────────
_token: Optional[str] = None
_generated_at: float = 0.0
_TOKEN_LIFETIME = 23 * 3600  # 23 hours (Fyers tokens last ~24h)


def get_valid_token() -> Optional[str]:
    """Return the current token if it's less than 23 hours old, else None."""
    global _token, _generated_at
    if _token and (time.time() - _generated_at) < _TOKEN_LIFETIME:
        return _token
    if _token:
        logger.warning("Fyers token expired (age: %.1f hours)", (time.time() - _generated_at) / 3600)
    return None


def save_token(token: str):
    """Save a new access token to memory."""
    global _token, _generated_at
    _token = token
    _generated_at = time.time()
    logger.info("Fyers token saved to memory (valid for ~23 hours)")


def get_token_info() -> dict:
    """Return token metadata (for health/debug endpoints)."""
    age_hours = (time.time() - _generated_at) / 3600 if _generated_at else 0
    return {
        "has_token": _token is not None,
        "age_hours": round(age_hours, 2),
        "is_valid": get_valid_token() is not None,
        "generated_at": _generated_at,
    }


def clear_token():
    """Clear the stored token (for testing/logout)."""
    global _token, _generated_at
    _token = None
    _generated_at = 0.0
    logger.info("Fyers token cleared from memory")
