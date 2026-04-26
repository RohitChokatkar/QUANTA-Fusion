"""
GARCH(1,1) — Volatility Forecasting
Uses the `arch` library for maximum-likelihood GARCH estimation on BSE daily returns.
Input:  60-day BSE closing prices (from Fyers)
Output: Tomorrow's annualised vol (%), vol direction badge, 30-day sparkline
"""

import numpy as np
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from arch import arch_model
    HAS_ARCH = True
except ImportError:
    HAS_ARCH = False
    logger.warning("arch library not installed — GARCH will use EWMA fallback")


def garch_forecast(closes: list[float], p: int = 1, q: int = 1) -> dict:
    """
    Run GARCH(p,q) on daily closing prices and forecast next-day volatility.

    Args:
        closes: List of daily closing prices (at least 30 values)
        p: GARCH lag order for variance
        q: GARCH lag order for squared residuals

    Returns:
        dict with sigma, direction, sparkline, params
    """
    if len(closes) < 30:
        return _empty_result("Need at least 30 closing prices")

    prices = np.array(closes, dtype=np.float64)
    returns = np.diff(np.log(prices)) * 100  # log returns in %

    if HAS_ARCH:
        return _arch_garch(returns, p, q)
    else:
        return _ewma_fallback(returns)


def _arch_garch(returns: np.ndarray, p: int, q: int) -> dict:
    """GARCH using the arch library (preferred)."""
    try:
        model = arch_model(returns, vol="GARCH", p=p, q=q, dist="normal")
        result = model.fit(disp="off", show_warning=False)

        forecast = result.forecast(horizon=1)
        next_var = forecast.variance.iloc[-1, 0]
        sigma_daily = np.sqrt(next_var)
        sigma_annual = round(sigma_daily * np.sqrt(252), 2)

        # Conditional variance series for sparkline
        cond_vol = result.conditional_volatility
        sparkline = [round(float(v) * np.sqrt(252), 2) for v in cond_vol[-30:]]

        # Direction: compare last 5 vs previous 5
        if len(sparkline) >= 10:
            recent = np.mean(sparkline[-5:])
            prev = np.mean(sparkline[-10:-5])
            direction = "rising" if recent > prev * 1.02 else "falling" if recent < prev * 0.98 else "stable"
        else:
            direction = "stable"

        return {
            "sigma": sigma_annual,
            "sigma_daily": round(float(sigma_daily), 4),
            "direction": direction,
            "sparkline": sparkline,
            "omega": round(float(result.params.get("omega", 0)), 6),
            "alpha": round(float(result.params.get("alpha[1]", 0)), 4),
            "beta": round(float(result.params.get("beta[1]", 0)), 4),
            "log_likelihood": round(float(result.loglikelihood), 2),
            "model": f"GARCH({p},{q})",
            "n_obs": len(returns),
            "error": None,
        }
    except Exception as e:
        logger.error(f"GARCH arch fit failed: {e}")
        return _ewma_fallback(returns)


def _ewma_fallback(returns: np.ndarray, lam: float = 0.94) -> dict:
    """Exponentially-weighted moving average fallback when arch is unavailable."""
    var = np.var(returns)
    ewma_vars = [var]
    for r in returns:
        var = lam * var + (1 - lam) * r ** 2
        ewma_vars.append(var)

    sigma_daily = np.sqrt(ewma_vars[-1])
    sigma_annual = round(float(sigma_daily * np.sqrt(252)), 2)

    sparkline = [round(float(np.sqrt(v) * np.sqrt(252)), 2) for v in ewma_vars[-30:]]

    if len(sparkline) >= 10:
        recent = np.mean(sparkline[-5:])
        prev = np.mean(sparkline[-10:-5])
        direction = "rising" if recent > prev * 1.02 else "falling" if recent < prev * 0.98 else "stable"
    else:
        direction = "stable"

    return {
        "sigma": sigma_annual,
        "sigma_daily": round(float(sigma_daily), 4),
        "direction": direction,
        "sparkline": sparkline,
        "omega": None,
        "alpha": None,
        "beta": round(lam, 4),
        "log_likelihood": None,
        "model": "EWMA(fallback)",
        "n_obs": len(returns),
        "error": None,
    }


def _empty_result(error: str) -> dict:
    return {
        "sigma": 0,
        "sigma_daily": 0,
        "direction": "stable",
        "sparkline": [],
        "omega": None, "alpha": None, "beta": None,
        "log_likelihood": None,
        "model": "GARCH(1,1)",
        "n_obs": 0,
        "error": error,
    }
