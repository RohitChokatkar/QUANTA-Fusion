"""
Glosten-Milgrom — Spread Decomposition
Decomposes BSE bid-ask spread into adverse selection + order processing costs.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def glosten_milgrom(
    bid: float,
    ask: float,
    mid_prices: list[float],
    trade_signs: list[int],
    kyle_lambda: float = 0.0,
) -> dict:
    """
    Decompose real-time BSE bid-ask spread using Glosten-Milgrom framework.

    Args:
        bid: Current best bid (Rs.)
        ask: Current best ask (Rs.)
        mid_prices: Recent mid-price history
        trade_signs: +1 buy, -1 sell trade flow
        kyle_lambda: Lambda from Kyle model output

    Returns:
        dict with adverse_selection, order_processing, total_spread, decomposition
    """
    if bid <= 0 or ask <= 0 or ask <= bid:
        return _empty_result("Invalid bid/ask")

    try:
        spread = ask - bid
        mid = (bid + ask) / 2.0
        spread_bps = (spread / mid) * 10000

        mids = np.array(mid_prices, dtype=np.float64)
        signs = np.array(trade_signs, dtype=np.float64)

        # Adverse selection component estimation
        # Using the trade indicator approach:
        # E[ΔP | trade_sign] = adverse_selection * sign
        if len(mids) > 2 and len(signs) > 0:
            dp = np.diff(mids)
            n = min(len(dp), len(signs))
            dp = dp[-n:]
            s = signs[-n:]

            # Covariance of price change with trade sign
            if len(dp) > 1:
                adverse_selection = float(np.abs(np.mean(dp * s)))
            else:
                adverse_selection = kyle_lambda * np.std(mids[-20:]) if len(mids) >= 20 else spread * 0.4
        else:
            adverse_selection = spread * 0.4  # default 40%

        # Order processing = total spread - adverse selection
        order_processing = max(spread - adverse_selection, 0)

        # Ensure components don't exceed total spread
        if adverse_selection > spread:
            adverse_selection = spread * 0.6
            order_processing = spread * 0.4

        # Proportions
        as_pct = round((adverse_selection / spread) * 100, 1) if spread > 0 else 0
        op_pct = round((order_processing / spread) * 100, 1) if spread > 0 else 0

        # Quality assessment
        if as_pct > 60:
            quality = "toxic"
        elif as_pct > 40:
            quality = "moderate"
        else:
            quality = "clean"

        return {
            "total_spread": round(float(spread), 4),
            "spread_bps": round(float(spread_bps), 2),
            "adverse_selection": round(float(adverse_selection), 4),
            "adverse_selection_pct": as_pct,
            "order_processing": round(float(order_processing), 4),
            "order_processing_pct": op_pct,
            "bid": round(float(bid), 2),
            "ask": round(float(ask), 2),
            "mid": round(float(mid), 2),
            "quality": quality,
            "kyle_lambda_used": round(float(kyle_lambda), 8),
            "error": None,
        }
    except Exception as e:
        logger.error(f"G-M error: {e}")
        return _empty_result(str(e))


def _empty_result(error: str) -> dict:
    return {
        "total_spread": 0, "spread_bps": 0,
        "adverse_selection": 0, "adverse_selection_pct": 0,
        "order_processing": 0, "order_processing_pct": 0,
        "bid": 0, "ask": 0, "mid": 0,
        "quality": "N/A",
        "kyle_lambda_used": 0,
        "error": error,
    }
