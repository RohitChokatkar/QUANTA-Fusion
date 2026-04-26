"""
Firebase Admin Service — Writes model outputs to Firebase Realtime DB.
Initializes only when FIREBASE_CREDENTIALS_JSON is provided.
"""

import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_db = None
_initialized = False


def init_firebase():
    """Initialize Firebase Admin SDK if credentials are available."""
    global _db, _initialized
    creds_path = os.getenv("FIREBASE_CREDENTIALS_JSON", "")

    if not creds_path or not os.path.exists(creds_path):
        logger.info("Firebase credentials not configured — DB writes disabled")
        _initialized = False
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, db

        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, {
            "databaseURL": os.getenv(
                "FIREBASE_DB_URL",
                "https://quantfusion-default-rtdb.firebaseio.com"
            ),
        })
        _db = db
        _initialized = True
        logger.info("Firebase Admin SDK initialized")
    except Exception as e:
        logger.warning(f"Firebase init failed: {e}")
        _initialized = False


def write_model_output(symbol: str, model_name: str, data: dict):
    """Write model output to Firebase Realtime DB."""
    if not _initialized or not _db:
        return

    try:
        ref = _db.reference(f"/models/{symbol}/{model_name}")
        ref.set(data)
    except Exception as e:
        logger.error(f"Firebase write failed: {e}")


def write_all_outputs(symbol: str, outputs: dict):
    """Write all model outputs at once."""
    if not _initialized or not _db:
        return

    try:
        ref = _db.reference(f"/models/{symbol}")
        ref.update(outputs)
    except Exception as e:
        logger.error(f"Firebase bulk write failed: {e}")


def read_model_output(symbol: str, model_name: str) -> Optional[dict]:
    """Read model output from Firebase."""
    if not _initialized or not _db:
        return None

    try:
        ref = _db.reference(f"/models/{symbol}/{model_name}")
        return ref.get()
    except Exception as e:
        logger.error(f"Firebase read failed: {e}")
        return None
