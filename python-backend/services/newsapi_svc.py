"""
NewsAPI Service — Indian market news + VADER sentiment scoring.
Fetches headlines about BSE stocks and Indian market.
"""

import os
import logging

import httpx

logger = logging.getLogger(__name__)

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _analyzer = SentimentIntensityAnalyzer()
    HAS_VADER = True
except ImportError:
    HAS_VADER = False
    logger.warning("vaderSentiment not installed — using simple word scoring")


# Simple word-based fallback scoring
_POS = {"surge", "soar", "jump", "gain", "rally", "bull", "profit", "rise", "growth",
        "strong", "beat", "record", "high", "boost", "upgrade", "buy", "optimistic",
        "innovation", "breakthrough", "success", "revenue", "outperform", "expand"}
_NEG = {"crash", "plunge", "drop", "fall", "decline", "bear", "loss", "down", "weak",
        "sell", "miss", "low", "cut", "warning", "risk", "fear", "concern", "downgrade",
        "layoff", "bankruptcy", "debt", "lawsuit", "fraud", "crisis"}


def score_headline(text: str) -> float:
    """Score a headline from -1 (bearish) to +1 (bullish)."""
    if HAS_VADER:
        return _analyzer.polarity_scores(text)["compound"]
    words = text.lower().split()
    s = sum(1 for w in words if w in _POS) - sum(1 for w in words if w in _NEG)
    return max(-1.0, min(1.0, s / max(len(words) * 0.1, 1)))


async def fetch_indian_news(symbol: str = "", limit: int = 20) -> list[dict]:
    """Fetch Indian market news from NewsAPI."""
    api_key = os.getenv("NEWS_API_KEY", "")
    stock_name = symbol.replace("BSE:", "").replace("-EQ", "")
    keywords = f"{stock_name} OR BSE OR Sensex OR Indian stock market"

    headlines: list[dict] = []

    if api_key:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": keywords,
                        "language": "en",
                        "sortBy": "publishedAt",
                        "pageSize": limit,
                        "apiKey": api_key,
                    },
                )
                data = resp.json()
                if data.get("status") == "ok":
                    for article in data.get("articles", [])[:limit]:
                        title = article.get("title", "")
                        if title and title != "[Removed]":
                            headlines.append({
                                "title": title,
                                "source": article.get("source", {}).get("name", ""),
                                "url": article.get("url", ""),
                                "published": article.get("publishedAt", ""),
                                "score": score_headline(title),
                            })
        except Exception as e:
            logger.warning(f"NewsAPI fetch failed: {e}")

    # Fallback: generate sample Indian market headlines
    if not headlines:
        headlines = _sample_headlines(stock_name)

    return headlines


async def get_sentiment_summary(symbol: str) -> dict:
    """Get aggregated sentiment analysis for a BSE stock."""
    headlines = await fetch_indian_news(symbol)

    if not headlines:
        return {
            "score": 50, "positiveHeadlines": [], "negativeHeadlines": [],
            "breakdown": {"positive": 33, "neutral": 34, "negative": 33},
        }

    scores = [h["score"] for h in headlines]
    avg_score = sum(scores) / len(scores) if scores else 0
    bullish_score = round((avg_score + 1) / 2 * 100, 1)

    positive = [h["title"] for h in headlines if h["score"] > 0.1][:3]
    negative = [h["title"] for h in headlines if h["score"] < -0.1][:3]

    pos_count = sum(1 for s in scores if s > 0.1)
    neg_count = sum(1 for s in scores if s < -0.1)
    neu_count = len(scores) - pos_count - neg_count
    total = len(scores) or 1

    return {
        "score": bullish_score,
        "positiveHeadlines": positive,
        "negativeHeadlines": negative,
        "breakdown": {
            "positive": round(pos_count / total * 100, 1),
            "neutral": round(neu_count / total * 100, 1),
            "negative": round(neg_count / total * 100, 1),
        },
    }


def _sample_headlines(stock: str) -> list[dict]:
    """Sample headlines for demo when NewsAPI key is not available."""
    samples = [
        {"title": f"{stock} shares gain momentum as Q4 results beat estimates", "score": 0.6},
        {"title": f"BSE Sensex rallies 400 points on strong FII inflows", "score": 0.5},
        {"title": f"Indian stock market sees record participation from retail investors", "score": 0.3},
        {"title": f"{stock} faces headwinds amid global uncertainty", "score": -0.3},
        {"title": f"RBI holds repo rate steady at 5.5%, markets react positively", "score": 0.2},
        {"title": f"BSE MIDCAP index outperforms benchmark Sensex this quarter", "score": 0.4},
        {"title": f"Foreign investors turn cautious on emerging market risk", "score": -0.4},
        {"title": f"{stock} announces expansion plans, analysts upgrade target", "score": 0.7},
        {"title": f"Indian rupee strengthens against dollar boosting market sentiment", "score": 0.3},
        {"title": f"Auto sector stocks rally on strong domestic sales data", "score": 0.5},
    ]
    for s in samples:
        s["source"] = "Sample News"
        s["url"] = ""
        s["published"] = ""
    return samples
