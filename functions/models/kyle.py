"""
Kyle Model — Informed Flow Estimator
Classifies BSE buy vs sell-initiated trades and estimates price impact lambda.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def kyle_lambda(
    trade_volumes: list[float],
    trade_signs: list[int],
    price_changes: list[float],
    window: int = 50,
) -> dict:
    """
    Estimate Kyle's lambda (price impact coefficient) from BSE trade data.

    Args:
        trade_volumes: Volume of each trade
        trade_signs: +1 for buy-initiated, -1 for sell-initiated
        price_changes: Price change per trade
        window: Rolling estimation window

    Returns:
        dict with lambda, informed_pct, vpin, flow_imbalance
    """
    if len(trade_volumes) < 10:
        return _empty_result("Need at least 10 trades")

    try:
        vols = np.array(trade_volumes, dtype=np.float64)
        signs = np.array(trade_signs, dtype=np.float64)
        dp = np.array(price_changes, dtype=np.float64)

        # Signed order flow
        signed_flow = vols * signs

        # Kyle's lambda via OLS: ΔP = λ * signed_flow + ε
        n = min(len(signed_flow), len(dp), window)
        x = signed_flow[-n:]
        y = dp[-n:]

        x_mean = np.mean(x)
        y_mean = np.mean(y)
        cov_xy = np.sum((x - x_mean) * (y - y_mean))
        var_x = np.sum((x - x_mean) ** 2)

        if var_x < 1e-12:
            lam = 0.0
        else:
            lam = float(cov_xy / var_x)

        # VPIN — Volume-Synchronized Probability of Informed Trading
        buy_vol = np.sum(vols[signs > 0])
        sell_vol = np.sum(vols[signs < 0])
        total_vol = buy_vol + sell_vol
        vpin = float(abs(buy_vol - sell_vol) / (total_vol + 1e-10))

        # Order flow imbalance
        net_flow = float(np.sum(signed_flow))
        total_flow = float(np.sum(np.abs(signed_flow)))
        ofi = net_flow / (total_flow + 1e-10)

        # Informed flow percentage estimate
        informed_pct = round(vpin * 100, 2)

        # Toxicity level
        if vpin > 0.6:
            toxicity = "high"
        elif vpin > 0.3:
            toxicity = "moderate"
        else:
            toxicity = "low"

        return {
            "lambda": round(abs(lam), 8),
            "lambda_direction": "positive" if lam >= 0 else "negative",
            "informed_pct": informed_pct,
            "vpin": round(vpin, 4),
            "toxicity": toxicity,
            "order_flow_imbalance": round(ofi, 4),
            "net_buy_volume": round(float(buy_vol), 0),
            "net_sell_volume": round(float(sell_vol), 0),
            "n_trades": n,
            "error": None,
        }
    except Exception as e:
        logger.error(f"Kyle error: {e}")
        return _empty_result(str(e))


def classify_trades(prices: list[float], volumes: list[float]) -> tuple[list[int], list[float]]:
    """
    Lee-Ready trade classification using tick rule.
    Returns (signs, price_changes).
    """
    signs = []
    changes = []

    for i in range(1, len(prices)):
        dp = prices[i] - prices[i - 1]
        changes.append(dp)
        if dp > 0:
            signs.append(1)
        elif dp < 0:
            signs.append(-1)
        else:
            signs.append(signs[-1] if signs else 1)

    return signs, changes


def _empty_result(error: str) -> dict:
    return {
        "lambda": 0, "lambda_direction": "positive",
        "informed_pct": 0, "vpin": 0,
        "toxicity": "low",
        "order_flow_imbalance": 0,
        "net_buy_volume": 0, "net_sell_volume": 0,
        "n_trades": 0,
        "error": error,
    }
