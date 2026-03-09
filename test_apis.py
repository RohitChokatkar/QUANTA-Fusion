"""
test_apis.py
Quick connectivity test for all 3 API fetchers.
Run: python test_apis.py
"""

from quanta_fusion.ingestion.alpha_vantage_fetcher import AlphaVantageFetcher
from quanta_fusion.ingestion.finnhub_fetcher import FinnhubFetcher
from quanta_fusion.ingestion.twelvedata_fetcher import TwelvedataFetcher

SYMBOL = "AAPL"
PASS = "✅"
FAIL = "❌"

def test_alpha_vantage():
    print("\n── Alpha Vantage ────────────────────────────")
    av = AlphaVantageFetcher()
    quote = av.get_quote(SYMBOL)
    print(f"{PASS if 'price' in quote else FAIL} Quote:    {quote.get('price', quote.get('message'))}")
    overview = av.get_overview(SYMBOL)
    print(f"{PASS if 'name' in overview else FAIL} Overview: {overview.get('name', overview.get('message'))}")
    forex = av.get_forex_rate("USD", "INR")
    print(f"{PASS if 'rate' in forex else FAIL} Forex:    USD/INR = {forex.get('rate', forex.get('message'))}")

def test_finnhub():
    print("\n── Finnhub ──────────────────────────────────")
    fh = FinnhubFetcher()
    quote = fh.get_quote(SYMBOL)
    print(f"{PASS if 'price' in quote else FAIL} Quote:    {quote.get('price', quote.get('message'))}")
    sentiment = fh.get_sentiment(SYMBOL)
    print(f"{PASS if 'score' in sentiment else FAIL} Sentiment: score = {sentiment.get('score', sentiment.get('message'))}")
    news = fh.get_market_news("general")
    count = len(news) if isinstance(news, list) else 0
    print(f"{PASS if count > 0 else FAIL} News:     {count} articles fetched")

def test_twelvedata():
    print("\n── Twelvedata ───────────────────────────────")
    td = TwelvedataFetcher()
    quote = td.get_quote(SYMBOL)
    print(f"{PASS if 'price' in quote else FAIL} Quote:    {quote.get('price', quote.get('message'))}")
    series = td.get_time_series(SYMBOL, interval="1day", outputsize=5)
    count = len(series) if isinstance(series, list) else 0
    print(f"{PASS if count > 0 else FAIL} Daily:    {count} bars fetched")
    forex = td.get_forex_rate("USD", "INR")
    print(f"{PASS if 'rate' in forex else FAIL} Forex:    USD/INR = {forex.get('rate', forex.get('message'))}")

if __name__ == "__main__":
    print("=" * 50)
    print("  QUANTA-Fusion API Connectivity Test")
    print("=" * 50)
    test_alpha_vantage()
    test_finnhub()
    test_twelvedata()
    print("\n" + "=" * 50)
    print("  Test complete — check ✅ / ❌ above")
    print("=" * 50)
    