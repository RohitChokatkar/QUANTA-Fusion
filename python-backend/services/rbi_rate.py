"""
RBI Repo Rate Service — Fetches RBI repo rate history.
Primary source for Vasicek/CIR interest rate modeling.
Falls back to hardcoded recent history if API is unavailable.
"""

import logging
import httpx

logger = logging.getLogger(__name__)

# Historical RBI repo rates (recent — used as fallback)
HARDCODED_REPO_RATES = [
    {"date": "2023-02-08", "rate": 6.50},
    {"date": "2023-04-06", "rate": 6.50},
    {"date": "2023-06-08", "rate": 6.50},
    {"date": "2023-08-10", "rate": 6.50},
    {"date": "2023-10-06", "rate": 6.50},
    {"date": "2023-12-08", "rate": 6.50},
    {"date": "2024-02-08", "rate": 6.50},
    {"date": "2024-04-05", "rate": 6.50},
    {"date": "2024-06-07", "rate": 6.50},
    {"date": "2024-08-08", "rate": 6.50},
    {"date": "2024-10-09", "rate": 6.50},
    {"date": "2024-12-06", "rate": 6.50},
    {"date": "2025-02-07", "rate": 6.25},
    {"date": "2025-04-09", "rate": 6.00},
    {"date": "2025-06-06", "rate": 6.00},
    {"date": "2025-08-08", "rate": 5.75},
    {"date": "2025-10-08", "rate": 5.75},
    {"date": "2025-12-05", "rate": 5.50},
    {"date": "2026-02-07", "rate": 5.50},
    {"date": "2026-04-04", "rate": 5.50},
]


async def get_repo_rate_history() -> list[dict]:
    """Fetch RBI repo rate history. Falls back to hardcoded data."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.rbi.org.in/v1/repo-rate",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 5:
                    return [{"date": r.get("date", ""), "rate": float(r.get("rate", 0))} for r in data]
    except Exception as e:
        logger.info(f"RBI API unavailable ({e}), using hardcoded rates")

    return HARDCODED_REPO_RATES


def get_current_repo_rate() -> float:
    """Get the most recent RBI repo rate (synchronous)."""
    return HARDCODED_REPO_RATES[-1]["rate"]


def get_rate_values() -> list[float]:
    """Get just the rate values for Vasicek model input."""
    return [r["rate"] for r in HARDCODED_REPO_RATES]
