"""
FastAPI REST routes — All model endpoints + BSE/NSE data + Forex + Indices.
Includes admin token refresh endpoint and new stock data endpoints.
"""

import os
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Query, Header, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from token_manager import get_valid_token, save_token, get_token_info
from auto_refresh import apply_token_to_client

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Admin secret for protected endpoints ─────────────
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "changeme")

# ── Top BSE symbols for /stocks/top ──────────────────
TOP_BSE_SYMBOLS = [
    "BSE:RELIANCE-EQ", "BSE:TCS-EQ", "BSE:INFY-EQ",
    "BSE:HDFCBANK-EQ", "BSE:ICICIBANK-EQ", "BSE:ITC-EQ",
    "BSE:SBIN-EQ", "BSE:BHARTIARTL-EQ", "BSE:KOTAKBANK-EQ",
    "BSE:LT-EQ",
]


def _check_token_error(response: dict) -> bool:
    """Check if a Fyers response indicates token expiry."""
    if not response:
        return False
    code = response.get("code") or response.get("s")
    msg = str(response.get("message", "")).lower()
    # Fyers returns code -16 for expired tokens
    if code == -16 or "token" in msg and "expired" in msg:
        return True
    if code == -300 or "invalid token" in msg:
        return True
    return False


def _token_expired_response():
    """Standard 401 response for expired/invalid tokens."""
    return JSONResponse(
        status_code=401,
        content={
            "error": "token_expired",
            "message": "Fyers token needs refresh. Use POST /api/admin/refresh-token to update it.",
        },
    )


# ── Admin: Refresh Token ────────────────────────────
@router.post("/admin/refresh-token")
async def admin_refresh_token(
    request: Request,
    x_admin_secret: Optional[str] = Header(None),
):
    """
    Manually refresh the Fyers access token.
    Send POST with JSON body: {"access_token": "your_new_token"}
    Protected by X-Admin-Secret header.
    """
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    body = await request.json()
    new_token = body.get("access_token", "").strip()

    if not new_token:
        raise HTTPException(status_code=400, detail="access_token is required in request body")

    # Save token to memory
    save_token(new_token)

    # Apply to Fyers clients
    dm = request.app.state.data_manager
    apply_token_to_client(dm)

    return {
        "status": "ok",
        "message": "Token refreshed and applied to all clients",
        "token_info": get_token_info(),
    }


@router.get("/admin/token-status")
async def admin_token_status(
    x_admin_secret: Optional[str] = Header(None),
):
    """Check current token status. Protected by admin secret."""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return get_token_info()


# ── Stock Quotes ─────────────────────────────────────
@router.get("/quote/{symbol}")
async def get_quote(request: Request, symbol: str):
    """Get live BSE/NSE quote."""
    dm = request.app.state.data_manager
    try:
        quote = await dm.get_quote(symbol)

        # ── DEBUG: Log outgoing quote ──
        logger.debug("[API_DEBUG] /quote/%s → price=%.2f change=%.2f",
                     symbol, quote.get("price", 0), quote.get("change", 0))

        return quote
    except Exception as e:
        logger.error(f"Quote failed for {symbol}: {e}")
        if "token" in str(e).lower() and ("expired" in str(e).lower() or "invalid" in str(e).lower()):
            return _token_expired_response()
        return JSONResponse(status_code=500, content={"error": "quote_failed", "message": str(e)})


@router.get("/stocks/top")
async def get_top_stocks(request: Request):
    """
    Get quotes for the top 10 BSE stocks.
    Returns price, change, change_percent, volume, 52-week high/low.
    """
    dm = request.app.state.data_manager
    results = []

    for sym in TOP_BSE_SYMBOLS:
        try:
            quote = await dm.get_quote(sym)

            # Check for token expiry in the response
            if isinstance(quote, dict) and quote.get("error") == "token_expired":
                return _token_expired_response()

            results.append({
                "symbol": sym,
                "name": quote.get("name", sym),
                "price": quote.get("price", 0),
                "change": quote.get("change", 0),
                "change_percent": quote.get("change_percent", 0),
                "volume": quote.get("volume", 0),
                "high": quote.get("high", 0),
                "low": quote.get("low", 0),
                "previous_close": quote.get("previous_close", 0),
                "currency": "INR",
            })
        except Exception as e:
            logger.warning(f"Top stocks: failed for {sym}: {e}")
            if "token" in str(e).lower():
                return _token_expired_response()
            results.append({
                "symbol": sym,
                "name": sym.replace("BSE:", "").replace("-EQ", ""),
                "price": 0, "change": 0, "change_percent": 0,
                "volume": 0, "high": 0, "low": 0,
                "error": str(e),
            })

    return {"stocks": results, "count": len(results)}


@router.get("/stocks/{sym}/chart")
async def get_stock_chart(
    request: Request,
    sym: str,
    resolution: str = Query("D"),
    days: int = Query(90),
):
    """
    Get OHLCV chart data for a BSE stock.
    Symbol should be plain name (e.g., RELIANCE). Automatically prefixed with BSE:-EQ.
    """
    dm = request.app.state.data_manager

    # Build full Fyers symbol if not already formatted
    if not sym.startswith("BSE:") and not sym.startswith("NSE:"):
        full_symbol = f"BSE:{sym.upper()}-EQ"
    else:
        full_symbol = sym

    # Map resolution for the API
    interval_map = {"1": "1min", "5": "5min", "15": "15min", "60": "1h", "D": "1day"}
    interval = interval_map.get(resolution, "1day")

    try:
        bars = await dm.get_history(full_symbol, interval, days)

        if not bars:
            return JSONResponse(
                status_code=404,
                content={"error": "no_data", "message": f"No chart data for {full_symbol}"},
            )

        # Format candles with human-readable timestamps
        candles = []
        for bar in bars:
            candle = {
                "timestamp": bar.get("time", ""),
                "date": bar.get("time", "")[:10] if isinstance(bar.get("time"), str) else "",
                "open": bar.get("open", 0),
                "high": bar.get("high", 0),
                "low": bar.get("low", 0),
                "close": bar.get("close", 0),
                "volume": bar.get("volume", 0),
            }
            candles.append(candle)

        return {
            "symbol": full_symbol,
            "resolution": resolution,
            "days": days,
            "candles": candles,
            "count": len(candles),
        }
    except Exception as e:
        logger.error(f"Chart failed for {full_symbol}: {e}")
        if "token" in str(e).lower():
            return _token_expired_response()
        return JSONResponse(status_code=500, content={"error": "chart_failed", "message": str(e)})


@router.get("/stocks/{sym}/detail")
async def get_stock_detail(request: Request, sym: str):
    """
    Get detailed quote for a single BSE stock.
    Returns all available fields: price, OHLC, volume, change, etc.
    """
    dm = request.app.state.data_manager

    # Build full Fyers symbol
    if not sym.startswith("BSE:") and not sym.startswith("NSE:"):
        full_symbol = f"BSE:{sym.upper()}-EQ"
    else:
        full_symbol = sym

    try:
        quote = await dm.get_quote(full_symbol)

        return {
            "symbol": full_symbol,
            "name": quote.get("name", sym),
            "price": quote.get("price", 0),
            "open": quote.get("open", 0),
            "high": quote.get("high", 0),
            "low": quote.get("low", 0),
            "close": quote.get("close", 0),
            "previous_close": quote.get("previous_close", 0),
            "change": quote.get("change", 0),
            "change_percent": quote.get("change_percent", 0),
            "volume": quote.get("volume", 0),
            "bid": quote.get("bid", 0),
            "ask": quote.get("ask", 0),
            "timestamp": quote.get("timestamp", 0),
            "currency": "INR",
        }
    except Exception as e:
        logger.error(f"Detail failed for {full_symbol}: {e}")
        if "token" in str(e).lower():
            return _token_expired_response()
        return JSONResponse(status_code=500, content={"error": "detail_failed", "message": str(e)})


# ── History ──────────────────────────────────────────
@router.get("/history/{symbol}")
async def get_history(
    request: Request,
    symbol: str,
    interval: str = Query("5min"),
    days: int = Query(1),
):
    """Get OHLCV history for a BSE/NSE symbol."""
    dm = request.app.state.data_manager
    try:
        data = await dm.get_history(symbol, interval, days)

        logger.debug("[API_DEBUG] /history/%s → %d bars (interval=%s, days=%d)",
                     symbol, len(data), interval, days)

        return {"symbol": symbol, "interval": interval, "bars": data}
    except Exception as e:
        logger.error(f"History failed for {symbol}: {e}")
        if "token" in str(e).lower():
            return _token_expired_response()
        return JSONResponse(status_code=500, content={"error": "history_failed", "message": str(e)})


# ── Models ───────────────────────────────────────────
@router.get("/models")
async def get_all_models(request: Request):
    """Get all model outputs for the active symbol."""
    dm = request.app.state.data_manager
    return {
        "symbol": dm._active_symbol,
        "outputs": dm.outputs,
    }


@router.get("/models/{model_name}")
async def get_model(request: Request, model_name: str):
    """Get a specific model output."""
    dm = request.app.state.data_manager
    output = dm.outputs.get(model_name)
    if output is None:
        return {"error": f"Model '{model_name}' not available yet"}
    return {"model": model_name, "data": output}


@router.post("/symbol")
async def set_symbol(request: Request):
    """Set the active BSE/NSE symbol."""
    body = await request.json()
    symbol = body.get("symbol", "BSE:RELIANCE-EQ")
    dm = request.app.state.data_manager
    await dm.set_symbol(symbol)
    logger.info("[API] Active symbol changed to %s", symbol)
    return {"symbol": symbol, "status": "ok"}


# ── Indices ──────────────────────────────────────────
@router.get("/indices/live")
async def get_indices_live(request: Request):
    """Get live quotes for all tracked indices."""
    from services.data_manager import DEFAULT_INDEX_SYMBOLS
    dm = request.app.state.data_manager
    quotes = {}
    for sym in DEFAULT_INDEX_SYMBOLS:
        try:
            q = await dm.get_quote(sym)
            quotes[sym] = q
        except Exception as e:
            logger.warning("Index quote failed for %s: %s", sym, e)
    return {"indices": quotes}


# ── Forex ────────────────────────────────────────────
@router.get("/forex/live")
async def get_forex_live(request: Request):
    """Get live forex rates snapshot."""
    dm = request.app.state.data_manager
    rates = await dm.td_client.get_live_rates()
    return {"rates": rates}

@router.get("/forex/history")
async def get_forex_history(
    request: Request,
    symbol: str = Query("USD/INR"),
    interval: str = Query("5min"),
    days: int = Query(1),
):
    """Get OHLCV history for a forex symbol."""
    dm = request.app.state.data_manager
    data = await dm.td_client.get_history(symbol, interval, 100)
    return {"symbol": symbol, "interval": interval, "bars": data}


# ── Sentiment ────────────────────────────────────────
@router.get("/sentiment/{symbol}")
async def get_sentiment(request: Request, symbol: str):
    """Get sentiment analysis for a BSE stock."""
    from services.newsapi_svc import get_sentiment_summary
    return await get_sentiment_summary(symbol)


# ── Portfolio ────────────────────────────────────────
@router.get("/portfolio/optimize")
async def optimize_portfolio(
    request: Request,
    tickers: str = Query("BSE:RELIANCE-EQ,BSE:TCS-EQ,BSE:INFY-EQ"),
    risk_aversion: float = Query(2.5),
):
    """Run Markowitz optimization on BSE stocks."""
    from models.markowitz import markowitz_optimize
    dm = request.app.state.data_manager

    ticker_list = [t.strip() for t in tickers.split(",")]
    price_matrix = []
    for t in ticker_list:
        history = await dm.rest_client.get_history(t, "1day", 365)
        closes = [bar["close"] for bar in history if "close" in bar]
        price_matrix.append(closes)

    risk_free = 0.055  # 5.5% RBI repo rate
    result = markowitz_optimize(ticker_list, price_matrix, risk_free)
    return result


# ── Market Status ────────────────────────────────────
@router.get("/market-status")
async def market_status():
    """Check if BSE/NSE market is open (IST hours)."""
    from datetime import datetime
    import pytz

    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    hour = now.hour
    minute = now.minute
    day = now.weekday()

    is_weekday = day < 5
    time_val = hour * 60 + minute
    market_open = 9 * 60 + 15  # 9:15
    market_close = 15 * 60 + 30  # 15:30

    is_open = is_weekday and market_open <= time_val <= market_close

    return {
        "is_open": is_open,
        "market": "BSE/NSE",
        "timezone": "IST",
        "open_time": "09:15",
        "close_time": "15:30",
        "current_time": now.strftime("%H:%M:%S"),
    }
