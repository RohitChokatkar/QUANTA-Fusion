# QUANTA-Fusion — User Guide

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js / Firebase CLI (for frontend deployment)
- Free API keys from: Alpha Vantage, Finnhub, TwelveData, NewsAPI

### Quick Start

```powershell
# 1. Clone & setup (Windows PowerShell)
cd "C:\Users\Rohit\OneDrive\Documents"
git clone https://github.com/RohitChokatkar/QUANTA-Fusion.git
cd QUANTA-Fusion
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Set API keys
$env:ALPHA_VANTAGE_KEY = "your_key"
$env:FINNHUB_KEY       = "your_key"

# 3. Run backend
$env:PYTHONPATH = "C:\Users\Rohit\OneDrive\Documents\QUANTA-Fusion"
python backend/app.py

# 4. Open frontend
# Visit http://127.0.0.1:5000 or open frontend/index.html
```

---

## Stock Analyzer Tabs

### Overview
- Candlestick chart with MA20/MA50/BB/RSI toggles
- 4 sub-charts: Liquidity, Volatility, Scalability, Momentum
- Company info panel + financial metrics

### Technicals
- Full-screen chart with all indicators
- 2×2 sub-chart grid

### Sentiment
- VADER compound score (−1 to +1)
- Positive / Negative / Neutral breakdown bars
- Latest headlines with sentiment labels

### Regime Models
Live data from `/api/stocks/{sym}/regime`:
- Consensus signal + average confidence
- All 10 model results in a table
- Explanation cards per model

### News
- 2-column headline cards
- Colour-coded by sentiment

---

## 10 Quantitative Models Explained

| Model | What it does | When useful |
|-------|-------------|-------------|
| **Avellaneda-Stoikov** | Market-making reservation price | Detect buy/sell pressure from microstructure |
| **Hawkes Process** | Self-exciting jump clustering | Identify volatility clustering / event-driven moves |
| **Cross-Impact** | How correlated assets drive target | Sector rotation, contagion risk |
| **Eigenportfolio** | PCA idiosyncratic z-score | Mean-reversion vs sector beta |
| **Realized Volatility (GARCH)** | Vol regime + forecast | Risk sizing, options pricing |
| **Meta-Labeling** | Triple-barrier + RF signal filter | Improve entry/exit precision |
| **Orthogonal Alpha** | Fama-French factor residual | Pure skill vs factor exposure |
| **HMM Regime** | 3-state hidden Markov regime | Market context: bull/bear/chop |
| **Adversarial Stress** | Student-t VaR / CVaR | Tail risk quantification |
| **Capacity Scaling** | Break-even AUM vs impact | Position sizing, strategy scalability |

---

## Streamlit UI (Phase 4)

```bash
streamlit run quanta_fusion/ui/app.py
```

Pages:
1. **Overview** — market dashboard with live quotes
2. **Stock Analyzer** — full model suite + charts
3. **Screener** — filter universe by P/E, ROE
4. **Stress Tester** — tail risk scenarios

---

## Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase init hosting   # set public directory to "frontend"
firebase deploy
```

Live: https://quanta-fusion.web.app
