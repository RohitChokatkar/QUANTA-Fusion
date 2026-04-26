# QUANTA-Fusion — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend Layer (React SPA — firebase deploy)                   │
│  frontend/index.html  ◄──────────────────────────────────────── │
│       React 18 + Chart.js 4 + Syne font + gold/cyan theme       │
└────────────────────┬────────────────────────────────────────────┘
                     │  HTTP REST (localhost:5000/api)
┌────────────────────▼────────────────────────────────────────────┐
│  Backend Layer (Flask 3.0)                                       │
│  backend/app.py + routes/                                        │
│  ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ /stocks/* │ │ /news      │ │/blockchain│ │/robo-advisor   │  │
│  │ /indices  │ │ /comparison│ │/tools/*  │ │/regime (QUANTA)│  │
│  └───────────┘ └────────────┘ └──────────┘ └────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │  Python imports
┌────────────────────▼────────────────────────────────────────────┐
│  quanta_fusion Package                                           │
│                                                                  │
│  ingestion/          preprocessing/       models/               │
│  ├─ alpha_vantage    ├─ cleaner.py        ├─ model_1 … model_10 │
│  ├─ finnhub          ├─ features.py       │  (each a sub-pkg)   │
│  ├─ twelvedata       ├─ labeling.py       └─ base.py            │
│  ├─ news_fetcher     └─ regime_utils.py                         │
│  └─ blockchain_fetcher                                          │
│                                                                  │
│  equity_functions/   aggregation/         ui/                   │
│  FA, RV, DES, BI …   scorecard.py         Streamlit app         │
│  factory.py          report_generator     pages/, components/   │
│                       exporters.py                              │
│                                                                  │
│  utils/                                                         │
│  logger, config_loader, cache, decorators, math_helpers         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Ingestion** — fetches from Alpha Vantage / Finnhub / TwelveData with TTL cache
2. **Preprocessing** — clean, add features, triple-barrier labels
3. **Models** — each model runs independently, returns standardised dict
4. **Aggregation** — scorecard consensus, PDF/Excel export
5. **API** — Flask routes call models & fetchers, return JSON
6. **UI** — React SPA consumes Flask API; Streamlit uses package directly

## Caching Strategy

| Layer | Backend | TTL |
|-------|---------|-----|
| Quote | In-memory (utils/cache.py) | 60s |
| OHLCV | In-memory | 5 min |
| Overview | In-memory | 1 hr |
| News | In-memory | 10 min |
| Regime | In-memory | 5 min |

## Model Architecture

Each model lives in `quanta_fusion/models/model_N_name/`:
- `model.py` — main `run(prices, **kwargs) → dict` entry point
- `calibration.py` — parameter estimation helpers
- Helper modules specific to the model (diagnostics, kernels, etc.)

All models return a standardised dict with at minimum:
```python
{
    "model":       str,   # model name
    "signal":      str,   # primary trading signal
    "confidence":  float, # 0.0 – 1.0
    "implication": str,   # human-readable description
    "color":       str,   # hex colour for UI (#16A34A / #DC2626 / #D97706)
}
```
