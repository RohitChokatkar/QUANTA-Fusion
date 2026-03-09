"""
tools.py
Financial tools — currency converter, SIP calculator, EMI calculator.
Forex powered by Twelvedata + Alpha Vantage fallback.
"""

from flask import Blueprint, jsonify, request
from quanta_fusion.ingestion.twelvedata_fetcher import TwelvedataFetcher
from quanta_fusion.ingestion.alpha_vantage_fetcher import AlphaVantageFetcher

tools_bp = Blueprint("tools", __name__)

td = TwelvedataFetcher()
av = AlphaVantageFetcher()

# ── Fallback rates (USD base) ─────────────────────────────────────────────────
FALLBACK_RATES = {
    "USD": 1.0,    "EUR": 0.92,  "GBP": 0.79,  "JPY": 149.5,
    "INR": 83.2,   "CAD": 1.36,  "AUD": 1.53,  "CHF": 0.88,
    "CNY": 7.24,   "SGD": 1.34,  "HKD": 7.82,  "KRW": 1320.0,
    "BRL": 4.97,   "MXN": 17.15, "ZAR": 18.9,  "AED": 3.67,
    "SAR": 3.75,   "THB": 35.1,  "MYR": 4.72,  "IDR": 15600.0,
}


def _get_forex_rate(from_curr: str, to_curr: str) -> float:
    """
    Get forex rate with 3-level fallback:
    1. Twelvedata
    2. Alpha Vantage
    3. Hardcoded fallback rates
    """
    # Level 1 — Twelvedata
    result = td.get_forex_rate(from_curr, to_curr)
    if not td.is_error(result) and result.get("rate", 0) > 0:
        return float(result["rate"])

    # Level 2 — Alpha Vantage
    result = av.get_forex_rate(from_curr, to_curr)
    if not av.is_error(result) and result.get("rate", 0) > 0:
        return float(result["rate"])

    # Level 3 — Fallback hardcoded rates
    fr = FALLBACK_RATES.get(from_curr.upper(), 1.0)
    tr = FALLBACK_RATES.get(to_curr.upper(), 1.0)
    return round(tr / fr, 4)


# ── Routes ────────────────────────────────────────────────────────────────────

@tools_bp.route("/tools/currency")
def currency_convert():
    """Convert currency using live forex rates."""
    from_curr = request.args.get("from", "USD").upper()
    to_curr   = request.args.get("to", "INR").upper()
    amount    = float(request.args.get("amount", 1))

    rate      = _get_forex_rate(from_curr, to_curr)
    converted = round(amount * rate, 2)

    return jsonify({
        "from":      from_curr,
        "to":        to_curr,
        "amount":    amount,
        "rate":      round(rate, 4),
        "converted": converted,
    })


@tools_bp.route("/tools/sip-calculator")
def sip_calculator():
    """Calculate SIP (Systematic Investment Plan) returns."""
    monthly = float(request.args.get("monthly", 5000))
    rate    = float(request.args.get("rate", 12)) / 100 / 12
    years   = int(request.args.get("years", 10))
    months  = years * 12

    if rate > 0:
        fv = monthly * (((1 + rate) ** months - 1) / rate) * (1 + rate)
    else:
        fv = monthly * months

    invested = monthly * months
    returns  = fv - invested

    # Build year-by-year growth chart
    chart = []
    for y in range(1, years + 1):
        m = y * 12
        if rate > 0:
            val = monthly * (((1 + rate) ** m - 1) / rate) * (1 + rate)
        else:
            val = monthly * m
        chart.append({
            "year":      y,
            "invested":  round(monthly * m, 2),
            "value":     round(val, 2),
            "returns":   round(val - monthly * m, 2),
        })

    return jsonify({
        "monthlyInvestment": monthly,
        "annualRate":        round(rate * 12 * 100, 1),
        "years":             years,
        "totalInvested":     round(invested, 2),
        "estimatedReturns":  round(returns, 2),
        "totalValue":        round(fv, 2),
        "chart":             chart,
    })


@tools_bp.route("/tools/emi-calculator")
def emi_calculator():
    """Calculate loan EMI (Equated Monthly Installment)."""
    principal = float(request.args.get("principal", 1000000))
    rate      = float(request.args.get("rate", 8.5)) / 100 / 12
    years     = int(request.args.get("years", 20))
    months    = years * 12

    if rate > 0:
        emi = principal * rate * (1 + rate) ** months / ((1 + rate) ** months - 1)
    else:
        emi = principal / months

    total    = emi * months
    interest = total - principal

    # Build amortization chart (yearly)
    chart      = []
    balance    = principal
    yearly_int = 0
    yearly_pri = 0

    for m in range(1, months + 1):
        int_part = balance * rate
        pri_part = emi - int_part
        balance -= pri_part
        yearly_int += int_part
        yearly_pri += pri_part

        if m % 12 == 0:
            chart.append({
                "year":      m // 12,
                "principal": round(yearly_pri, 2),
                "interest":  round(yearly_int, 2),
                "balance":   round(max(balance, 0), 2),
            })
            yearly_int = 0
            yearly_pri = 0

    return jsonify({
        "principal":     principal,
        "annualRate":    round(rate * 12 * 100, 1),
        "years":         years,
        "emi":           round(emi, 2),
        "totalPayment":  round(total, 2),
        "totalInterest": round(interest, 2),
        "chart":         chart,
    })


@tools_bp.route("/tools/available-currencies")
def available_currencies():
    """Return list of supported currencies."""
    return jsonify(sorted(FALLBACK_RATES.keys()))


@tools_bp.route("/tools/compound-calculator")
def compound_calculator():
    """Calculate compound interest growth."""
    principal  = float(request.args.get("principal", 100000))
    rate       = float(request.args.get("rate", 10)) / 100
    years      = int(request.args.get("years", 10))
    frequency  = int(request.args.get("frequency", 1))  # times per year

    final = principal * (1 + rate / frequency) ** (frequency * years)
    interest = final - principal

    chart = []
    for y in range(1, years + 1):
        val = principal * (1 + rate / frequency) ** (frequency * y)
        chart.append({
            "year":     y,
            "value":    round(val, 2),
            "interest": round(val - principal, 2),
        })

    return jsonify({
        "principal":  principal,
        "annualRate": round(rate * 100, 1),
        "years":      years,
        "finalValue": round(final, 2),
        "interest":   round(interest, 2),
        "chart":      chart,
    })