"""
alpha_vantage_fetcher.py
Fetches stock data from Alpha Vantage API.
Covers: daily OHLCV, intraday, quotes, fundamentals, forex, earnings.
"""

from quanta_fusion.ingestion.base import BaseFetcher
from quanta_fusion.utils.cache import cached


class AlphaVantageFetcher(BaseFetcher):

    PROVIDER = "alpha_vantage"
    BASE_URL = "https://www.alphavantage.co/query"

    def _params(self, extras: dict) -> dict:
        """Merge API key into every request."""
        return {"apikey": self.api_key, **extras}

    # ── Quotes ───────────────────────────────────────────────────────────────

    @cached("quote")
    def get_quote(self, symbol: str) -> dict:
        """Latest price, change, volume for a symbol."""
        data = self._get(self.BASE_URL, self._params({
            "function": "GLOBAL_QUOTE",
            "symbol": symbol.upper()
        }))
        if self.is_error(data):
            return data

        q = data.get("Global Quote", {})
        if not q:
            return self._error(f"No quote data for {symbol}")

        return {
            "symbol":     symbol.upper(),
            "price":      float(q.get("05. price", 0)),
            "open":       float(q.get("02. open", 0)),
            "high":       float(q.get("03. high", 0)),
            "low":        float(q.get("04. low", 0)),
            "volume":     int(q.get("06. volume", 0)),
            "change":     float(q.get("09. change", 0)),
            "change_pct": q.get("10. change percent", "0%").replace("%", ""),
            "prev_close": float(q.get("08. previous close", 0)),
            "provider":   self.PROVIDER,
        }

    # ── Daily OHLCV ──────────────────────────────────────────────────────────

    @cached("daily")
    def get_daily(self, symbol: str, outputsize: str = "compact") -> list:
        """
        Daily OHLCV bars.
        outputsize: 'compact' = last 100 days, 'full' = 20 years
        """
        data = self._get(self.BASE_URL, self._params({
            "function":   "TIME_SERIES_DAILY",
            "symbol":     symbol.upper(),
            "outputsize": outputsize,
        }))
        if self.is_error(data):
            return data

        series = data.get("Time Series (Daily)", {})
        if not series:
            return self._error(f"No daily data for {symbol}")

        result = []
        for date_str, values in sorted(series.items()):
            result.append({
                "date":   date_str,
                "open":   float(values["1. open"]),
                "high":   float(values["2. high"]),
                "low":    float(values["3. low"]),
                "close":  float(values["4. close"]),
                "volume": int(values["5. volume"]),
            })
        return result

    # ── Intraday OHLCV ───────────────────────────────────────────────────────

    @cached("quote")
    def get_intraday(self, symbol: str, interval: str = "5min") -> list:
        """
        Intraday OHLCV bars.
        interval: 1min, 5min, 15min, 30min, 60min
        """
        data = self._get(self.BASE_URL, self._params({
            "function":   "TIME_SERIES_INTRADAY",
            "symbol":     symbol.upper(),
            "interval":   interval,
            "outputsize": "compact",
        }))
        if self.is_error(data):
            return data

        key = f"Time Series ({interval})"
        series = data.get(key, {})
        if not series:
            return self._error(f"No intraday data for {symbol}")

        result = []
        for dt_str, values in sorted(series.items()):
            result.append({
                "datetime": dt_str,
                "open":     float(values["1. open"]),
                "high":     float(values["2. high"]),
                "low":      float(values["3. low"]),
                "close":    float(values["4. close"]),
                "volume":   int(values["5. volume"]),
            })
        return result

    # ── Company Overview ─────────────────────────────────────────────────────

    @cached("overview")
    def get_overview(self, symbol: str) -> dict:
        """Company fundamentals — PE, market cap, sector, description etc."""
        data = self._get(self.BASE_URL, self._params({
            "function": "OVERVIEW",
            "symbol":   symbol.upper(),
        }))
        if self.is_error(data):
            return data
        if not data or "Symbol" not in data:
            return self._error(f"No overview data for {symbol}")

        return {
            "symbol":           data.get("Symbol"),
            "name":             data.get("Name"),
            "description":      data.get("Description"),
            "sector":           data.get("Sector"),
            "industry":         data.get("Industry"),
            "market_cap":       data.get("MarketCapitalization"),
            "pe":               data.get("TrailingPE"),
            "forward_pe":       data.get("ForwardPE"),
            "eps":              data.get("EPS"),
            "dividend_yield":   data.get("DividendYield"),
            "beta":             data.get("Beta"),
            "52_week_high":     data.get("52WeekHigh"),
            "52_week_low":      data.get("52WeekLow"),
            "avg_volume":       data.get("10DayAverageTradingVolume"),
            "revenue":          data.get("RevenueTTM"),
            "gross_profit":     data.get("GrossProfitTTM"),
            "website":          data.get("OfficialSite"),
            "exchange":         data.get("Exchange"),
            "currency":         data.get("Currency"),
            "provider":         self.PROVIDER,
        }

    # ── Forex ────────────────────────────────────────────────────────────────

    @cached("forex")
    def get_forex_rate(self, from_currency: str, to_currency: str) -> dict:
        """Live currency exchange rate."""
        data = self._get(self.BASE_URL, self._params({
            "function":      "CURRENCY_EXCHANGE_RATE",
            "from_currency": from_currency.upper(),
            "to_currency":   to_currency.upper(),
        }))
        if self.is_error(data):
            return data

        rate_data = data.get("Realtime Currency Exchange Rate", {})
        if not rate_data:
            return self._error(f"No forex data for {from_currency}/{to_currency}")

        return {
            "from":         rate_data.get("1. From Currency Code"),
            "to":           rate_data.get("3. To Currency Code"),
            "rate":         float(rate_data.get("5. Exchange Rate", 0)),
            "last_updated": rate_data.get("6. Last Refreshed"),
            "provider":     self.PROVIDER,
        }

    # ── Earnings ─────────────────────────────────────────────────────────────

    @cached("overview")
    def get_earnings(self, symbol: str) -> dict:
        """Annual and quarterly earnings history."""
        data = self._get(self.BASE_URL, self._params({
            "function": "EARNINGS",
            "symbol":   symbol.upper(),
        }))
        if self.is_error(data):
            return data

        return {
            "symbol":    symbol.upper(),
            "annual":    data.get("annualEarnings", [])[:5],
            "quarterly": data.get("quarterlyEarnings", [])[:8],
            "provider":  self.PROVIDER,
        }