"""
config_loader.py
Loads settings.yaml and provides a single config object
accessible across the entire QUANTA-Fusion package.
"""

import yaml
import os
from pathlib import Path


# ── Locate the config directory ──────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parents[2]  # QUANTA-Fusion/
CONFIG_PATH = ROOT_DIR / "config" / "settings.yaml"


def load_config(path: Path = CONFIG_PATH) -> dict:
    """Load and return the full settings.yaml as a dict."""
    if not path.exists():
        raise FileNotFoundError(
            f"settings.yaml not found at {path}\n"
            f"Copy config/settings.example.yaml → config/settings.yaml and add your API keys."
        )
    with open(path, "r") as f:
        return yaml.safe_load(f)


# ── Single global config instance ────────────────────────────────────────────
config = load_config()


def get_api_key(provider: str) -> str:
    """Return the API key for a given provider name."""
    key = config.get("api_keys", {}).get(provider, "")
    if not key:
        raise ValueError(
            f"API key for '{provider}' is missing in config/settings.yaml"
        )
    return key


def get_cache_ttl(data_type: str) -> int:
    """Return cache TTL in seconds for a given data type."""
    return config.get("cache", {}).get(f"ttl_{data_type}", 300)


def get_stock_universe() -> list:
    """Return the top 10 stock symbols."""
    return config.get("stock_universe", {}).get("top_10", [])


def get_indices() -> dict:
    """Return the indices symbol map."""
    return config.get("stock_universe", {}).get("indices", {})


def get_rate_limit(provider: str, limit_type: str) -> int:
    """Return rate limit value for a provider."""
    return config.get("rate_limits", {}).get(provider, {}).get(limit_type, 60)