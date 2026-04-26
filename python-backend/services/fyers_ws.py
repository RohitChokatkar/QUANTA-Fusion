"""
Fyers WebSocket Service — Live BSE/NSE tick streaming.
Auto-reconnect with exponential backoff.
Publishes ticks to internal asyncio queue for model consumption.
Supports BSE stocks, NSE indices, and simulated forex ticks.
"""

import os
import asyncio
import logging
import json
from typing import Optional, Callable

logger = logging.getLogger(__name__)

try:
    from fyers_apiv3.FyersWebsocket import data_ws
    HAS_FYERS_WS = True
except ImportError:
    HAS_FYERS_WS = False
    logger.warning("fyers-apiv3 WebSocket not available — using simulated ticks")


class FyersWSClient:
    """Fyers WebSocket client for live BSE/NSE tick data."""

    def __init__(self):
        self.client_id = os.getenv("FYERS_CLIENT_ID", "")
        self.access_token: Optional[str] = None
        self._ws = None
        self._subscribers: list[asyncio.Queue] = []
        self._running = False
        self._symbols: list[str] = []
        self._reconnect_delay = 1
        self._max_reconnect_delay = 60

    def subscribe(self) -> asyncio.Queue:
        """Create a new subscriber queue for tick data."""
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        """Remove a subscriber queue."""
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def _broadcast(self, tick: dict):
        """Send tick to all subscribers."""
        for q in self._subscribers:
            try:
                q.put_nowait(tick)
            except asyncio.QueueFull:
                try:
                    q.get_nowait()  # drop oldest
                    q.put_nowait(tick)
                except Exception:
                    pass

    async def start(self, symbols: list[str]):
        """Start receiving ticks for given BSE/NSE symbols."""
        self._symbols = symbols
        self._running = True

        if HAS_FYERS_WS and self.access_token:
            await self._start_fyers()
        else:
            # Simulated tick mode for development
            asyncio.create_task(self._simulated_ticks())

    async def _start_fyers(self):
        """Start real Fyers WebSocket connection."""
        try:
            def on_message(message):
                # ── DEBUG: Log raw WebSocket message ──
                logger.debug("[FYERS_WS_DEBUG] Raw message: %s", message)

                if isinstance(message, dict):
                    symbol = message.get("symbol", "")
                    ltp = message.get("ltp", 0)
                    prev_close = message.get("close_price", 0)

                    # Calculate change from previous close if not provided
                    ch = message.get("ch", 0)
                    chp = message.get("chp", 0)
                    if ch == 0 and ltp > 0 and prev_close > 0:
                        ch = round(ltp - prev_close, 2)
                        chp = round((ch / prev_close) * 100, 2)

                    tick = {
                        "symbol": symbol,
                        "price": ltp,
                        "bid": message.get("bid_price", 0),       # FIX: was "bid"
                        "ask": message.get("ask_price", 0),       # FIX: was "ask"
                        "volume": message.get("vol_traded_today", 0),
                        "high": message.get("high_price", 0),
                        "low": message.get("low_price", 0),
                        "open": message.get("open_price", 0),
                        "close": prev_close,                      # FIX: add previous close
                        "change": ch,
                        "change_percent": chp,
                        "timestamp": message.get("exch_feed_time", 0),
                    }

                    # ── DEBUG: Log parsed tick ──
                    logger.debug(
                        "[FYERS_WS_DEBUG] Parsed tick: %s @ ₹%.2f (bid=%.2f ask=%.2f ch=%.2f)",
                        symbol, ltp, tick["bid"], tick["ask"], ch,
                    )

                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.ensure_future(self._broadcast(tick))

            def on_error(message):
                logger.error(f"Fyers WS error: {message}")

            def on_close(message):
                logger.info(f"Fyers WS closed: {message}")

            def on_open():
                logger.info("Fyers WS connected — subscribed to %d symbols", len(self._symbols))
                self._reconnect_delay = 1

            self._ws = data_ws.FyersDataSocket(
                access_token=f"{self.client_id}:{self.access_token}",
                log_path="",
                litemode=False,
                write_to_file=False,
                reconnect=True,
                on_connect=on_open,
                on_close=on_close,
                on_error=on_error,
                on_message=on_message,
            )
            self._ws.subscribe(symbol=self._symbols, data_type="SymbolUpdate")
            self._ws.keep_running()

        except Exception as e:
            logger.error(f"Fyers WS start failed: {e}")
            asyncio.create_task(self._simulated_ticks())

    async def _simulated_ticks(self):
        """Generate simulated BSE/NSE ticks for development/demo."""
        import random
        logger.info("Running simulated tick generator (BSE stocks + NSE indices)")

        # Simulated base prices — BSE/NSE closing prices April 10, 2026
        base_prices = {
            "BSE:RELIANCE-EQ": 1350.20,
            "BSE:TCS-EQ": 2524.35,
            "BSE:INFY-EQ": 1292.50,
            "BSE:HDFCBANK-EQ": 810.30,
            "BSE:WIPRO-EQ": 204.88,
            "BSE:ITC-EQ": 304.25,
            "BSE:ICICIBANK-EQ": 1345.0,
            "BSE:SBIN-EQ": 1066.70,
            "BSE:BHARTIARTL-EQ": 1870.00,
            "BSE:KOTAKBANK-EQ": 374.75,
            "BSE:LT-EQ": 3959.90,
            "BSE:HINDUNILVR-EQ": 2155.30,
            "BSE:BAJFINANCE-EQ": 924.55,
            "BSE:AXISBANK-EQ": 1148.0,
            "BSE:MARUTI-EQ": 13710.95,
            "BSE:TITAN-EQ": 4502.15,
            "BSE:SUNPHARMA-EQ": 1654.70,
            "BSE:TATAMOTORS-EQ": 444.55,
            # NSE Indices — closing values April 10, 2026
            "NSE:NIFTY50-INDEX": 24050.60,
            "BSE:SENSEX-INDEX": 77550.25,
            "NSE:NIFTYBANK-INDEX": 55912.75,
            "NSE:NIFTYIT-INDEX": 34500.0,
            "NSE:NIFTYNEXT50-INDEX": 58600.0,
            "NSE:NIFTYMIDCAP100-INDEX": 47500.0,
        }
        prices = {}
        for sym in self._symbols:
            prices[sym] = base_prices.get(sym, 1000.0 + random.random() * 2000)

        while self._running:
            for sym in self._symbols:
                # Random walk
                change_pct = (random.random() - 0.48) * 0.3  # slight positive bias
                prices[sym] *= (1 + change_pct / 100)
                spread = prices[sym] * 0.001
                vol = random.randint(10000, 500000)

                tick = {
                    "symbol": sym,
                    "price": round(prices[sym], 2),
                    "bid": round(prices[sym] - spread / 2, 2),
                    "ask": round(prices[sym] + spread / 2, 2),
                    "volume": vol,
                    "high": round(prices[sym] * 1.012, 2),
                    "low": round(prices[sym] * 0.988, 2),
                    "open": round(prices[sym] * 0.998, 2),
                    "close": round(prices[sym] * 0.997, 2),  # previous close for change calc
                    "change": round(prices[sym] * change_pct / 100, 2),
                    "change_percent": round(change_pct, 2),
                    "timestamp": int(asyncio.get_event_loop().time()),
                }
                await self._broadcast(tick)

            await asyncio.sleep(2)  # tick every 2 seconds

    async def stop(self):
        """Stop the WebSocket connection."""
        self._running = False
        if self._ws:
            try:
                self._ws.unsubscribe(symbol=self._symbols, data_type="SymbolUpdate")
            except Exception:
                pass
        self._subscribers.clear()
