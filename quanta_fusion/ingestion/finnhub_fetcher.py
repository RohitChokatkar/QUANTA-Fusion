"""
finnhub_fetcher.py
Fetches real-time data from Finnhub API.
Covers: quotes, company news, market news, financials, sentiment.
"""

from quanta_fusion.ingestion.base import BaseFetcher
from quanta_fusion.utils.cache import cached


class FinnhubFetcher(BaseFetcher):

    PROVIDER = "finnhub"
    BASE_URL = "https://finnhub.io/api/v1"

    def _params(self, extras: dict) -> dict:
        """Merge API token into every request."""
        return {"token": self.api_key, **extras}

    # ── Quote ────────────────────────────────────────────────────────────────

    @cached("quote")
    def get_quote(self, symbol: str) -> dict:
        """Real-time bid/ask/price for a symbol."""
        data = self._get(
            f"{self.BASE_URL}/quote",
            self._params({"symbol": symbol.upper()})
        )
        if self.is_error(data):
            return data
        if data.get("c", 0) == 0:
            return self._error(f"No quote data for {symbol}")

        return {
            "symbol":     symbol.upper(),
            "price":      data.get("c"),   # current price
            "open":       data.get("o"),   # open
            "high":       data.get("h"),   # high
            "low":        data.get("l"),   # low
            "prev_close": data.get("pc"),  # previous close
            "change":     round(data.get("c", 0) - data.get("pc", 0), 2),
            "change_pct": round(
                ((data.get("c", 0) - data.get("pc", 0)) /
                 data.get("pc", 1)) * 100, 2
            ),
            "timestamp":  data.get("t"),
            "provider":   self.PROVIDER,
        }

    # ── Company News ─────────────────────────────────────────────────────────

    @cached("news")
    def get_company_news(self, symbol: str,
                         from_date: str, to_date: str) -> list:
        """
        Recent news articles for a company.
        Dates format: YYYY-MM-DD
        """
        data = self._get(
            f"{self.BASE_URL}/company-news",
            self._params({
                "symbol": symbol.upper(),
                "from":   from_date,
                "to":     to_date,
            })
        )
        if self.is_error(data):
            return data
        if not isinstance(data, list):
            return []

        result = []
        for article in data[:20]:
            result.append({
                "headline":  article.get("headline"),
                "summary":   article.get("summary"),
                "source":    article.get("source"),
                "url":       article.get("url"),
                "image":     article.get("image"),
                "published": article.get("datetime"),
                "category":  article.get("category"),
                "provider":  self.PROVIDER,
            })
        return result

    # ── Market News ──────────────────────────────────────────────────────────

    @cached("news")
    def get_market_news(self, category: str = "general") -> list:
        """
        Latest market-wide news.
        category: general, forex, crypto, merger
        """
        data = self._get(
            f"{self.BASE_URL}/news",
            self._params({"category": category})
        )
        if self.is_error(data):
            return data
        if not isinstance(data, list):
            return []

        result = []
        for article in data[:30]:
            result.append({
                "headline":  article.get("headline"),
                "summary":   article.get("summary"),
                "source":    article.get("source"),
                "url":       article.get("url"),
                "published": article.get("datetime"),
                "category":  article.get("category"),
                "provider":  self.PROVIDER,
            })
        return result

    # ── Basic Financials ─────────────────────────────────────────────────────

    @cached("overview")
    def get_basic_financials(self, symbol: str,
                              metric: str = "all") -> dict:
        """Key financial metrics — PE, EPS, margins, 52w high/low etc."""
        data = self._get(
            f"{self.BASE_URL}/stock/metric",
            self._params({
                "symbol": symbol.upper(),
                "metric": metric,
            })
        )
        if self.is_error(data):
            return data

        metrics = data.get("metric", {})
        return {
            "symbol":          symbol.upper(),
            "pe":              metrics.get("peBasicExclExtraTTM"),
            "eps":             metrics.get("epsBasicExclExtraAnnual"),
            "52_week_high":    metrics.get("52WeekHigh"),
            "52_week_low":     metrics.get("52WeekLow"),
            "market_cap":      metrics.get("marketCapitalization"),
            "dividend_yield":  metrics.get("dividendYieldIndicatedAnnual"),
            "beta":            metrics.get("beta"),
            "revenue_growth":  metrics.get("revenueGrowthTTMYoy"),
            "gross_margin":    metrics.get("grossMarginTTM"),
            "net_margin":      metrics.get("netMarginTTM"),
            "roa":             metrics.get("roaTTM"),
            "roe":             metrics.get("roeTTM"),
            "provider":        self.PROVIDER,
        }

    # ── News Sentiment ───────────────────────────────────────────────────────

    @cached("news")
    def get_sentiment(self, symbol: str) -> dict:
        """Finnhub's built-in news sentiment score for a symbol."""
        data = self._get(
            f"{self.BASE_URL}/news-sentiment",
            self._params({"symbol": symbol.upper()})
        )
        if self.is_error(data):
            return data

        return {
            "symbol":           symbol.upper(),
            "buzz_score":       data.get("buzz", {}).get("buzz"),
            "articles_in_week": data.get("buzz", {}).get("articlesInLastWeek"),
            "weekly_avg":       data.get("buzz", {}).get("weeklyAverage"),
            "bullish_pct":      data.get("sentiment", {}).get("bullishPercent"),
            "bearish_pct":      data.get("sentiment", {}).get("bearishPercent"),
            "score":            data.get("companyNewsScore"),
            "sector_avg":       data.get("sectorAverageBullishPercent"),
            "provider":         self.PROVIDER,
        }

    # ── Earnings Calendar ────────────────────────────────────────────────────

    @cached("overview")
    def get_earnings_calendar(self, symbol: str) -> list:
        """Upcoming earnings dates for a symbol."""
        data = self._get(
            f"{self.BASE_URL}/calendar/earnings",
            self._params({"symbol": symbol.upper()})
        )
        if self.is_error(data):
            return data

        earnings = data.get("earningsCalendar", [])
        return [{
            "symbol":       e.get("symbol"),
            "date":         e.get("date"),
            "eps_estimate":  e.get("epsEstimate"),
            "eps_actual":    e.get("epsActual"),
            "revenue_est":   e.get("revenueEstimate"),
            "revenue_act":   e.get("revenueActual"),
            "provider":      self.PROVIDER,
        } for e in earnings[:10]]