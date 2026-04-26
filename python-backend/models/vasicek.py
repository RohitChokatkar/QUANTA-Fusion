"""
Vasicek / CIR — Mean-Reverting Interest Rate Model
Uses RBI Repo Rate instead of US Fed Funds Rate.
Forecasts 12-month INR rate curve for BSM option pricing.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)


def vasicek_forecast(
    rate_history: list[float],
    horizon_months: int = 12,
    model_type: str = "vasicek",
) -> dict:
    """
    Mean-reverting interest rate forecast on RBI repo rate.

    Args:
        rate_history: List of historical RBI repo rates (% form, e.g. [6.5, 6.5, 6.25, ...])
        horizon_months: Forecast horizon
        model_type: "vasicek" or "cir"

    Returns:
        dict with forecast_curve, long_run_rate, kappa, sigma
    """
    if len(rate_history) < 5:
        return _empty_result("Need at least 5 rate observations")

    try:
        rates = np.array(rate_history, dtype=np.float64) / 100  # to decimal

        # Calibrate parameters using OLS on Δr = a(b - r)Δt + σ ε √Δt
        dt = 1 / 12  # monthly steps
        dr = np.diff(rates)
        r_prev = rates[:-1]

        # OLS: dr = alpha + beta * r_prev + noise
        X = np.column_stack([np.ones_like(r_prev), r_prev])
        beta_hat = np.linalg.lstsq(X, dr, rcond=None)[0]

        alpha = beta_hat[0]
        beta = beta_hat[1]

        # Convert to Vasicek params
        kappa = -beta / dt  # mean reversion speed
        kappa = max(kappa, 0.01)  # ensure positive

        theta = -alpha / (beta + 1e-12)  # long-run rate
        theta = np.clip(theta, 0.01, 0.20)

        residuals = dr - X @ beta_hat
        if model_type == "cir":
            # CIR: vol proportional to sqrt(rate)
            sigma = float(np.std(residuals / np.sqrt(np.abs(r_prev) + 1e-10)) / np.sqrt(dt))
        else:
            sigma = float(np.std(residuals) / np.sqrt(dt))

        sigma = max(sigma, 0.001)

        # Generate forecast curve
        curve = []
        r_current = rates[-1]
        r = r_current

        for m in range(1, horizon_months + 1):
            # Expected rate under Vasicek/CIR
            r_expected = theta + (r - theta) * np.exp(-kappa * m * dt)
            curve.append({
                "month": m,
                "rate": round(float(r_expected * 100), 3),  # back to %
            })

        # Current rate
        current_rate = round(float(rates[-1] * 100), 3)
        long_run_rate = round(float(theta * 100), 3)

        return {
            "current_rate": current_rate,
            "long_run_rate": long_run_rate,
            "forecast_curve": curve,
            "kappa": round(float(kappa), 4),
            "theta": long_run_rate,
            "sigma": round(float(sigma * 100), 4),  # in %
            "model": model_type.upper(),
            "n_obs": len(rate_history),
            "rate_direction": "rising" if curve[-1]["rate"] > current_rate else "falling",
            "error": None,
        }
    except Exception as e:
        logger.error(f"Vasicek error: {e}")
        return _empty_result(str(e))


def get_risk_free_rate(rate_history: list[float]) -> float:
    """Extract current risk-free rate from RBI repo history for BSM input."""
    if not rate_history:
        return 0.065  # default RBI repo
    return rate_history[-1] / 100


def _empty_result(error: str) -> dict:
    return {
        "current_rate": 0, "long_run_rate": 0,
        "forecast_curve": [],
        "kappa": 0, "theta": 0, "sigma": 0,
        "model": "VASICEK", "n_obs": 0,
        "rate_direction": "stable",
        "error": error,
    }
