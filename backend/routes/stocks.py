"""
stocks.py
Stock routes — top 10, chart data, detail, sub-charts, report, indices.
Now powered by Finnhub (quotes) + Twelvedata (charts) + AV (fundamentals).
"""

from flask import Blueprint, jsonify, request
from quanta_fusion.ingestion.finnhub_fetcher import FinnhubFetcher
from quanta_fusion.ingestion.twelvedata_fetcher import TwelvedataFetcher
from quanta_fusion.ingestion.alpha_vantage_fetcher import AlphaVantageFetcher
from quanta_fusion.utils.config_loader import get_stock_universe, get_indices
import datetime
import numpy as np

stocks_bp = Blueprint("stocks", __name__)

# ── Fetcher instances (shared, cached) ───────────────────────────────────────
fh = FinnhubFetcher()
td = TwelvedataFetcher()
av = AlphaVantageFetcher()

TOP_STOCKS = get_stock_universe()
INDICES    = get_indices()


def _safe(val, default="N/A"):
    if val is None or val == "":
        return default
    try:
        if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
            return default
    except Exception:
        pass
    return val


# ── Routes ───────────────────────────────────────────────────────────────────

@stocks_bp.route("/stocks/top")
def top_stocks():
    """Return top 10 stocks with live price data via Finnhub."""
    results = []
    for sym in TOP_STOCKS:
        quote = fh.get_quote(sym)
        if fh.is_error(quote):
            quote = td.get_quote(sym)  # fallback to Twelvedata
        results.append({
            "symbol":    sym,
            "price":     _safe(quote.get("price"), 0),
            "change":    _safe(quote.get("change"), 0),
            "changePct": _safe(quote.get("change_pct"), 0),
            "high":      _safe(quote.get("high"), 0),
            "low":       _safe(quote.get("low"), 0),
            "prevClose": _safe(quote.get("prev_close"), 0),
        })
    return jsonify(results)


@stocks_bp.route("/stocks/<sym>/chart")
def stock_chart(sym):
    """Return OHLCV chart data via Twelvedata."""
    period   = request.args.get("period", "1mo")
    interval = request.args.get("interval", "1day")

    # Map yfinance period → Twelvedata outputsize
    period_map = {
        "1d": 1, "5d": 5, "1mo": 30,
        "3mo": 90, "6mo": 180, "1y": 365
    }
    outputsize = period_map.get(period, 30)

    data = td.get_time_series(sym.upper(), interval=interval, outputsize=outputsize)

    if td.is_error(data):
        return jsonify({"error": data.get("message")}), 500

    result = []
    for bar in data:
        try:
            import datetime as dt
            dt_val = bar.get("datetime", "")
            if "T" in dt_val or len(dt_val) == 10:
                parsed = dt.datetime.fromisoformat(dt_val)
            else:
                parsed = dt.datetime.strptime(dt_val, "%Y-%m-%d %H:%M:%S")
            result.append({
                "time":   int(parsed.timestamp()),
                "open":   bar["open"],
                "high":   bar["high"],
                "low":    bar["low"],
                "close":  bar["close"],
                "volume": bar["volume"],
            })
        except Exception:
            continue
    return jsonify(result)


@stocks_bp.route("/stocks/<sym>/detail")
def stock_detail(sym):
    """Return company fundamentals via Finnhub."""
    sym = sym.upper()
    fins = fh.get_basic_financials(sym)
    quote = fh.get_quote(sym)

    if fh.is_error(fins):
        return jsonify({"error": fins.get("message")}), 500

    return jsonify({
        "symbol":          sym,
        "price":           _safe(quote.get("price")),
        "change":          _safe(quote.get("change")),
        "changePct":       _safe(quote.get("change_pct")),
        "pe":              _safe(fins.get("pe")),
        "eps":             _safe(fins.get("eps")),
        "fiftyTwoWeekHigh": _safe(fins.get("52_week_high")),
        "fiftyTwoWeekLow":  _safe(fins.get("52_week_low")),
        "marketCap":       _safe(fins.get("market_cap")),
        "dividendYield":   _safe(fins.get("dividend_yield")),
        "beta":            _safe(fins.get("beta")),
        "revenueGrowth":   _safe(fins.get("revenue_growth")),
        "grossMargin":     _safe(fins.get("gross_margin")),
        "netMargin":       _safe(fins.get("net_margin")),
        "roe":             _safe(fins.get("roe")),
        "roa":             _safe(fins.get("roa")),
    })


@stocks_bp.route("/stocks/<sym>/sub-charts")
def stock_sub_charts(sym):
    """Liquidity, volatility, scalability from Twelvedata daily data."""
    data = td.get_time_series(sym.upper(), interval="1day", outputsize=90)

    if td.is_error(data) or not data:
        return jsonify({"liquidity": [], "volatility": [], "scalability": []})

    import pandas as pd
    df = pd.DataFrame(data)
    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("datetime")
    df["ts"] = df["datetime"].astype(int) // 10**9

    # Liquidity — raw volume
    liquidity = [{"time": int(r.ts), "value": int(r.volume)}
                 for r in df.itertuples()]

    # Volatility — 10-day rolling std of returns
    df["returns"] = df["close"].pct_change()
    df["vol"] = df["returns"].rolling(10).std() * 100
    volatility = [{"time": int(r.ts), "value": round(float(r.vol), 4)}
                  for r in df.dropna(subset=["vol"]).itertuples()]

    # Scalability — 20-day rolling avg volume
    df["avg_vol"] = df["volume"].rolling(20).mean()
    scalability = [{"time": int(r.ts), "value": int(r.avg_vol)}
                   for r in df.dropna(subset=["avg_vol"]).itertuples()]

    return jsonify({
        "liquidity":   liquidity,
        "volatility":  volatility,
        "scalability": scalability,
    })


@stocks_bp.route("/stocks/<sym>/report")
def stock_report(sym):
    """Generate report data combining Finnhub + Twelvedata."""
    sym = sym.upper()
    fins  = fh.get_basic_financials(sym)
    quote = fh.get_quote(sym)
    hist  = td.get_time_series(sym, interval="1day", outputsize=30)

    history = []
    if not td.is_error(hist):
        for bar in hist:
            history.append({
                "date":   bar.get("datetime", "")[:10],
                "close":  bar.get("close"),
                "volume": bar.get("volume"),
            })

    return jsonify({
        "generated": datetime.datetime.now().isoformat(),
        "symbol":    sym,
        "price":     _safe(quote.get("price")),
        "pe":        _safe(fins.get("pe")),
        "eps":       _safe(fins.get("eps")),
        "beta":      _safe(fins.get("beta")),
        "marketCap": _safe(fins.get("market_cap")),
        "history":   history,
    })


@stocks_bp.route("/indices")
def get_indices():
    """Return major market indices via Twelvedata."""
    index_symbols = {
        "S&P 500":      "SPX",
        "NASDAQ":       "IXIC",
        "DOW JONES":    "DJI",
        "NIFTY 50":     "NSEI",
        "FTSE 100":     "FTSE",
    }
    results = []
    for name, sym in index_symbols.items():
        quote = td.get_quote(sym)
        results.append({
            "name":      name,
            "symbol":    sym,
            "price":     _safe(quote.get("price"), 0),
            "change":    _safe(quote.get("change"), 0),
            "changePct": _safe(quote.get("change_pct"), 0),
        })
    return jsonify(results)