"""
base.py
Abstract base class for all API fetchers.
Handles retries, rate limiting, error handling, and caching uniformly.
"""

import requests
import time
import functools
from abc import ABC, abstractmethod
from quanta_fusion.utils.config_loader import get_api_key, get_rate_limit


class BaseFetcher(ABC):
    """
    All API fetchers (AlphaVantage, Finnhub, Twelvedata) inherit from this.
    Provides: retry logic, rate limit detection, structured error responses.
    """

    PROVIDER = ""       # e.g. "alpha_vantage"
    BASE_URL = ""       # e.g. "https://www.alphavantage.co/query"
    MAX_RETRIES = 3
    RETRY_DELAY = 2     # seconds between retries

    def __init__(self):
        try:
            self.api_key = get_api_key(self.PROVIDER)
        except ValueError:
            self.api_key = ""
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    def _get(self, url: str, params: dict = None) -> dict:
        """
        Make a GET request with retry + rate limit detection.
        Always returns a dict — never raises to callers.
        """
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = self.session.get(url, params=params, timeout=10)

                # HTTP error
                if response.status_code == 429:
                    print(f"[{self.PROVIDER}] Rate limited. Waiting 60s...")
                    time.sleep(60)
                    continue

                if response.status_code != 200:
                    return self._error(f"HTTP {response.status_code}")

                data = response.json()

                # Alpha Vantage rate limit message
                if "Note" in data:
                    print(f"[{self.PROVIDER}] Quota warning: {data['Note']}")
                    return self._error("API quota reached", data)

                # Alpha Vantage error message
                if "Error Message" in data:
                    return self._error(data["Error Message"])

                # Finnhub empty response
                if data == {} or data is None:
                    return self._error("Empty response from API")

                return data

            except requests.exceptions.Timeout:
                print(f"[{self.PROVIDER}] Timeout on attempt {attempt}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(self.RETRY_DELAY * attempt)

            except requests.exceptions.ConnectionError:
                print(f"[{self.PROVIDER}] Connection error on attempt {attempt}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(self.RETRY_DELAY * attempt)

            except Exception as e:
                return self._error(str(e))

        return self._error(f"Failed after {self.MAX_RETRIES} attempts")

    def _error(self, message: str, data: dict = None) -> dict:
        """Return a structured error response."""
        print(f"[{self.PROVIDER}] ERROR: {message}")
        return {
            "error": True,
            "provider": self.PROVIDER,
            "message": message,
            "data": data or {}
        }

    def is_error(self, response: dict) -> bool:
        """Check if a response is an error."""
        return isinstance(response, dict) and response.get("error") is True

    @abstractmethod
    def get_quote(self, symbol: str) -> dict:
        """Every fetcher must implement get_quote."""
        pass