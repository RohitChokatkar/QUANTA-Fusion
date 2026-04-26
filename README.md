# ⚡ QUANTA-Fusion

**Institutional-grade quantitative finance platform** — Stock Analyzer · Comparison · Robo-Advisor · Blockchain Explorer · News · Tools · Glossary

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-green)](https://flask.palletsprojects.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.30-red)](https://streamlit.io)
[![Firebase](https://img.shields.io/badge/Firebase-Deployed-orange)](https://quanta-fusion.web.app)

---

## 🚀 Live Demo
- **Frontend**: https://quanta-fusion.web.app
- **GitHub**: https://github.com/RohitChokatkar/QUANTA-Fusion

---

## 📐 Architecture

```
Frontend (React SPA) ──► Flask REST API ──► quanta_fusion package
                                                ├── ingestion      (Alpha Vantage, Finnhub, TwelveData)
                                                ├── preprocessing  (cleaning, features, labeling)
                                                ├── models         (10 quant models)
                                                ├── equity_functions (Bloomberg-style: FA, RV, DES…)
                                                ├── aggregation    (scorecard, PDF/Excel export)
                                                └── ui             (Streamlit dashboard)
```

---

## 🔬 10 Quantitative Models

| # | Model | Signal Type |
|---|-------|-------------|
| 1 | Avellaneda-Stoikov Market Making | BUY_PRESSURE / SELL_PRESSURE / NEUTRAL |
| 2 | Hawkes Self-Exciting Process | CLUSTER / CALM / QUIET |
| 3 | Cross-Asset Impact Matrix | DRIVEN_UP / DRIVEN_DOWN / NEUTRAL |
| 4 | Eigenportfolio (PCA) | LONG/SHORT_REVERSION / NEUTRAL |
| 5 | Realized Volatility (GARCH) | RISK_ON / RISK_OFF / EXTREME |
| 6 | Meta-Labeling (Triple-Barrier + RF) | LONG / SHORT / HOLD |
| 7 | Orthogonal Alpha (Fama-French) | POSITIVE/NEGATIVE_ALPHA / NO_ALPHA |
| 8 | HMM Regime Detection | BULL / BEAR / CHOP |
| 9 | Adversarial Stress Testing | HIGH/MODERATE/LOW_RISK |
| 10 | Capacity & Liquidity Scaling | SCALABLE / LIMITED / CAPACITY_CONSTRAINED |

---

## ⚙️ Setup

### 1. Clone & install
```bash
git clone https://github.com/RohitChokatkar/QUANTA-Fusion.git
cd QUANTA-Fusion
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure API keys
Create a `.env` file in the project root:
```env
ALPHA_VANTAGE_KEY=your_key_here
FINNHUB_KEY=your_key_here
TWELVEDATA_KEY=your_key_here
NEWSAPI_KEY=your_key_here
```

### 3. Run Flask backend
```powershell
$env:PYTHONPATH = "C:\Users\Rohit\OneDrive\Documents\QUANTA-Fusion"
python backend/app.py
```
Backend runs at `http://127.0.0.1:5000/api`

### 4. Run Streamlit UI (Phase 4)
```bash
streamlit run quanta_fusion/ui/app.py
```

### 5. Deploy frontend
```bash
firebase deploy
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks/top` | Top 10 stocks with prices |
| GET | `/api/stocks/{sym}/detail` | Stock detail + fundamentals |
| GET | `/api/stocks/{sym}/chart` | OHLCV chart data |
| GET | `/api/stocks/{sym}/sentiment` | VADER news sentiment |
| GET | `/api/stocks/{sym}/regime` | All 10 quant model signals |
| GET | `/api/news` | Market news feed |
| GET | `/api/blockchain/{chain}` | Block explorer data |
| POST | `/api/robo-advisor` | Portfolio recommendation |
| GET | `/api/comparison` | Multi-stock comparison |

---

## 🧪 Tests
```bash
pytest tests/ -v
```

---

## 📁 Project Structure
See `docs/architecture.md` for full breakdown.

---

## 👤 Author
**Rohit Chokatkar** — [GitHub](https://github.com/RohitChokatkar/QUANTA-Fusion)
