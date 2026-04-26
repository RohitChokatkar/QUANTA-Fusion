"""
Auto Refresh — Fyers token refresh utilities.

Provides:
  - refresh_from_env(): Load token from FYERS_ACCESS_TOKEN env var
  - apply_token_to_client(): Update the global Fyers REST/WS clients with current token

The actual token refresh is triggered manually via POST /api/admin/refresh-token,
which accepts a new access_token in the request body. This is much more reliable
than headless TOTP automation since Fyers' internal login endpoints are undocumented.

Workflow for daily refresh:
  1. Generate token from Fyers web/app (takes ~10 seconds)
  2. POST to /api/admin/refresh-token with the new token
  3. Backend stores it in memory and updates all clients
"""

import os
import logging

from token_manager import save_token, get_valid_token

logger = logging.getLogger(__name__)


def refresh_from_env() -> bool:
    """
    Load token from FYERS_ACCESS_TOKEN environment variable.
    Called at startup to bootstrap the token.
    Returns True if a token was loaded.
    """
    token = os.environ.get("FYERS_ACCESS_TOKEN", "").strip()
    if token and token != "your_token_here":
        save_token(token)
        logger.info("Fyers token loaded from environment variable")
        return True
    else:
        logger.warning("No valid FYERS_ACCESS_TOKEN in environment — "
                        "use POST /api/admin/refresh-token to set one")
        return False


def apply_token_to_client(data_manager) -> bool:
    """
    Apply the current valid token to the Fyers REST and WS clients.
    Returns True if token was applied successfully.
    """
    token = get_valid_token()
    if not token:
        logger.warning("No valid token available to apply to clients")
        return False

    client_id = os.environ.get("FYERS_CLIENT_ID", "")

    # Update REST client
    rest = data_manager.rest_client
    rest.access_token = token
    if rest.fyers:
        try:
            from fyers_apiv3 import fyersModel
            rest.fyers = fyersModel.FyersModel(
                client_id=client_id,
                is_async=False,
                token=token,
                log_path="",
            )
            logger.info("Fyers REST client re-initialized with fresh token")
        except Exception as e:
            logger.error(f"Failed to re-init Fyers REST client: {e}")

    # Update WebSocket client
    ws = data_manager.ws_client
    ws.access_token = token
    logger.info("Token applied to REST + WS clients")

    return True
