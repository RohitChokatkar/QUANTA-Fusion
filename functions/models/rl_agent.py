"""
RL Agent — Reinforcement Learning Trading Signal
Q-learning agent for BUY / HOLD / SELL signals.
Production: stable-baselines3 PPO on BSE historical data.
Fallback: Rule-based heuristic when SB3 is not installed.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)

try:
    from stable_baselines3 import PPO
    HAS_SB3 = True
except ImportError:
    HAS_SB3 = False
    logger.info("stable-baselines3 not installed — RL Agent uses rule-based fallback")


def rl_signal(
    garch_sigma: float,
    kyle_lambda: float,
    sentiment_score: float,
    momentum_5d: float,
    price: float = 0,
    sma_20: float = 0,
    rsi: float = 50,
) -> dict:
    """
    Generate BUY / HOLD / SELL signal with confidence.

    Args:
        garch_sigma: GARCH annualised vol (%)
        kyle_lambda: Kyle price-impact coefficient
        sentiment_score: VADER compound score [-1, 1]
        momentum_5d: 5-day price return (%)
        price: Current price (for SMA comparison)
        sma_20: 20-day simple moving average
        rsi: Relative Strength Index [0, 100]

    Returns:
        dict with signal, confidence, reasoning
    """
    if HAS_SB3:
        return _sb3_signal(garch_sigma, kyle_lambda, sentiment_score, momentum_5d)
    else:
        return _rule_based_signal(garch_sigma, kyle_lambda, sentiment_score, momentum_5d, price, sma_20, rsi)


def _rule_based_signal(
    garch_sigma: float,
    kyle_lambda: float,
    sentiment: float,
    momentum: float,
    price: float,
    sma_20: float,
    rsi: float,
) -> dict:
    """Multi-factor rule-based signal when SB3 is unavailable."""
    score = 0.0
    reasons = []

    # Factor 1: Momentum (weight: 30%)
    if momentum > 2:
        score += 0.3
        reasons.append(f"Strong +{momentum:.1f}% momentum")
    elif momentum > 0.5:
        score += 0.15
        reasons.append(f"Mild +{momentum:.1f}% momentum")
    elif momentum < -2:
        score -= 0.3
        reasons.append(f"Weak {momentum:.1f}% momentum")
    elif momentum < -0.5:
        score -= 0.15
        reasons.append(f"Mild {momentum:.1f}% momentum")

    # Factor 2: Sentiment (weight: 25%)
    if sentiment > 0.3:
        score += 0.25
        reasons.append(f"Positive sentiment ({sentiment:.2f})")
    elif sentiment < -0.3:
        score -= 0.25
        reasons.append(f"Negative sentiment ({sentiment:.2f})")

    # Factor 3: Volatility regime (weight: 20%)
    if garch_sigma < 15:
        score += 0.1
        reasons.append(f"Low vol regime ({garch_sigma:.1f}%)")
    elif garch_sigma > 35:
        score -= 0.2
        reasons.append(f"High vol regime ({garch_sigma:.1f}%)")

    # Factor 4: RSI (weight: 15%)
    if rsi < 30:
        score += 0.15
        reasons.append(f"RSI oversold ({rsi:.0f})")
    elif rsi > 70:
        score -= 0.15
        reasons.append(f"RSI overbought ({rsi:.0f})")

    # Factor 5: Price vs SMA (weight: 10%)
    if price > 0 and sma_20 > 0:
        if price > sma_20 * 1.02:
            score += 0.1
            reasons.append("Price above SMA20")
        elif price < sma_20 * 0.98:
            score -= 0.1
            reasons.append("Price below SMA20")

    # Factor 6: Kyle toxicity penalty
    if kyle_lambda > 0.01:
        score -= 0.1
        reasons.append("High flow toxicity")

    # Convert score to signal
    if score > 0.15:
        signal = "BUY"
    elif score < -0.15:
        signal = "SELL"
    else:
        signal = "HOLD"

    confidence = min(abs(score) / 0.5 * 100, 95)

    return {
        "signal": signal,
        "confidence": round(confidence, 1),
        "score": round(score, 3),
        "reasoning": reasons,
        "model": "rule_based",
        "factors": {
            "momentum": round(momentum, 2),
            "sentiment": round(sentiment, 2),
            "garch_sigma": round(garch_sigma, 2),
            "kyle_lambda": round(kyle_lambda, 6),
            "rsi": round(rsi, 1),
        },
        "error": None,
    }


def _sb3_signal(garch_sigma, kyle_lambda, sentiment, momentum) -> dict:
    """Placeholder for trained SB3 PPO model inference."""
    # In production: load pre-trained model and run observation
    obs = np.array([garch_sigma, kyle_lambda, sentiment, momentum], dtype=np.float32)
    # model = PPO.load("models/rl_agent_bse.zip")
    # action, _ = model.predict(obs)
    # For now, fall back to rule-based
    return _rule_based_signal(garch_sigma, kyle_lambda, sentiment, momentum, 0, 0, 50)


def compute_rsi(closes: list[float], period: int = 14) -> float:
    """Compute RSI from closing prices."""
    if len(closes) < period + 1:
        return 50.0
    prices = np.array(closes, dtype=np.float64)
    deltas = np.diff(prices)
    gains = np.maximum(deltas, 0)
    losses = np.abs(np.minimum(deltas, 0))

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss < 1e-10:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def compute_momentum(closes: list[float], days: int = 5) -> float:
    """5-day price return percentage."""
    if len(closes) < days + 1:
        return 0.0
    return round((closes[-1] / closes[-days - 1] - 1) * 100, 2)
