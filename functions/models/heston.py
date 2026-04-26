"""
Heston Model — Stochastic Volatility Surface
Generates vol smile/skew across strikes and expiries for BSE options.
Uses 25-year Fyers historical data for calibration.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def heston_vol_surface(
    S: float,
    closes: list[float],
    strike_range: tuple[float, float] = (0.7, 1.3),
    n_strikes: int = 15,
    expiries: list[float] = None,
) -> dict:
    """
    Generate a Heston-calibrated volatility surface.

    Args:
        S: Current underlying price
        closes: Historical daily closing prices
        strike_range: (low_mult, high_mult) relative to S
        n_strikes: Number of strike points
        expiries: List of expiry times in years

    Returns:
        dict with surface, smile, kappa, theta, xi params
    """
    if len(closes) < 60:
        return _empty_result("Need at least 60 closing prices")
    if S <= 0:
        return _empty_result("Invalid underlying price")

    if expiries is None:
        expiries = [0.083, 0.167, 0.25, 0.5, 1.0]  # 1M, 2M, 3M, 6M, 1Y

    try:
        prices = np.array(closes, dtype=np.float64)
        returns = np.diff(np.log(prices))

        # Calibrate Heston parameters from historical returns
        kappa, theta, xi, rho, v0 = _calibrate_heston(returns)

        # Generate strikes
        strikes = np.linspace(S * strike_range[0], S * strike_range[1], n_strikes)

        # Build vol surface
        surface = []
        for T in expiries:
            for K in strikes:
                iv = _heston_iv_approx(S, K, T, v0, kappa, theta, xi, rho)
                surface.append({
                    "strike": round(float(K), 2),
                    "expiry": round(T, 3),
                    "vol": round(float(iv * 100), 2),  # in %
                })

        # Extract 3-month smile for chart
        smile = [p for p in surface if abs(p["expiry"] - 0.25) < 0.01]

        return {
            "surface": surface,
            "smile": smile,
            "kappa": round(float(kappa), 3),
            "theta": round(float(theta * 100), 2),  # in %
            "xi": round(float(xi), 3),
            "rho": round(float(rho), 3),
            "v0": round(float(v0 * 100), 2),  # in %
            "n_strikes": n_strikes,
            "n_expiries": len(expiries),
            "error": None,
        }
    except Exception as e:
        logger.error(f"Heston error: {e}")
        return _empty_result(str(e))


def _calibrate_heston(returns: np.ndarray) -> tuple:
    """
    Moment-matching calibration for Heston parameters.
    Returns (kappa, theta, xi, rho, v0)
    """
    var_series = returns ** 2
    v0 = float(np.var(returns))
    theta = float(np.mean(var_series))  # long-run variance

    # Mean reversion speed from autocorrelation of variance
    if len(var_series) > 1:
        autocorr = float(np.corrcoef(var_series[:-1], var_series[1:])[0, 1])
        kappa = max(-np.log(abs(autocorr) + 1e-10) * 252, 0.5)
    else:
        kappa = 2.0

    # Vol of vol from variance of variance
    xi = float(np.std(var_series)) * np.sqrt(252)
    xi = max(xi, 0.1)

    # Leverage effect (correlation between returns and vol changes)
    if len(returns) > 1:
        vol_changes = np.diff(np.sqrt(np.abs(var_series)))
        min_len = min(len(returns) - 1, len(vol_changes))
        if min_len > 0:
            rho = float(np.corrcoef(returns[1:min_len + 1], vol_changes[:min_len])[0, 1])
            rho = np.clip(rho, -0.95, -0.1)
        else:
            rho = -0.7
    else:
        rho = -0.7

    kappa = min(kappa, 10.0)

    return kappa, theta, xi, rho, v0


def _heston_iv_approx(
    S: float, K: float, T: float,
    v0: float, kappa: float, theta: float,
    xi: float, rho: float,
) -> float:
    """
    Approximate Heston implied vol using Lewis (2000) expansion.
    Returns IV as decimal.
    """
    m = np.log(K / S)  # log-moneyness
    total_var = v0 * T  # ATM total variance approximation

    # Mean variance over life
    v_bar = theta + (v0 - theta) * (1 - np.exp(-kappa * T)) / (kappa * T + 1e-10)

    # Skew from rho
    skew = rho * xi / (2 * np.sqrt(v_bar + 1e-10))

    # Curvature (smile wings)
    convexity = (xi ** 2) / (12 * (v_bar + 1e-10))

    # Approximate IV
    atm_vol = np.sqrt(v_bar)
    iv = atm_vol * (1 + skew * m + convexity * m ** 2)

    return max(float(iv), 0.01)


def _empty_result(error: str) -> dict:
    return {
        "surface": [], "smile": [],
        "kappa": 0, "theta": 0, "xi": 0, "rho": 0, "v0": 0,
        "n_strikes": 0, "n_expiries": 0,
        "error": error,
    }
