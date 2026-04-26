"""
Markowitz MVO — Mean-Variance Optimization
Efficient frontier for 2-5 BSE stocks using scipy.optimize.
"""

import numpy as np
from scipy.optimize import minimize
import logging

logger = logging.getLogger(__name__)


def markowitz_optimize(
    tickers: list[str],
    price_matrix: list[list[float]],
    risk_free_rate: float = 0.065,
    n_frontier_points: int = 50,
) -> dict:
    """
    Compute optimal portfolio weights and efficient frontier.

    Args:
        tickers: List of BSE ticker symbols
        price_matrix: 2D array — each row is a ticker's daily closes
        risk_free_rate: Annual risk-free rate (RBI repo rate, e.g. 0.065)
        n_frontier_points: Number of efficient frontier points

    Returns:
        dict with weights, sharpe, frontier, expected_return, risk
    """
    n = len(tickers)
    if n < 2:
        return _empty_result("Need at least 2 tickers")
    if any(len(row) < 30 for row in price_matrix):
        return _empty_result("Each ticker needs 30+ daily prices")

    try:
        # Compute daily returns
        returns_list = []
        for prices in price_matrix:
            p = np.array(prices, dtype=np.float64)
            r = np.diff(np.log(p))
            returns_list.append(r)

        # Align lengths
        min_len = min(len(r) for r in returns_list)
        returns = np.array([r[-min_len:] for r in returns_list])

        # Annualised stats
        mu = np.mean(returns, axis=1) * 252
        cov = np.cov(returns) * 252

        # ── Max Sharpe portfolio ──
        def neg_sharpe(w):
            port_ret = w @ mu
            port_vol = np.sqrt(w @ cov @ w)
            return -(port_ret - risk_free_rate) / (port_vol + 1e-10)

        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        bounds = [(0, 1)] * n
        w0 = np.ones(n) / n

        opt = minimize(neg_sharpe, w0, method="SLSQP", bounds=bounds, constraints=constraints)
        optimal_weights = opt.x

        # Portfolio metrics
        port_return = float(optimal_weights @ mu)
        port_vol = float(np.sqrt(optimal_weights @ cov @ optimal_weights))
        sharpe = (port_return - risk_free_rate) / (port_vol + 1e-10)

        # ── Efficient Frontier ──
        frontier = []
        target_returns = np.linspace(min(mu), max(mu), n_frontier_points)

        for target in target_returns:
            def port_variance(w):
                return w @ cov @ w

            cons = [
                {"type": "eq", "fun": lambda w: np.sum(w) - 1},
                {"type": "eq", "fun": lambda w, t=target: w @ mu - t},
            ]
            try:
                res = minimize(port_variance, w0, method="SLSQP", bounds=bounds, constraints=cons)
                if res.success:
                    risk = float(np.sqrt(res.fun)) * 100
                    ret = float(target) * 100
                    frontier.append({"risk": round(risk, 2), "ret": round(ret, 2)})
            except Exception:
                pass

        # Build weights dict
        weights = {}
        for i, ticker in enumerate(tickers):
            weights[ticker] = round(float(optimal_weights[i]), 4)

        return {
            "weights": weights,
            "expected_return": round(port_return * 100, 2),
            "risk": round(port_vol * 100, 2),
            "sharpe": round(float(sharpe), 3),
            "frontier": frontier,
            "risk_free_rate": risk_free_rate,
            "individual_returns": {t: round(float(mu[i]) * 100, 2) for i, t in enumerate(tickers)},
            "individual_vols": {t: round(float(np.sqrt(cov[i, i])) * 100, 2) for i, t in enumerate(tickers)},
            "n_obs": min_len,
            "error": None,
        }
    except Exception as e:
        logger.error(f"Markowitz error: {e}")
        return _empty_result(str(e))


def _empty_result(error: str) -> dict:
    return {
        "weights": {}, "expected_return": 0, "risk": 0,
        "sharpe": 0, "frontier": [],
        "risk_free_rate": 0,
        "individual_returns": {}, "individual_vols": {},
        "n_obs": 0,
        "error": error,
    }
