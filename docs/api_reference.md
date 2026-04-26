# QUANTA-Fusion — API Reference

Base URL: `http://127.0.0.1:5000/api`

---

## Stocks

### `GET /stocks/top`
Returns price data for the top 10 stocks in the universe.

**Response**
```json
[
  {"symbol":"AAPL","price":182.5,"change":1.5,"changePct":0.83,"volume":55000000},
  ...
]
```

### `GET /stocks/{sym}/detail`
Full stock detail including fundamentals.

**Parameters**: `sym` — ticker symbol (e.g. AAPL)

### `GET /stocks/{sym}/chart`
OHLCV + indicator data for charting.

**Query params**:
| Param | Default | Options |
|-------|---------|---------|
| period | 3mo | 5d, 1mo, 3mo, 6mo, 1y, 2y |
| interval | 1day | 1min, 5min, 15min, 1h, 1day |

### `GET /stocks/{sym}/sentiment`
VADER sentiment analysis from RSS news feeds.

**Response**
```json
{
  "symbol": "AAPL",
  "overallSentiment": 0.312,
  "overallLabel": "positive",
  "headlines": [{"title":"...","sentiment":{"compound":0.45},"label":"positive"}]
}
```

### `GET /stocks/{sym}/regime`
Run all 10 QUANTA quantitative models.

**Query params**: `period` (default: 3mo)

**Response**
```json
{
  "symbol": "AAPL",
  "models": {
    "hmm_regime": {"signal":"BULL","confidence":0.82,...},
    "avellaneda_stoikov": {...},
    ...
  },
  "summary": {
    "consensus": "BULL",
    "avg_confidence": 0.74,
    "bull_count": 6, "bear_count": 2, "neutral_count": 2
  }
}
```

---

## Market Data

### `GET /indices`
Returns S&P 500, NASDAQ, DOW, RUSSELL 2000, NIFTY 50.

### `GET /comparison?symbols=AAPL,MSFT&period=3mo`
Multi-stock normalised return comparison.

---

## News

### `GET /news?limit=20&category=general`
Categories: general, technology, finance, healthcare

---

## Blockchain

### `GET /blockchain/{chain}?count=10`
Chains: ETH, BTC

---

## Robo Advisor

### `POST /robo-advisor`
```json
{
  "riskProfile": "moderate",
  "investmentAmount": 50000,
  "timeHorizon": 10,
  "goal": "growth"
}
```
Risk profiles: conservative, moderate, aggressive

---

## Tools

### `GET /tools/currency?from=USD&to=INR&amount=1000`
### `GET /tools/sip-calculator?monthly=5000&rate=12&years=10`
### `GET /tools/emi-calculator?principal=2000000&rate=8.5&years=20`
### `GET /tools/fd-calculator?principal=100000&rate=7&years=1`

---

## Prediction

### `GET /stocks/{sym}/prediction?horizon=5`
Geometric Brownian Motion 5-day price projection.
