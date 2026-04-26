"""
Fyers REST API Service — BSE/NSE historical data, quotes, market status.
Uses fyers-apiv3 SDK for authenticated data access.
Supports both BSE stocks (BSE:RELIANCE-EQ) and NSE indices (NSE:NIFTY50-INDEX).
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional

import httpx
import numpy as np

from token_manager import get_valid_token

logger = logging.getLogger(__name__)

# Try importing fyers SDK
try:
    from fyers_apiv3 import fyersModel
    HAS_FYERS = True
except ImportError:
    HAS_FYERS = False
    logger.warning("fyers-apiv3 not installed — using TwelveData fallback")


class FyersRESTClient:
    """Fyers REST API wrapper for BSE/NSE data."""

    def __init__(self):
        self.client_id = os.getenv("FYERS_CLIENT_ID", "")
        self.secret_key = os.getenv("FYERS_SECRET_KEY", "")
        self.access_token: Optional[str] = None
        self.fyers: Optional[object] = None
        self._http = httpx.AsyncClient(timeout=15)
        # TwelveData fallback
        self._td_key = os.getenv("TWELVEDATA_API_KEY", "") or os.getenv("TWELVE_DATA_API_KEY", "")
        self._av_key = os.getenv("ALPHA_VANTAGE_API_KEY", "")

    async def init(self):
        """Initialize Fyers session."""
        # Try loading token from token_manager
        token = get_valid_token()
        if token:
            self.access_token = token

        if HAS_FYERS and self.client_id:
            try:
                self.fyers = fyersModel.FyersModel(
                    client_id=self.client_id,
                    is_async=False,
                    token=self.access_token or "",
                    log_path="",
                )
                logger.info("Fyers REST client initialized (client_id=%s)", self.client_id[:8] + "…")
            except Exception as e:
                logger.warning(f"Fyers init failed: {e} — using fallback")

    def _ensure_token(self):
        """Refresh token from token_manager before each Fyers call."""
        token = get_valid_token()
        if token and token != self.access_token:
            self.access_token = token
            if HAS_FYERS and self.client_id:
                try:
                    self.fyers = fyersModel.FyersModel(
                        client_id=self.client_id,
                        is_async=False,
                        token=token,
                        log_path="",
                    )
                    logger.info("Fyers client refreshed with new token")
                except Exception as e:
                    logger.warning(f"Fyers re-init failed: {e}")
        return token

    def _extract_exchange(self, symbol: str) -> str:
        """Extract exchange prefix from symbol (BSE or NSE)."""
        if symbol.startswith("NSE:"):
            return "NSE"
        return "BSE"

    def _simple_name(self, symbol: str) -> str:
        """Extract clean name from any Fyers ticker (BSE or NSE)."""
        return (symbol
                .replace("BSE:", "")
                .replace("NSE:", "")
                .replace("-EQ", "")
                .replace("-INDEX", ""))

    def _to_td_symbol(self, symbol: str) -> str:
        """Convert Fyers symbol to TwelveData format for fallback."""
        exchange = self._extract_exchange(symbol)
        clean = self._simple_name(symbol)

        # Index symbols — TwelveData has different names
        index_map = {
            "NIFTY50": "NIFTY 50",
            "NIFTYBANK": "NIFTY BANK",
            "NIFTYIT": "NIFTY IT",
            "SENSEX": "SENSEX",
        }
        if "-INDEX" in symbol:
            td_name = index_map.get(clean, clean)
            return td_name

        # Stock symbols — try SYMBOL.BSE format
        return f"{clean}.BSE" if exchange == "BSE" else f"{clean}.NSE"

    async def get_quote(self, symbol: str) -> dict:
        """Get live quote for a BSE/NSE symbol."""
        # Ensure fresh token before every Fyers call
        self._ensure_token()

        # Try Fyers first
        if self.fyers and self.access_token:
            try:
                data = {"symbols": symbol}
                # Run sync SDK call in thread to avoid blocking event loop
                response = await asyncio.to_thread(self.fyers.quotes, data=data)

                # ── DEBUG: Log raw Fyers response ──
                logger.debug("[FYERS_DEBUG] Raw quote response for %s: %s", symbol, response)

                if response and response.get("d"):
                    q = response["d"][0]["v"]

                    # ── DEBUG: Log extracted values ──
                    logger.debug(
                        "[FYERS_DEBUG] Extracted: lp=%s, open=%s, high=%s, low=%s, "
                        "close_price=%s, prev_close=%s, ch=%s, chp=%s, vol=%s",
                        q.get("lp"), q.get("open_price"), q.get("high_price"),
                        q.get("low_price"), q.get("close_price"),
                        q.get("prev_close_price"), q.get("ch"), q.get("chp"),
                        q.get("volume"),
                    )

                    lp = q.get("lp", 0)
                    prev_close = q.get("prev_close_price", 0)
                    change = q.get("ch", 0)
                    change_pct = q.get("chp", 0)

                    # Fallback change calculation if ch/chp are 0
                    if change == 0 and lp > 0 and prev_close > 0:
                        change = round(lp - prev_close, 2)
                        change_pct = round((change / prev_close) * 100, 2)

                    return {
                        "symbol": symbol,
                        "name": self._simple_name(symbol),
                        "price": lp,
                        "open": q.get("open_price", 0),
                        "high": q.get("high_price", 0),
                        "low": q.get("low_price", 0),
                        "close": q.get("close_price", lp),    # FIX: use close_price, not lp
                        "previous_close": prev_close,
                        "change": change,
                        "change_percent": change_pct,
                        "volume": q.get("volume", 0),
                        "timestamp": q.get("tt", 0),
                        "bid": q.get("bid", 0),
                        "ask": q.get("ask", 0),
                        "currency": "INR",
                    }
                else:
                    # Check for token expiry in the response
                    if response and (response.get("code") == -16 or response.get("code") == -300
                                     or "token" in str(response.get("message", "")).lower()):
                        logger.warning("[FYERS] Token expired for %s: %s", symbol, response)
                        return {"error": "token_expired", "message": "Fyers token needs refresh"}
                    logger.warning("[FYERS_DEBUG] No data in response for %s: %s", symbol, response)
            except Exception as e:
                logger.warning(f"Fyers quote failed for {symbol}: {e}")

        # Fallback to TwelveData
        return await self._td_quote(symbol)

    async def _td_quote(self, symbol: str) -> dict:
        """TwelveData fallback for quotes — supports both BSE and NSE symbols."""
        td_symbol = self._to_td_symbol(symbol)
        simple = self._simple_name(symbol)

        # Try multiple formats for robustness
        formats_to_try = [td_symbol]
        if "-INDEX" not in symbol:
            exchange = self._extract_exchange(symbol)
            formats_to_try.append(f"{simple}:{exchange}")
            formats_to_try.append(simple)

        for fmt in formats_to_try:
            try:
                resp = await self._http.get(
                    "https://api.twelvedata.com/quote",
                    params={"symbol": fmt, "apikey": self._td_key},
                )
                d = resp.json()

                # ── DEBUG: Log raw TwelveData response ──
                logger.debug("[TD_DEBUG] Quote response for %s (fmt=%s): %s", symbol, fmt, d)

                if d.get("code"):
                    logger.debug("[TD_DEBUG] Format %s failed: %s", fmt, d.get("message"))
                    continue

                price = float(d.get("close", 0))
                prev_close = float(d.get("previous_close", 0))
                change = float(d.get("change", 0))
                change_pct = float(d.get("percent_change", 0))

                # Fallback change calculation
                if change == 0 and price > 0 and prev_close > 0:
                    change = round(price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2)

                return {
                    "symbol": symbol,
                    "name": d.get("name", simple),
                    "price": price,
                    "open": float(d.get("open", 0)),
                    "high": float(d.get("high", 0)),
                    "low": float(d.get("low", 0)),
                    "close": price,
                    "previous_close": prev_close,
                    "change": change,
                    "change_percent": change_pct,
                    "volume": int(d.get("volume", 0) or 0),
                    "timestamp": d.get("timestamp", 0),
                    "bid": price * 0.999 if price else 0,
                    "ask": price * 1.001 if price else 0,
                    "currency": "INR",
                }
            except Exception as e:
                logger.debug("[TD_DEBUG] Format %s exception: %s", fmt, e)
                continue

        logger.error("TwelveData quote failed for all formats: %s", symbol)
        return self._empty_quote(symbol)

    async def get_history(
        self, symbol: str, interval: str = "5min", days: int = 1
    ) -> list[dict]:
        """Get OHLCV history for a BSE/NSE symbol."""
        # Ensure fresh token
        self._ensure_token()

        # Try Fyers direct HTTP first (more reliable than SDK)
        if self.access_token and self.client_id:
            try:
                now = datetime.now()
                start = now - timedelta(days=days)
                resolution_map = {
                    "1min": "1", "5min": "5", "15min": "15",
                    "1h": "60", "1day": "D",
                }
                params = {
                    "symbol": symbol,
                    "resolution": resolution_map.get(interval, "5"),
                    "date_format": "1",
                    "range_from": start.strftime("%Y-%m-%d"),
                    "range_to": now.strftime("%Y-%m-%d"),
                    "cont_flag": "1",
                }
                headers = {
                    "Authorization": f"{self.client_id}:{self.access_token}",
                }
                resp = await self._http.get(
                    "https://api-t1.fyers.in/api/v3/history/",
                    params=params,
                    headers=headers,
                    timeout=15,
                )
                response = resp.json()

                logger.info("[FYERS] History for %s: status=%s candles=%d",
                            symbol, response.get("s"), len(response.get("candles", [])))

                if response.get("candles"):
                    return [
                        {
                            "time": datetime.fromtimestamp(c[0]).isoformat(),
                            "open": c[1], "high": c[2], "low": c[3],
                            "close": c[4], "volume": int(c[5]),
                        }
                        for c in response["candles"]
                    ]
                else:
                    logger.warning("[FYERS] No candles in history response for %s: %s",
                                   symbol, str(response)[:200])
            except Exception as e:
                logger.warning(f"Fyers HTTP history failed for {symbol}: {e}")

        # Also try Fyers SDK as secondary attempt
        if self.fyers and self.access_token:
            try:
                now = datetime.now()
                start = now - timedelta(days=days)
                resolution_map = {
                    "1min": "1", "5min": "5", "15min": "15",
                    "1h": "60", "1day": "D",
                }
                data = {
                    "symbol": symbol,
                    "resolution": resolution_map.get(interval, "5"),
                    "date_format": "1",
                    "range_from": start.strftime("%Y-%m-%d"),
                    "range_to": now.strftime("%Y-%m-%d"),
                    "cont_flag": "1",
                }
                response = await asyncio.to_thread(self.fyers.history, data=data)

                if response and response.get("candles"):
                    logger.info("[FYERS SDK] History success for %s: %d candles", symbol, len(response["candles"]))
                    return [
                        {
                            "time": datetime.fromtimestamp(c[0]).isoformat(),
                            "open": c[1], "high": c[2], "low": c[3],
                            "close": c[4], "volume": int(c[5]),
                        }
                        for c in response["candles"]
                    ]
                else:
                    logger.warning("[FYERS SDK] No candles for %s: %s", symbol, str(response)[:200])
            except Exception as e:
                logger.warning(f"Fyers SDK history failed for {symbol}: {e}")

        # Fallback to TwelveData
        return await self._td_history(symbol, interval, days)

    async def _td_history(self, symbol: str, interval: str, days: int) -> list[dict]:
        """TwelveData fallback for history — supports BSE and NSE."""
        td_symbol = self._to_td_symbol(symbol)
        simple = self._simple_name(symbol)

        formats_to_try = [td_symbol, simple]

        # Fix outputsize for daily intervals
        if interval in ("1day", "D"):
            outputsize = min(days, 500)
        else:
            outputsize = min(days * 78, 500)

        for fmt in formats_to_try:
            try:
                resp = await self._http.get(
                    "https://api.twelvedata.com/time_series",
                    params={
                        "symbol": fmt,
                        "interval": interval if interval != "D" else "1day",
                        "outputsize": outputsize,
                        "apikey": self._td_key,
                    },
                )
                d = resp.json()

                logger.info("[TD] History for %s (fmt=%s): status=%s values=%d",
                            symbol, fmt, d.get("status", "ok"), len(d.get("values", [])))

                if d.get("code"):
                    logger.warning("[TD] Error for %s: %s", fmt, d.get("message", ""))
                    continue

                values = d.get("values", [])
                bars = []
                for v in reversed(values):
                    bars.append({
                        "time": v["datetime"],
                        "open": float(v["open"]),
                        "high": float(v["high"]),
                        "low": float(v["low"]),
                        "close": float(v["close"]),
                        "volume": int(v.get("volume", 0) or 0),
                    })

                if bars:
                    return bars
            except Exception as e:
                logger.warning("[TD] History format %s exception: %s", fmt, e)
                continue

        logger.error("All history sources failed for: %s", symbol)
        return []

    async def get_daily_history(self, symbol: str, days: int = 365) -> list[dict]:
        """Get daily OHLCV for model inputs."""
        return await self.get_history(symbol, "1day", days)

    def _empty_quote(self, symbol: str) -> dict:
        return {
            "symbol": symbol, "name": self._simple_name(symbol),
            "price": 0, "open": 0, "high": 0, "low": 0, "close": 0,
            "previous_close": 0, "change": 0, "change_percent": 0,
            "volume": 0, "timestamp": 0, "bid": 0, "ask": 0, "currency": "INR",
        }

    async def close(self):
        await self._http.aclose()
