"""
QUANTA-Fusion — Flask Backend
Main entry point with CORS and blueprint registration.
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Register Blueprints ───────────────────────────────────────────────────────
from routes.stocks       import stocks_bp
from routes.sentiment    import sentiment_bp
from routes.comparison   import comparison_bp
from routes.news         import news_bp
from routes.blockchain   import blockchain_bp
from routes.robo_advisor import robo_bp
from routes.tools        import tools_bp

app.register_blueprint(stocks_bp,    url_prefix="/api")
app.register_blueprint(sentiment_bp, url_prefix="/api")
app.register_blueprint(comparison_bp,url_prefix="/api")
app.register_blueprint(news_bp,      url_prefix="/api")
app.register_blueprint(blockchain_bp,url_prefix="/api")
app.register_blueprint(robo_bp,      url_prefix="/api")
app.register_blueprint(tools_bp,     url_prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({
        "status":  "ok",
        "service": "QUANTA-Fusion API",
        "version": "2.0.0",
        "routes": [
            "/api/stocks/top",
            "/api/stocks/<sym>/chart",
            "/api/stocks/<sym>/detail",
            "/api/stocks/<sym>/sub-charts",
            "/api/stocks/<sym>/sentiment",
            "/api/stocks/<sym>/report",
            "/api/indices",
            "/api/comparison?symbols=AAPL,MSFT",
            "/api/news",
            "/api/news/categories",
            "/api/blockchain/bitcoin",
            "/api/blockchain/ethereum",
            "/api/blockchain/stats",
            "/api/robo-advisor",
            "/api/tools/currency",
            "/api/tools/sip-calculator",
            "/api/tools/emi-calculator",
            "/api/tools/compound-calculator",
            "/api/tools/available-currencies",
        ]
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)