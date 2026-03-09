"""
twelvedata_fetcher.py
Fetches market data from Twelvedata API.
Covers: intraday, daily, quotes, forex, crypto, indices.
"""

from quanta_fusion.ingestion.base import BaseFetcher
from quanta_fusion.utils.cache import cached


class TwelvedataFetcher(BaseFetcher):

    PROVIDER = "twelvedata"
    BASE_URL = "https://api.twelvedata.com"

    def _params(self, extras: dict) -> dict:
        """Merge API key into every request."""
        return {"apikey": self.api_key, **extras}

    # ── Quote ─────────────────────────────────────────────────────────────────

    @cached("quote")
    def get_quote(self, symbol: str) -> dict:
        """Real-time quote for a stock, ETF, or index."""
        data = self._get(
            f"{self.BASE_URL}/quote",
            self._params({"symbol": symbol.upper()})
        )
        if self.is_error(data):
            return data
        if data.get("status") == "error":
            return self._error(data.get("message", "Unknown error"))

        return {
            "symbol":     data.get("symbol"),
            "name":       data.get("name"),
            "price":      float(data.get("close", 0)),
            "open":       float(data.get("open", 0)),
            "high":       float(data.get("high", 0)),
            "low":        float(data.get("low", 0)),
            "volume":     int(data.get("volume", 0)),
            "change":     float(data.get("change", 0)),
            "change_pct": float(data.get("percent_change", 0)),
            "prev_close": float(data.get("previous_close", 0)),
            "52_week_high": data.get("fifty_two_week", {}).get("high"),
            "52_week_low":  data.get("fifty_two_week", {}).get("low"),
            "exchange":   data.get("exchange"),
            "provider":   self.PROVIDER,
        }

    # ── Time Series (Daily or Intraday) ───────────────────────────────────────

    @cached("daily")
    def get_time_series(self, symbol: str, interval: str = "1day",
                        outputsize: int = 90) -> list:
        """
        OHLCV time series.
        interval: 1min, 5min, 15min, 30min, 1h, 4h, 1day, 1week
        """
        data = self._get(
            f"{self.BASE_URL}/time_series",
            self._params({
                "symbol":     symbol.upper(),
                "interval":   interval,
                "outputsize": outputsize,
                "order":      "ASC",
            })
        )
        if self.is_error(data):
            return data
        if data.get("status") == "error":
            return self._error(data.get("message", "Unknown error"))

        values = data.get("values", [])
        result = []
        for bar in values:
            result.append({
                "datetime": bar.get("datetime"),
                "open":     float(bar.get("open", 0)),
                "high":     float(bar.get("high", 0)),
                "low":      float(bar.get("low", 0)),
                "close":    float(bar.get("close", 0)),
                "volume":   int(bar.get("volume", 0) or 0),
            })
        return result

    # ── Price (single value) ─────────────────────────────────────────────────

    @cached("quote")
    def get_price(self, symbol: str) -> float:
        """Return just the current price as a float."""
        data = self._get(
            f"{self.BASE_URL}/price",
            self._params({"symbol": symbol.upper()})
        )
        if self.is_error(data):
            return 0.0
        return float(data.get("price", 0))

    # ── Forex ────────────────────────────────────────────────────────────────

    @cached("forex")
    def get_forex_rate(self, from_currency: str,
                       to_currency: str) -> dict:
        """Live forex exchange rate."""
        symbol = f"{from_currency.upper()}/{to_currency.upper()}"
        data = self._get(
            f"{self.BASE_URL}/exchange_rate",
            self._params({"symbol": symbol})
        )
        if self.is_error(data):
            return data
        if data.get("status") == "error":
            return self._error(data.get("message", "Unknown error"))

        return {
            "from":     data.get("symbol", "").split("/")[0],
            "to":       data.get("symbol", "").split("/")[1],
            "rate":     float(data.get("rate", 0)),
            "timestamp": data.get("timestamp"),
            "provider": self.PROVIDER,
        }

    # ── Crypto ───────────────────────────────────────────────────────────────

    @cached("daily")
    def get_crypto(self, symbol: str, interval: str = "1day") -> list:
        """
        Crypto OHLCV time series.
        symbol format: BTC/USD, ETH/USD
        """
        return self.get_time_series(symbol, interval)

    # ── Indices ───────────────────────────────────────────────────────────────

    @cached("quote")
    def get_indices(self, symbols: list) -> list:
        """
        Batch quotes for multiple indices.
        symbols: ["SPX", "IXIC", "DJI", "NSEI"]
        """
        results = []
        for sym in symbols:
            quote = self.get_quote(sym)
            if not self.is_error(quote):
                results.append(quote)
        return results