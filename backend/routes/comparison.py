"""
comparison.py
Side-by-side stock comparison — fundamentals + price chart overlay.
Powered by Finnhub (fundamentals) + Twelvedata (charts).
"""

from flask import Blueprint, jsonify, request
from quanta_fusion.ingestion.finnhub_fetcher import FinnhubFetcher
from quanta_fusion.ingestion.twelvedata_fetcher import TwelvedataFetcher

comparison_bp = Blueprint("comparison", __name__)

fh = FinnhubFetcher()
td = TwelvedataFetcher()


def _safe(val, default="N/A"):
    if val is None or val == "":
        return default
    return val


@comparison_bp.route("/comparison")
def compare_stocks():
    """Compare 2-3 stocks side by side."""
    symbols = request.args.get("symbols", "AAPL,MSFT")
    syms = [s.strip().upper() for s in symbols.split(",")][:3]

    results = []
    for sym in syms:
        try:
            fins  = fh.get_basic_financials(sym)
            quote = fh.get_quote(sym)
            chart = td.get_time_series(sym, interval="1day", outputsize=90)

            # Build chart data
            chart_data = []
            if not td.is_error(chart):
                for bar in chart:
                    chart_data.append({
                        "datetime": bar.get("datetime"),
                        "close":    bar.get("close"),
                    })

            results.append({
                "symbol":          sym,
                "price":           _safe(quote.get("price")),
                "change":          _safe(quote.get("change")),
                "changePct":       _safe(quote.get("change_pct")),
                "pe":              _safe(fins.get("pe")),
                "eps":             _safe(fins.get("eps")),
                "marketCap":       _safe(fins.get("market_cap")),
                "dividendYield":   _safe(fins.get("dividend_yield")),
                "beta":            _safe(fins.get("beta")),
                "fiftyTwoWeekHigh": _safe(fins.get("52_week_high")),
                "fiftyTwoWeekLow":  _safe(fins.get("52_week_low")),
                "revenueGrowth":   _safe(fins.get("revenue_growth")),
                "grossMargin":     _safe(fins.get("gross_margin")),
                "netMargin":       _safe(fins.get("net_margin")),
                "roe":             _safe(fins.get("roe")),
                "chart":           chart_data,
            })
        except Exception as e:
            results.append({"symbol": sym, "error": str(e)})

    return jsonify(results)