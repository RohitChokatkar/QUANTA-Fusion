"""
cache.py
Disk-based TTL cache using diskcache.
Prevents burning through API quotas on repeated requests.
"""

import diskcache
import functools
import hashlib
import json
from pathlib import Path

# ── Cache location ────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT_DIR / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

cache_store = diskcache.Cache(str(CACHE_DIR))


def get_cache_ttl(data_type: str) -> int:
    """Return cache TTL in seconds for a given data type."""
    ttl_map = {
        "quote":    60,
        "daily":    21600,
        "overview": 86400,
        "news":     600,
        "forex":    1800,
        "blockchain": 30,
    }
    return ttl_map.get(data_type, 300)


def make_key(*args, **kwargs) -> str:
    """Generate a unique cache key — skips non-serializable objects like self."""
    safe_args = []
    for a in args:
        try:
            json.dumps(a)
            safe_args.append(a)
        except (TypeError, ValueError):
            safe_args.append(type(a).__name__)

    safe_kwargs = {}
    for k, v in kwargs.items():
        try:
            json.dumps(v)
            safe_kwargs[k] = v
        except (TypeError, ValueError):
            safe_kwargs[k] = type(v).__name__

    raw = json.dumps({"args": safe_args, "kwargs": safe_kwargs}, sort_keys=True)
    return hashlib.md5(raw.encode()).hexdigest()


def cached(data_type: str):
    """
    Decorator that caches function results by TTL.

    Usage:
        @cached("daily")
        def get_daily_data(symbol): ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            ttl = get_cache_ttl(data_type)
            key = f"{func.__name__}:{make_key(*args, **kwargs)}"

            if key in cache_store:
                print(f"[CACHE HIT] {key[:40]}...")
                return cache_store[key]

            result = func(*args, **kwargs)

            if result is not None and not (isinstance(result, dict) and result.get("error")):
                cache_store.set(key, result, expire=ttl)
                print(f"[CACHE SET] {key[:40]}... TTL={ttl}s")

            return result
        return wrapper
    return decorator


def clear_cache():
    """Clear all cached data."""
    cache_store.clear()
    print("✅ Cache cleared")


def cache_stats() -> dict:
    """Return cache statistics."""
    return {
        "total_keys": len(cache_store),
        "cache_dir": str(CACHE_DIR),
    }