"""
Data Manager — Central orchestrator for QuantFusion v2.1.
Manages Fyers data feeds (BSE stocks + NSE indices), Twelve Data forex,
model computation pipeline, and Firebase writes.
"""
import os
import asyncio
import logging
from typing import Optional

from services.fyers_rest import FyersRESTClient
from services.fyers_ws import FyersWSClient
from services.rbi_rate import get_rate_values, get_current_repo_rate
from services.newsapi_svc import get_sentiment_summary
from services.firebase_admin_svc import init_firebase, write_all_outputs
from services.twelve_data import TwelveDataService

from models.garch import garch_forecast
from models.bsm import black_scholes
from models.vasicek import vasicek_forecast, get_risk_free_rate
from models.avellaneda_stoikov import avellaneda_stoikov
from models.kyle import kyle_lambda, classify_trades
from models.glosten_milgrom import glosten_milgrom
from models.rl_agent import rl_signal, compute_rsi, compute_momentum

from token_manager import get_valid_token

logger = logging.getLogger(__name__)

# BSE stocks — NIFTY 50 constituents
DEFAULT_STOCK_SYMBOLS = [
    "BSE:RELIANCE-EQ", "BSE:TCS-EQ", "BSE:INFY-EQ",
    "BSE:HDFCBANK-EQ", "BSE:WIPRO-EQ", "BSE:ITC-EQ",
    "BSE:ICICIBANK-EQ", "BSE:SBIN-EQ", "BSE:BHARTIARTL-EQ",
    "BSE:KOTAKBANK-EQ",
]

# NSE/BSE indices
DEFAULT_INDEX_SYMBOLS = [
    "NSE:NIFTY50-INDEX", "BSE:SENSEX-INDEX",
    "NSE:NIFTYBANK-INDEX", "NSE:NIFTYIT-INDEX",
    "NSE:NIFTYNEXT50-INDEX", "NSE:NIFTYMIDCAP100-INDEX",
]

# Forex pairs (via Twelve Data)
DEFAULT_FOREX_SYMBOLS = [
    "USD/INR", "EUR/USD", "GBP/USD", "JPY/USD",
    "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD",
    "EUR/INR", "GBP/INR",
]

# Combined for backward compat
DEFAULT_SYMBOLS = DEFAULT_STOCK_SYMBOLS


class DataManager:
    """Central data + model orchestrator."""

    def __init__(self):
        self.rest_client = FyersRESTClient()
        self.ws_client = FyersWSClient()
        self.td_client = TwelveDataService()
        self._active_symbol: str = "BSE:RELIANCE-EQ"
        self._running = False
        self._tick_queue: Optional[asyncio.Queue] = None

        # Cached model outputs
        self.outputs: dict = {}
        self.latest_quote: dict = {}
        self.ohlcv: list[dict] = []
        self.daily_history: list[dict] = []

        # WebSocket broadcast subscribers
        self._ws_subscribers: list[asyncio.Queue] = []

    async def start(self):
        """Start all data services."""
        logger.info("DataManager starting…")
        self._running = True

        # Init Firebase
        init_firebase()

        # Init Fyers REST
        await self.rest_client.init()

        # Subscribe to tick stream
        self._tick_queue = self.ws_client.subscribe()

        # Start WebSocket feed — stream both stocks and indices
        ws_symbols = DEFAULT_STOCK_SYMBOLS[:5] + DEFAULT_INDEX_SYMBOLS
        await self.ws_client.start(ws_symbols)

        # Start Twelve Data feed for forex
        await self.td_client.start(DEFAULT_FOREX_SYMBOLS)

        # Start background tasks
        asyncio.create_task(self._tick_processor())
        asyncio.create_task(self._model_loop())
        asyncio.create_task(self._slow_model_loop())

        logger.info("DataManager started ✓ (stocks=%d, indices=%d, forex=%d)",
                     len(DEFAULT_STOCK_SYMBOLS), len(DEFAULT_INDEX_SYMBOLS),
                     len(DEFAULT_FOREX_SYMBOLS))

    async def stop(self):
        """Stop all services."""
        self._running = False
        await self.ws_client.stop()
        await self.td_client.stop()
        await self.rest_client.close()
        logger.info("DataManager stopped")

    def subscribe_ws(self) -> asyncio.Queue:
        """Create a subscriber for WebSocket broadcasts to React."""
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._ws_subscribers.append(q)
        return q

    def unsubscribe_ws(self, q: asyncio.Queue):
        if q in self._ws_subscribers:
            self._ws_subscribers.remove(q)

    async def _broadcast_ws(self, msg: dict):
        """Broadcast to all React WebSocket clients."""
        for q in self._ws_subscribers:
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                try:
                    q.get_nowait()
                    q.put_nowait(msg)
                except Exception:
                    pass

    async def set_symbol(self, symbol: str):
        """Change active symbol and reload data."""
        self._active_symbol = symbol
        self.outputs = {}
        self.ohlcv = []
        # Fetch fresh data
        await self._load_history()

    async def _load_history(self):
        """Load OHLCV history for current symbol."""
        try:
            self.ohlcv = await self.rest_client.get_history(
                self._active_symbol, "5min", 1
            )
            self.daily_history = await self.rest_client.get_history(
                self._active_symbol, "1day", 90
            )
        except Exception as e:
            logger.error(f"History load failed: {e}")

    async def _tick_processor(self):
        """Process incoming ticks from Fyers WebSocket."""
        while self._running:
            try:
                tick = await asyncio.wait_for(
                    self._tick_queue.get(), timeout=5
                )
                if tick.get("symbol") == self._active_symbol:
                    self.latest_quote = tick
                    # Broadcast to React clients
                    await self._broadcast_ws({
                        "type": "tick",
                        "data": tick,
                    })
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Tick processor error: {e}")
                await asyncio.sleep(1)

    async def _model_loop(self):
        """Run fast models every 5 seconds."""
        await asyncio.sleep(3)  # initial delay
        await self._load_history()

        while self._running:
            try:
                await self._run_fast_models()
                # Broadcast model outputs
                await self._broadcast_ws({
                    "type": "models",
                    "data": self.outputs,
                })
            except Exception as e:
                logger.error(f"Model loop error: {e}")
            await asyncio.sleep(5)

    async def _slow_model_loop(self):
        """Run slow models every 60 seconds (Vasicek, Heston, etc.)."""
        await asyncio.sleep(10)

        while self._running:
            try:
                await self._run_slow_models()
            except Exception as e:
                logger.error(f"Slow model loop error: {e}")
            await asyncio.sleep(60)

    async def _run_fast_models(self):
        """GARCH, BSM, A-S, Kyle, G-M, RL — every 5s."""
        price = self.latest_quote.get("price", 0)
        bid = self.latest_quote.get("bid", 0)
        ask = self.latest_quote.get("ask", 0)

        if not price and self.ohlcv:
            price = self.ohlcv[-1].get("close", 0)

        if not price:
            return

        closes = [b["close"] for b in self.ohlcv if "close" in b]
        volumes = [b["volume"] for b in self.ohlcv if "volume" in b]
        daily_closes = [b["close"] for b in self.daily_history if "close" in b]

        # GARCH
        if len(daily_closes) >= 30:
            self.outputs["garch"] = garch_forecast(daily_closes)
        elif len(closes) >= 30:
            self.outputs["garch"] = garch_forecast(closes)

        # BSM
        sigma = (self.outputs.get("garch", {}).get("sigma", 25)) / 100
        r = get_current_repo_rate() / 100
        self.outputs["blackScholes"] = black_scholes(price, price, 30/365, r, sigma)

        # Avellaneda-Stoikov
        self.outputs["avellanedaStoikov"] = avellaneda_stoikov(price, sigma)

        # Kyle
        if len(closes) >= 10 and len(volumes) >= 10:
            signs, changes = classify_trades(closes, volumes)
            if signs and changes:
                self.outputs["kyle"] = kyle_lambda(
                    volumes[-len(signs):], signs, changes
                )

        # Glosten-Milgrom
        bid_p = bid or price * 0.999
        ask_p = ask or price * 1.001
        kyle_lam = self.outputs.get("kyle", {}).get("lambda", 0)
        if len(closes) > 5:
            signs_gm, _ = classify_trades(closes[-20:], volumes[-20:]) if len(closes) >= 20 else ([], [])
            self.outputs["glostenMilgrom"] = glosten_milgrom(
                bid_p, ask_p, closes[-20:], signs_gm, kyle_lam
            )

        # RL Agent
        vol = self.outputs.get("garch", {}).get("sigma", 25)
        lam = self.outputs.get("kyle", {}).get("lambda", 0)
        sent = self.outputs.get("sentiment", {}).get("score", 50)
        mom = compute_momentum(closes) if len(closes) > 5 else 0
        rsi = compute_rsi(closes) if len(closes) > 14 else 50
        sma20 = float(sum(closes[-20:])/20) if len(closes) >= 20 else price
        self.outputs["rlAgent"] = rl_signal(vol, lam, (sent - 50)/50, mom, price, sma20, rsi)

    async def _run_slow_models(self):
        """Vasicek, Sentiment — every 60s."""
        # Vasicek
        rates = get_rate_values()
        self.outputs["vasicek"] = vasicek_forecast(rates)

        # Sentiment
        self.outputs["sentiment"] = await get_sentiment_summary(self._active_symbol)

        # Write to Firebase
        write_all_outputs(self._active_symbol, self.outputs)

    async def get_quote(self, symbol: str) -> dict:
        """Get current quote for any symbol."""
        if symbol == self._active_symbol and self.latest_quote:
            return self.latest_quote
        return await self.rest_client.get_quote(symbol)

    async def get_history(self, symbol: str, interval: str = "5min", days: int = 1) -> list[dict]:
        """Get OHLCV history."""
        if symbol == self._active_symbol and self.ohlcv:
            return self.ohlcv
        return await self.rest_client.get_history(symbol, interval, days)
