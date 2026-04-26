"""
Avellaneda-Stoikov — Optimal Market Making
Computes optimal bid/ask spread overlay for BSE live chart.
Updates every 1s on BSE ticks.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def avellaneda_stoikov(
    mid_price: float,
    sigma: float,
    gamma: float = 0.1,
    kappa: float = 1.5,
    T: float = 1.0,
    t: float = 0.0,
    inventory: int = 0,
    max_inventory: int = 100,
) -> dict:
    """
    Optimal bid/ask prices accounting for inventory risk and volatility.

    Args:
        mid_price: Current BSE mid-price (Rs.)
        sigma: GARCH volatility (decimal, e.g. 0.25)
        gamma: Risk aversion parameter
        kappa: Order arrival intensity
        T: Normalised trading horizon (1.0 = full day)
        t: Current time in horizon [0, T)
        inventory: Current inventory position
        max_inventory: Maximum position size

    Returns:
        dict with optimal_bid, optimal_ask, spread, reservation_price
    """
    if mid_price <= 0 or sigma <= 0:
        return _empty_result("Invalid mid_price or sigma")

    try:
        tau = T - t  # time remaining
        tau = max(tau, 0.001)  # avoid division by zero

        # Reservation price: shifted from mid by inventory risk
        reservation_price = mid_price - inventory * gamma * (sigma ** 2) * tau

        # Optimal spread
        optimal_spread = (gamma * (sigma ** 2) * tau) + (2 / gamma) * np.log(1 + gamma / kappa)

        # Bid and ask
        optimal_bid = reservation_price - optimal_spread / 2
        optimal_ask = reservation_price + optimal_spread / 2

        # Inventory skew indicator
        skew = inventory / max_inventory if max_inventory > 0 else 0
        if abs(skew) < 0.2:
            skew_label = "neutral"
        elif skew > 0:
            skew_label = "long_heavy"
        else:
            skew_label = "short_heavy"

        return {
            "optimal_bid": round(float(optimal_bid), 2),
            "optimal_ask": round(float(optimal_ask), 2),
            "spread": round(float(optimal_spread), 4),
            "spread_bps": round(float(optimal_spread / mid_price * 10000), 2),
            "reservation_price": round(float(reservation_price), 2),
            "mid_price": round(float(mid_price), 2),
            "inventory": inventory,
            "inventory_skew": round(float(skew), 3),
            "skew_label": skew_label,
            "sigma_used": round(float(sigma), 4),
            "gamma": gamma,
            "kappa": kappa,
            "time_remaining": round(float(tau), 4),
            "error": None,
        }
    except Exception as e:
        logger.error(f"A-S error: {e}")
        return _empty_result(str(e))


def _empty_result(error: str) -> dict:
    return {
        "optimal_bid": 0, "optimal_ask": 0,
        "spread": 0, "spread_bps": 0,
        "reservation_price": 0, "mid_price": 0,
        "inventory": 0, "inventory_skew": 0,
        "skew_label": "neutral",
        "sigma_used": 0, "gamma": 0, "kappa": 0,
        "time_remaining": 0,
        "error": error,
    }
