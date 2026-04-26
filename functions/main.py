"""
QuantFusion v2.0 — Firebase Cloud Function Backend
Serves REST API for the React frontend.
Uses direct HTTP calls to Fyers API (no SDK = no dependency conflicts).
"""

from firebase_functions import https_fn, options
from flask import Flask, jsonify, request as flask_request
import os
import logging
import requests as http
from datetime import datetime, timedelta
import numpy as np
import pytz

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("quantfusion")

app = Flask(__name__)

# ── Config from environment ──────────────────────────
FYERS_CLIENT_ID = os.environ.get("FYERS_CLIENT_ID", "")
FYERS_ACCESS_TOKEN = os.environ.get("FYERS_ACCESS_TOKEN", "")
TWELVE_DATA_KEY = os.environ.get("TWELVE_DATA_API_KEY", "")
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "")

FYERS_BASE = "https://api-t1.fyers.in/api/v3"

TOP_BSE_SYMBOLS = [
    "BSE:RELIANCE-EQ", "BSE:TCS-EQ", "BSE:INFY-EQ",
    "BSE:HDFCBANK-EQ", "BSE:ICICIBANK-EQ", "BSE:ITC-EQ",
    "BSE:SBIN-EQ", "BSE:BHARTIARTL-EQ", "BSE:KOTAKBANK-EQ",
    "BSE:LT-EQ",
]

INDEX_SYMBOLS = [
    "NSE:NIFTY50-INDEX", "BSE:SENSEX-INDEX",
    "NSE:NIFTYBANK-INDEX", "NSE:NIFTYIT-INDEX",
]


# ── Fyers Direct HTTP Helpers ────────────────────────
def _fyers_headers():
    return {"Authorization": f"{FYERS_CLIENT_ID}:{FYERS_ACCESS_TOKEN}"}


def _clean_name(symbol):
    return symbol.replace("BSE:", "").replace("NSE:", "").replace("-EQ", "").replace("-INDEX", "")


def _fyers_quote(symbol):
    """Get quote from Fyers REST API directly (no SDK)."""
    try:
        resp = http.get(
            f"{FYERS_BASE}/quotes/",
            headers=_fyers_headers(),
            params={"symbols": symbol},
            timeout=10,
        )
        data = resp.json()
        if data.get("d"):
            q = data["d"][0]["v"]
            lp = q.get("lp", 0)
            prev = q.get("prev_close_price", 0)
            ch = q.get("ch", 0)
            chp = q.get("chp", 0)
            if ch == 0 and lp > 0 and prev > 0:
                ch = round(lp - prev, 2)
                chp = round((ch / prev) * 100, 2)
            return {
                "symbol": symbol, "name": _clean_name(symbol),
                "price": lp, "open": q.get("open_price", 0),
                "high": q.get("high_price", 0), "low": q.get("low_price", 0),
                "close": q.get("close_price", lp), "previous_close": prev,
                "change": ch, "change_percent": chp,
                "volume": q.get("volume", 0), "timestamp": q.get("tt", 0),
                "bid": q.get("bid", 0), "ask": q.get("ask", 0),
                "currency": "INR",
            }
    except Exception as e:
        logger.error(f"Fyers quote error for {symbol}: {e}")
    return _td_quote(symbol)


def _fyers_history(symbol, resolution="D", days=90):
    """Get OHLCV history from Fyers REST API directly."""
    try:
        now = datetime.now()
        start = now - timedelta(days=days)
        resp = http.get(
            f"{FYERS_BASE}/history/",
            headers=_fyers_headers(),
            params={
                "symbol": symbol,
                "resolution": resolution,
                "date_format": "1",
                "range_from": start.strftime("%Y-%m-%d"),
                "range_to": now.strftime("%Y-%m-%d"),
                "cont_flag": "1",
            },
            timeout=15,
        )
        data = resp.json()
        if data.get("candles"):
            return [
                {
                    "time": datetime.fromtimestamp(c[0]).isoformat(),
                    "open": c[1], "high": c[2], "low": c[3],
                    "close": c[4], "volume": int(c[5]),
                }
                for c in data["candles"]
            ]
    except Exception as e:
        logger.error(f"Fyers history error: {e}")
    return _td_history(symbol, days)


# ── TwelveData Fallback ──────────────────────────────
def _td_quote(symbol):
    """TwelveData fallback for quotes."""
    if not TWELVE_DATA_KEY:
        return _empty_quote(symbol)
    clean = _clean_name(symbol)
    td_sym = f"{clean}.BSE" if "BSE:" in symbol else clean
    try:
        resp = http.get(
            "https://api.twelvedata.com/quote",
            params={"symbol": td_sym, "apikey": TWELVE_DATA_KEY},
            timeout=10,
        )
        d = resp.json()
        if d.get("code"):
            return _empty_quote(symbol)
        price = float(d.get("close", 0))
        prev = float(d.get("previous_close", 0))
        ch = float(d.get("change", 0))
        chp = float(d.get("percent_change", 0))
        return {
            "symbol": symbol, "name": d.get("name", clean),
            "price": price, "open": float(d.get("open", 0)),
            "high": float(d.get("high", 0)), "low": float(d.get("low", 0)),
            "close": price, "previous_close": prev,
            "change": ch, "change_percent": chp,
            "volume": int(d.get("volume", 0) or 0),
            "currency": "INR",
        }
    except Exception:
        return _empty_quote(symbol)


def _td_history(symbol, days):
    """TwelveData fallback for history."""
    if not TWELVE_DATA_KEY:
        return []
    clean = _clean_name(symbol)
    td_sym = f"{clean}.BSE" if "BSE:" in symbol else clean
    try:
        resp = http.get(
            "https://api.twelvedata.com/time_series",
            params={"symbol": td_sym, "interval": "1day", "outputsize": min(days, 500), "apikey": TWELVE_DATA_KEY},
            timeout=15,
        )
        d = resp.json()
        if d.get("values"):
            return [
                {"time": v["datetime"], "open": float(v["open"]), "high": float(v["high"]),
                 "low": float(v["low"]), "close": float(v["close"]), "volume": int(v.get("volume", 0) or 0)}
                for v in reversed(d["values"])
            ]
    except Exception:
        pass
    return []


def _empty_quote(symbol):
    return {"symbol": symbol, "name": _clean_name(symbol), "price": 0, "change": 0, "change_percent": 0,
            "open": 0, "high": 0, "low": 0, "close": 0, "previous_close": 0, "volume": 0, "currency": "INR"}


# ── Model Runner ─────────────────────────────────────
def _run_models(closes, price):
    """Run all quant models on price data."""
    outputs = {}
    try:
        from models.garch import garch_forecast
        if len(closes) >= 30:
            outputs["garch"] = garch_forecast(closes)
    except Exception as e:
        logger.warning(f"GARCH error: {e}")

    try:
        from models.bsm import black_scholes
        sigma = (outputs.get("garch", {}).get("sigma", 25)) / 100
        outputs["blackScholes"] = black_scholes(price, price, 30/365, 0.055, sigma)
    except Exception as e:
        logger.warning(f"BSM error: {e}")

    try:
        from models.avellaneda_stoikov import avellaneda_stoikov
        sigma = (outputs.get("garch", {}).get("sigma", 25)) / 100
        outputs["avellanedaStoikov"] = avellaneda_stoikov(price, sigma)
    except Exception as e:
        logger.warning(f"A-S error: {e}")

    try:
        from models.vasicek import vasicek_forecast
        from models.vasicek import get_risk_free_rate
        outputs["vasicek"] = vasicek_forecast([6.5, 6.5, 6.25, 6.0, 5.9, 5.75, 5.5, 5.5])
    except Exception as e:
        logger.warning(f"Vasicek error: {e}")

    try:
        from models.rl_agent import rl_signal, compute_rsi, compute_momentum
        vol = outputs.get("garch", {}).get("sigma", 25)
        mom = compute_momentum(closes) if len(closes) > 5 else 0
        rsi = compute_rsi(closes) if len(closes) > 14 else 50
        sma20 = float(sum(closes[-20:])/20) if len(closes) >= 20 else price
        outputs["rlAgent"] = rl_signal(vol, 0, 0, mom, price, sma20, rsi)
    except Exception as e:
        logger.warning(f"RL error: {e}")

    return outputs


# ── Flask Routes ─────────────────────────────────────
@app.route("/")
def root():
    return jsonify({"name": "QuantFusion v2.0", "status": "running", "models": 10, "market": "BSE"})


@app.route("/health")
def health():
    return jsonify({"status": "ok", "has_token": bool(FYERS_ACCESS_TOKEN)})


@app.route("/api/quote/<symbol>")
def get_quote(symbol):
    quote = _fyers_quote(symbol)
    return jsonify(quote)


@app.route("/api/stocks/top")
def get_top_stocks():
    results = []
    for sym in TOP_BSE_SYMBOLS:
        q = _fyers_quote(sym)
        results.append(q)
    return jsonify({"stocks": results, "count": len(results)})


@app.route("/api/stocks/<sym>/chart")
def get_stock_chart(sym):
    res = flask_request.args.get("resolution", "D")
    days = int(flask_request.args.get("days", "90"))
    full = f"BSE:{sym.upper()}-EQ" if not sym.startswith("BSE:") and not sym.startswith("NSE:") else sym
    res_map = {"1": "1", "5": "5", "15": "15", "60": "60", "D": "D"}
    candles = _fyers_history(full, res_map.get(res, "D"), days)
    return jsonify({"symbol": full, "resolution": res, "candles": candles, "count": len(candles)})


@app.route("/api/stocks/<sym>/detail")
def get_stock_detail(sym):
    full = f"BSE:{sym.upper()}-EQ" if not sym.startswith("BSE:") and not sym.startswith("NSE:") else sym
    quote = _fyers_quote(full)
    return jsonify(quote)


@app.route("/api/history/<symbol>")
def get_history(symbol):
    interval = flask_request.args.get("interval", "5min")
    days = int(flask_request.args.get("days", "1"))
    res_map = {"1min": "1", "5min": "5", "15min": "15", "1h": "60", "1day": "D"}
    bars = _fyers_history(symbol, res_map.get(interval, "5"), days)
    return jsonify({"symbol": symbol, "interval": interval, "bars": bars})


@app.route("/api/models")
def get_all_models():
    symbol = flask_request.args.get("symbol", "BSE:RELIANCE-EQ")
    history = _fyers_history(symbol, "D", 90)
    closes = [b["close"] for b in history if "close" in b]
    price = closes[-1] if closes else 0
    outputs = _run_models(closes, price)
    return jsonify({"symbol": symbol, "outputs": outputs})


@app.route("/api/models/<model_name>")
def get_model(model_name):
    symbol = flask_request.args.get("symbol", "BSE:RELIANCE-EQ")
    history = _fyers_history(symbol, "D", 90)
    closes = [b["close"] for b in history if "close" in b]
    price = closes[-1] if closes else 0
    outputs = _run_models(closes, price)
    out = outputs.get(model_name)
    if out is None:
        return jsonify({"error": f"Model '{model_name}' not available"}), 404
    return jsonify({"model": model_name, "data": out})


@app.route("/api/indices/live")
def get_indices():
    quotes = {}
    for sym in INDEX_SYMBOLS:
        quotes[sym] = _fyers_quote(sym)
    return jsonify({"indices": quotes})


@app.route("/api/forex/live")
def get_forex():
    pairs = ["USD/INR", "EUR/USD", "GBP/USD"]
    rates = {}
    if TWELVE_DATA_KEY:
        for pair in pairs:
            try:
                resp = http.get("https://api.twelvedata.com/price",
                                params={"symbol": pair, "apikey": TWELVE_DATA_KEY}, timeout=10)
                d = resp.json()
                rates[pair] = {"symbol": pair, "price": float(d.get("price", 0))}
            except Exception:
                rates[pair] = {"symbol": pair, "price": 0}
    return jsonify({"rates": rates})


@app.route("/api/sentiment/<symbol>")
def get_sentiment(symbol):
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        clean = _clean_name(symbol)
        headlines = [f"{clean} stock market performance", f"{clean} quarterly results"]
        scores = [analyzer.polarity_scores(h)["compound"] for h in headlines]
        avg = sum(scores) / len(scores) if scores else 0
        score = round((avg + 1) * 50, 1)
        return jsonify({"symbol": symbol, "score": score, "label": "bullish" if score > 55 else "bearish" if score < 45 else "neutral"})
    except Exception:
        return jsonify({"symbol": symbol, "score": 50, "label": "neutral"})


@app.route("/api/market-status")
def market_status():
    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)
    t = now.hour * 60 + now.minute
    is_open = now.weekday() < 5 and 555 <= t <= 930
    return jsonify({"is_open": is_open, "market": "BSE/NSE", "timezone": "IST",
                    "open_time": "09:15", "close_time": "15:30", "current_time": now.strftime("%H:%M:%S")})


@app.route("/api/symbol", methods=["POST"])
def set_symbol():
    body = flask_request.get_json(silent=True) or {}
    return jsonify({"symbol": body.get("symbol", "BSE:RELIANCE-EQ"), "status": "ok"})


# ── Firebase Cloud Function Entry Point ──────────────
@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["GET", "POST", "OPTIONS"]),
    memory=options.MemoryOption.GB_1,
    timeout_sec=300,
    region="asia-south1",
)
def api(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
