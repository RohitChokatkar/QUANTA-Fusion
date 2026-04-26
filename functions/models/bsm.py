"""
Black-Scholes-Merton — Option Pricing + Greeks
Prices European call/put options on BSE stocks in INR.
Uses GARCH vol and Vasicek risk-free rate as inputs.
Output: Call/Put in Rs., Delta, Gamma, Theta, Vega, Rho — per tick
"""

import numpy as np
from scipy.stats import norm
import logging

logger = logging.getLogger(__name__)


def black_scholes(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: str = "call",
) -> dict:
    """
    Black-Scholes-Merton pricing for European options.

    Args:
        S: Underlying price (Rs.)
        K: Strike price (Rs.)
        T: Time to expiry in years (e.g. 30/365)
        r: Risk-free rate (decimal, e.g. 0.065 for 6.5%)
        sigma: Volatility (decimal, e.g. 0.25 for 25%)
        option_type: "call" or "put"

    Returns:
        dict with call_price, put_price, delta, gamma, theta, vega, rho
    """
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return _empty_result("Invalid inputs: S, K, T, sigma must be > 0")

    try:
        d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        # Prices
        call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        put_price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

        # Greeks (call-side)
        delta_call = float(norm.cdf(d1))
        delta_put = float(delta_call - 1)
        gamma = float(norm.pdf(d1) / (S * sigma * np.sqrt(T)))
        theta_call = float(
            -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
            - r * K * np.exp(-r * T) * norm.cdf(d2)
        ) / 365  # per day
        theta_put = float(
            -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
            + r * K * np.exp(-r * T) * norm.cdf(-d2)
        ) / 365
        vega = float(S * norm.pdf(d1) * np.sqrt(T)) / 100  # per 1% vol
        rho_call = float(K * T * np.exp(-r * T) * norm.cdf(d2)) / 100
        rho_put = float(-K * T * np.exp(-r * T) * norm.cdf(-d2)) / 100

        return {
            "call_price": round(float(call_price), 2),
            "put_price": round(float(put_price), 2),
            "delta": round(delta_call if option_type == "call" else delta_put, 4),
            "gamma": round(gamma, 6),
            "theta": round(theta_call if option_type == "call" else theta_put, 4),
            "vega": round(vega, 4),
            "rho": round(rho_call if option_type == "call" else rho_put, 4),
            "d1": round(float(d1), 4),
            "d2": round(float(d2), 4),
            "intrinsic_call": round(max(S - K, 0), 2),
            "intrinsic_put": round(max(K - S, 0), 2),
            "moneyness": "ITM" if (S > K if option_type == "call" else S < K) else "OTM",
            "error": None,
        }
    except Exception as e:
        logger.error(f"BSM error: {e}")
        return _empty_result(str(e))


def implied_volatility(
    market_price: float,
    S: float,
    K: float,
    T: float,
    r: float,
    option_type: str = "call",
    tol: float = 1e-6,
    max_iter: int = 100,
) -> float:
    """Newton-Raphson implied vol solver."""
    sigma = 0.25  # initial guess

    for _ in range(max_iter):
        result = black_scholes(S, K, T, r, sigma, option_type)
        price = result["call_price"] if option_type == "call" else result["put_price"]
        vega = result["vega"] * 100  # undo the /100

        diff = price - market_price
        if abs(diff) < tol:
            return round(sigma, 6)
        if abs(vega) < 1e-12:
            break
        sigma -= diff / vega
        sigma = max(sigma, 0.001)

    return round(sigma, 6)


def _empty_result(error: str) -> dict:
    return {
        "call_price": 0, "put_price": 0,
        "delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0,
        "d1": 0, "d2": 0,
        "intrinsic_call": 0, "intrinsic_put": 0,
        "moneyness": "N/A",
        "error": error,
    }
