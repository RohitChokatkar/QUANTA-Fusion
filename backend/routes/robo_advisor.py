"""
Robo-advisor route — MPT-based portfolio allocation.
"""
from flask import Blueprint, jsonify, request

robo_bp = Blueprint("robo_advisor", __name__)

ALLOCATIONS = {
    "conservative": {
        "stocks": 20, "bonds": 50, "cash": 15, "gold": 10, "reits": 5,
        "description": "Low-risk portfolio focused on capital preservation with steady income from bonds.",
        "expectedReturn": "4-6%",
        "risk": "Low",
    },
    "moderate": {
        "stocks": 45, "bonds": 30, "cash": 10, "gold": 8, "reits": 7,
        "description": "Balanced portfolio offering growth potential with moderate risk exposure.",
        "expectedReturn": "6-9%",
        "risk": "Medium",
    },
    "aggressive": {
        "stocks": 70, "bonds": 15, "cash": 5, "gold": 5, "reits": 5,
        "description": "Growth-oriented portfolio maximizing equity exposure for long-term wealth building.",
        "expectedReturn": "9-14%",
        "risk": "High",
    },
    "very_aggressive": {
        "stocks": 85, "bonds": 5, "cash": 3, "gold": 4, "reits": 3,
        "description": "Maximum growth portfolio for investors with high risk tolerance and long horizon.",
        "expectedReturn": "12-18%",
        "risk": "Very High",
    },
}


@robo_bp.route("/robo-advisor", methods=["POST"])
def robo_advisor():
    """Generate portfolio allocation based on questionnaire answers."""
    data = request.get_json() or {}
    risk = data.get("riskTolerance", "moderate")       # low, moderate, high, very_high
    horizon = data.get("horizon", "medium")             # short, medium, long
    goal = data.get("goal", "growth")                   # preservation, income, growth, aggressive_growth

    # Map inputs to allocation profile
    if risk == "low" or (horizon == "short" and goal == "preservation"):
        profile = "conservative"
    elif risk == "high" and horizon == "long":
        profile = "very_aggressive"
    elif risk == "high" or goal == "aggressive_growth":
        profile = "aggressive"
    else:
        profile = "moderate"

    alloc = ALLOCATIONS[profile]
    return jsonify({
        "profile": profile,
        "allocation": {
            "Stocks": alloc["stocks"],
            "Bonds": alloc["bonds"],
            "Cash": alloc["cash"],
            "Gold": alloc["gold"],
            "REITs": alloc["reits"],
        },
        "description": alloc["description"],
        "expectedReturn": alloc["expectedReturn"],
        "riskLevel": alloc["risk"],
        "recommendations": _get_recommendations(profile),
    })


def _get_recommendations(profile):
    recs = {
        "conservative": [
            {"asset": "Vanguard Total Bond (BND)", "type": "Bonds", "allocation": "30%"},
            {"asset": "iShares TIPS Bond (TIP)", "type": "Bonds", "allocation": "20%"},
            {"asset": "S&P 500 Index (VOO)", "type": "Stocks", "allocation": "20%"},
            {"asset": "Gold ETF (GLD)", "type": "Gold", "allocation": "10%"},
        ],
        "moderate": [
            {"asset": "S&P 500 Index (VOO)", "type": "Stocks", "allocation": "25%"},
            {"asset": "NASDAQ-100 (QQQ)", "type": "Stocks", "allocation": "20%"},
            {"asset": "Total Bond Market (BND)", "type": "Bonds", "allocation": "30%"},
            {"asset": "Vanguard REIT (VNQ)", "type": "REITs", "allocation": "7%"},
        ],
        "aggressive": [
            {"asset": "S&P 500 Index (VOO)", "type": "Stocks", "allocation": "30%"},
            {"asset": "NASDAQ-100 (QQQ)", "type": "Stocks", "allocation": "25%"},
            {"asset": "Growth ETF (VUG)", "type": "Stocks", "allocation": "15%"},
            {"asset": "Total Bond Market (BND)", "type": "Bonds", "allocation": "15%"},
        ],
        "very_aggressive": [
            {"asset": "NASDAQ-100 (QQQ)", "type": "Stocks", "allocation": "35%"},
            {"asset": "Growth ETF (VUG)", "type": "Stocks", "allocation": "25%"},
            {"asset": "Semiconductor ETF (SOXX)", "type": "Stocks", "allocation": "25%"},
            {"asset": "Gold ETF (GLD)", "type": "Gold", "allocation": "4%"},
        ],
    }
    return recs.get(profile, recs["moderate"])
