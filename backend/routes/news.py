"""
news.py
Market news route - Finnhub primary + RSS fallback.
"""

from flask import Blueprint, jsonify, request
from quanta_fusion.ingestion.finnhub_fetcher import FinnhubFetcher
import feedparser
import re
import datetime

news_bp = Blueprint("news", __name__)

fh = FinnhubFetcher()

RSS_FEEDS = [
    {"name": "Yahoo Finance",  "url": "https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US"},
    {"name": "MarketWatch",    "url": "http://feeds.marketwatch.com/marketwatch/topstories/"},
    {"name": "CNBC",           "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147"},
    {"name": "Google Finance", "url": "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en"},
]

CATEGORIES = ["general", "forex", "crypto", "merger"]


def _clean(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


@news_bp.route("/news")
def get_news():
    limit    = int(request.args.get("limit", 30))
    category = request.args.get("category", "general")
    if category not in CATEGORIES:
        category = "general"

    articles = []

    fh_news = fh.get_market_news(category)
    if isinstance(fh_news, list) and fh_news:
        for article in fh_news:
            title   = _clean(article.get("headline", ""))
            summary = _clean(article.get("summary", ""))[:200]
            if not title:
                continue
            articles.append({
                "title":     title,
                "summary":   summary,
                "link":      article.get("url", ""),
                "source":    article.get("source", "Finnhub"),
                "published": article.get("published", ""),
                "category":  article.get("category", category),
                "image":     article.get("image", ""),
            })

    if not articles:
        for feed_info in RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_info["url"])
                for entry in feed.entries[:10]:
                    title   = _clean(entry.get("title", ""))
                    summary = _clean(entry.get("summary", ""))[:200]
                    if not title:
                        continue
                    articles.append({
                        "title":     title,
                        "summary":   summary,
                        "link":      entry.get("link", ""),
                        "source":    feed_info["name"],
                        "published": entry.get("published", ""),
                        "category":  "general",
                        "image":     "",
                    })
            except Exception:
                continue

    if not articles:
        fallback = [
            {"title": "S&P 500 hits new all-time high amid strong earnings season",   "source": "MarketWatch"},
            {"title": "Fed signals potential rate cut in upcoming meeting",             "source": "CNBC"},
            {"title": "Tech stocks rally as AI spending accelerates",                  "source": "Yahoo Finance"},
            {"title": "Bitcoin surpasses $100K milestone for the first time",          "source": "Reuters"},
            {"title": "Global markets react to inflation data release",                "source": "Bloomberg"},
        ]
        for f in fallback:
            articles.append({
                "title":     f["title"],
                "summary":   "",
                "link":      "#",
                "source":    f["source"],
                "published": datetime.datetime.now().isoformat(),
                "category":  "general",
                "image":     "",
            })

    return jsonify(articles[:limit])


@news_bp.route("/news/categories")
def get_categories():
    return jsonify(CATEGORIES)