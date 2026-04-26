"""
Almgren-Chriss — Execution Schedule Optimizer
Optimal execution schedule for large BSE block orders.
Models impact cost and generates lots-per-hour plans.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def almgren_chriss(
    total_shares: int,
    price: float,
    daily_volume: float,
    sigma: float,
    horizon_hours: float = 6.25,
    risk_aversion: float = 1e-6,
    eta: float = 0.01,
    gamma_permanent: float = 0.001,
    n_periods: int = 10,
) -> dict:
    """
    Compute optimal execution schedule to minimise expected cost + risk.

    Args:
        total_shares: Total shares to execute
        price: Current BSE price (Rs.)
        daily_volume: Average daily BSE volume
        sigma: Daily volatility (decimal)
        horizon_hours: Trading horizon in hours (BSE: 6.25h = 9:15-3:30)
        risk_aversion: Lambda risk-aversion parameter
        eta: Temporary impact coefficient
        gamma_permanent: Permanent impact coefficient
        n_periods: Number of time buckets

    Returns:
        dict with schedule, total_cost, impact_cost, risk_cost
    """
    if total_shares <= 0 or price <= 0 or daily_volume <= 0:
        return _empty_result("Invalid inputs")

    try:
        tau = horizon_hours / n_periods  # time per period (hours)
        T = horizon_hours

        # Participation rate
        participation = total_shares / daily_volume

        # Almgren-Chriss optimal trajectory
        # Using the analytical solution for the optimal execution path
        kappa = np.sqrt(risk_aversion * sigma ** 2 / eta) if eta > 0 else 1.0

        # Remaining shares at each time step
        schedule_lots = []
        remaining = total_shares
        times = []

        for j in range(n_periods):
            t = j * tau
            T_rem = T - t
            if T_rem <= 0:
                break

            # Optimal execution rate
            if kappa * T_rem > 0.01:
                n_j = remaining * (np.sinh(kappa * tau) / np.sinh(kappa * T_rem))
            else:
                n_j = remaining / max(n_periods - j, 1)

            n_j = min(n_j, remaining)
            n_j = max(n_j, 0)

            hour_label = 9.25 + j * tau  # IST starting at 9:15
            h = int(hour_label)
            m = int((hour_label - h) * 60)

            schedule_lots.append({
                "period": j + 1,
                "time": f"{h:02d}:{m:02d}",
                "lots": round(float(n_j)),
                "pct_of_total": round(float(n_j / total_shares * 100), 1),
                "remaining_after": round(float(remaining - n_j)),
            })

            remaining -= n_j
            times.append(t)

        # Cost calculations
        temp_impact_cost = eta * sum(
            (s["lots"] / (tau + 1e-10)) ** 2 * tau for s in schedule_lots
        ) * price

        perm_impact_cost = gamma_permanent * total_shares * price

        risk_cost = risk_aversion * (sigma ** 2) * sum(
            s["remaining_after"] ** 2 * tau for s in schedule_lots
        )

        total_cost = temp_impact_cost + perm_impact_cost + risk_cost
        cost_bps = (total_cost / (total_shares * price)) * 10000

        return {
            "schedule": schedule_lots,
            "total_shares": total_shares,
            "price": round(float(price), 2),
            "total_cost_inr": round(float(total_cost), 2),
            "cost_bps": round(float(cost_bps), 2),
            "temp_impact_inr": round(float(temp_impact_cost), 2),
            "perm_impact_inr": round(float(perm_impact_cost), 2),
            "risk_cost_inr": round(float(risk_cost), 2),
            "participation_rate": round(float(participation * 100), 2),
            "horizon_hours": horizon_hours,
            "n_periods": n_periods,
            "error": None,
        }
    except Exception as e:
        logger.error(f"Almgren-Chriss error: {e}")
        return _empty_result(str(e))


def _empty_result(error: str) -> dict:
    return {
        "schedule": [], "total_shares": 0, "price": 0,
        "total_cost_inr": 0, "cost_bps": 0,
        "temp_impact_inr": 0, "perm_impact_inr": 0, "risk_cost_inr": 0,
        "participation_rate": 0, "horizon_hours": 0, "n_periods": 0,
        "error": error,
    }
