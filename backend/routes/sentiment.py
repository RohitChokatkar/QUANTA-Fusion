"""
sentiment.py
Sentiment analysis route — VADER on Finnhub + RSS news headlines.
"""

from flask import Blueprint, jsonify
from quanta_fusion.ingestion.finnhub_fetcher import FinnhubFetcher
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import feedparser
import re
import datetime

sentiment_bp = Blueprint("sentiment", __name__)

fh       = FinnhubFetcher()
analyzer = SentimentIntensityAnalyzer()

RSS_FEEDS = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s={sym}&region=US&lang=en-US",
    "https://news.google.com/rss/search?q={sym}+stock&hl=en-US&gl=US&ceid=US:en",
]


def _clean(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


def _score(title):
    s = analyzer.polarity_scores(title)
    return {
        "compound": round(s["compound"], 3),
        "positive": round(s["pos"], 3),
        "negative": round(s["neg"], 3),
        "neutral":  round(s["neu"], 3),
    }


def _label(compound):
    if compound >= 0.05:
        return "positive"
    elif compound <= -0.05:
        return "negative"
    return "neutral"


@sentiment_bp.route("/stocks/<sym>/sentiment")
def get_sentiment(sym):
    """Analyze news headlines for sentiment using VADER."""
    sym = sym.upper()
    headlines = []

    # ── 1. Try Finnhub company news ──────────────────────────────────────────
    today     = datetime.date.today().isoformat()
    week_ago  = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    fh_news   = fh.get_company_news(sym, week_ago, today)

    if isinstance(fh_news, list) and fh_news:
        for article in fh_news[:15]:
            title = _clean(article.get("headline", ""))
            if not title:
                continue
            sentiment = _score(title)
            headlines.append({
                "title":     title,
                "link":      article.get("url", ""),
                "source":    article.get("source", "Finnhub"),
                "published": article.get("published", ""),
                "sentiment": sentiment,
                "label":     _label(sentiment["compound"]),
            })

    # ── 2. Fallback to RSS feeds if Finnhub returned nothing ─────────────────
    if not headlines:
        for url_tpl in RSS_FEEDS:
            try:
                feed = feedparser.parse(url_tpl.format(sym=sym))
                for entry in feed.entries[:10]:
                    title = _clean(entry.get("title", ""))
                    if not title:
                        continue
                    sentiment = _score(title)
                    headlines.append({
                        "title":     title,
                        "link":      entry.get("link", ""),
                        "source":    "RSS",
                        "published": entry.get("published", ""),
                        "sentiment": sentiment,
                        "label":     _label(sentiment["compound"]),
                    })
            except Exception:
                continue

    # ── 3. Last resort — simulated headlines ─────────────────────────────────
    if not headlines:
        simulated = [
            f"{sym} reports strong quarterly earnings beating estimates",
            f"Analysts upgrade {sym} to buy rating",
            f"{sym} faces headwinds from rising interest rates",
            f"Market volatility impacts {sym} trading volume",
            f"{sym} announces new product line expansion",
        ]
        for h in simulated:
            sentiment = _score(h)
            headlines.append({
                "title":     h,
                "link":      "",
                "source":    "Simulated",
                "published": "",
                "sentiment": sentiment,
                "label":     _label(sentiment["compound"]),
            })

    # ── Aggregate score ───────────────────────────────────────────────────────
    compounds = [h["sentiment"]["compound"] for h in headlines]
    avg = round(sum(compounds) / len(compounds), 3) if compounds else 0

    # ── Sentiment trend (group by positive/negative/neutral counts) ──────────
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for h in headlines:
        counts[h["label"]] += 1

    total = len(headlines)
    breakdown = {
        "positive": round(counts["positive"] / total * 100, 1),
        "negative": round(counts["negative"] / total * 100, 1),
        "neutral":  round(counts["neutral"]  / total * 100, 1),
    }

    return jsonify({
        "symbol":           sym,
        "overallSentiment": avg,
        "overallLabel":     _label(avg),
        "breakdown":        breakdown,
        "totalHeadlines":   total,
        "headlines":        headlines[:15],
    })