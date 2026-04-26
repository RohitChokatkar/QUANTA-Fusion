// useLivePrice — fetches BSE/NSE live prices from Python FastAPI backend
// Detects symbol type (stock, index, forex) and routes to correct data source
// Falls back to TwelveData (with caching), then to simulated demo data
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updatePrice, setOHLCV, setError } from '../store/tickerSlice';
import { fetchQuote as tdFetchQuote, fetchTimeSeries, clearTDCache } from '../services/twelveData';

const API_BASE = import.meta.env.VITE_PYTHON_API_URL || '';

// ── Symbol type detection ────────────────────────
type SymbolType = 'stock' | 'index' | 'forex';

function detectSymbolType(sym: string): SymbolType {
    if (sym.includes('/')) return 'forex';
    if (sym.includes('-INDEX')) return 'index';
    return 'stock';
}

// NIFTY 50 base prices — BSE closing prices April 10, 2026
const BSE_PRICES: Record<string, number> = {
    'RELIANCE': 1350.20, 'TCS': 2524.35, 'HDFCBANK': 810.30, 'ICICIBANK': 1345, 'INFY': 1292.50,
    'BHARTIARTL': 1870.00, 'ITC': 304.25, 'SBIN': 1066.70, 'LT': 3959.90, 'HINDUNILVR': 2155.30,
    'BAJFINANCE': 924.55, 'KOTAKBANK': 374.75, 'AXISBANK': 1148, 'MARUTI': 13710.95, 'TITAN': 4502.15,
    'SUNPHARMA': 1654.70, 'TATAMOTORS': 444.55, 'NTPC': 380.15, 'ONGC': 286.55, 'WIPRO': 204.88,
    'HCLTECH': 1461.00, 'POWERGRID': 310, 'ADANIENT': 2140, 'ADANIPORTS': 1453.30, 'ULTRACEMCO': 11350,
    'ASIANPAINT': 2320, 'COALINDIA': 380, 'BAJAJ-AUTO': 8920, 'BAJAJFINSV': 1790, 'NESTLEIND': 2290,
    'JSWSTEEL': 1214.80, 'TATASTEEL': 206.61, 'TECHM': 1440.20, 'GRASIM': 2742.60, 'INDUSINDBK': 830.90,
    'HINDALCO': 992.10, 'DRREDDY': 1232.00, 'M&M': 3259.80, 'CIPLA': 1229.50, 'EICHERMOT': 7424.00,
    'APOLLOHOSP': 6580, 'DIVISLAB': 5980, 'SBILIFE': 1570, 'BPCL': 290, 'TATACONSUM': 960,
    'BRITANNIA': 5450, 'HEROMOTOCO': 4320, 'HDFCLIFE': 625, 'SHRIRAMFIN': 640, 'TRENT': 4850,
};

// NSE/BSE Index base prices — closing values April 10, 2026
const INDEX_PRICES: Record<string, number> = {
    'NIFTY50': 24050.60, 'SENSEX': 77550.25, 'NIFTYBANK': 55912.75,
    'NIFTYIT': 34500, 'NIFTYNEXT50': 58600, 'NIFTYMIDCAP100': 47500,
};

// Forex base prices
const FOREX_PRICES: Record<string, number> = {
    'USD/INR': 83.50, 'EUR/USD': 1.085, 'GBP/USD': 1.254,
    'JPY/USD': 0.0065, 'AUD/USD': 0.655, 'USD/CAD': 1.365,
    'USD/CHF': 0.895, 'NZD/USD': 0.610, 'EUR/INR': 90.60, 'GBP/INR': 104.70,
};

function simpleName(sym: string) {
    return sym.replace('BSE:', '').replace('NSE:', '').replace('-EQ', '').replace('-INDEX', '');
}

function getBasePrice(sym: string): number {
    const type = detectSymbolType(sym);
    if (type === 'forex') return FOREX_PRICES[sym] || 1.0;
    if (type === 'index') return INDEX_PRICES[simpleName(sym)] || 20000;
    const name = simpleName(sym);
    return BSE_PRICES[name] || 1000 + Math.random() * 2000;
}

/** Generate realistic simulated OHLCV bars for demo */
function generateDemoOHLCV(basePrice: number, count = 78): any[] {
    const bars: any[] = [];
    let price = basePrice * (0.995 + Math.random() * 0.01);
    const now = new Date();
    // Start from 9:15 AM IST today
    const istOffset = 5.5 * 60;
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utcMs + istOffset * 60000);
    ist.setHours(9, 15, 0, 0);

    for (let i = 0; i < count; i++) {
        const time = new Date(ist.getTime() + i * 5 * 60000);
        const change = (Math.random() - 0.48) * 0.006; // slight upward bias
        price *= (1 + change);
        const spread = price * 0.008; // wider spread so H/L lines are clearly visible
        const open = price * (1 + (Math.random() - 0.5) * 0.004);
        const close = price;
        const high = Math.max(open, close) + (0.3 + Math.random() * 0.7) * spread;
        const low = Math.min(open, close) - (0.3 + Math.random() * 0.7) * spread;
        const volume = Math.floor(50000 + Math.random() * 500000);

        bars.push({
            time: time.toISOString(),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume,
        });
    }
    return bars;
}

/** Generate simulated quote from OHLCV */
function generateDemoQuote(sym: string, ohlcv: any[]) {
    const last = ohlcv[ohlcv.length - 1];
    const first = ohlcv[0];
    const change = last.close - first.open;
    const changePct = (change / first.open) * 100;
    return {
        price: last.close,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePct.toFixed(2)),
        high: Math.max(...ohlcv.map((b: any) => b.high)),
        low: Math.min(...ohlcv.map((b: any) => b.low)),
        volume: ohlcv.reduce((s: number, b: any) => s + b.volume, 0),
        bid: parseFloat((last.close * 0.9995).toFixed(2)),
        ask: parseFloat((last.close * 1.0005).toFixed(2)),
    };
}

// Track data source for logging
type DataSource = 'backend' | 'twelvedata' | 'demo';
let currentSource: DataSource = 'demo';

export function getDataSource(): DataSource {
    return currentSource;
}

export function useLivePrice() {
    const dispatch = useDispatch();
    const symbol = useSelector((s: RootState) => s.ticker.symbol);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const backendAvailable = useRef<boolean | null>(null);
    const tdAvailable = useRef<boolean | null>(null);
    const demoOHLCV = useRef<any[]>([]);
    const demoPriceRef = useRef(0);

    const symbolType = detectSymbolType(symbol);

    const fetchFromBackend = useCallback(async () => {
        if (!API_BASE) return false;
        try {
            const resp = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(symbol)}`, {
                signal: AbortSignal.timeout(5000),
            });

            // Handle token expiry — 401 status
            if (resp.status === 401) {
                const errData = await resp.json().catch(() => ({}));
                if (errData.error === 'token_expired') {
                    dispatch(setError('token_expired'));
                    console.warn('[QuantFusion] ⚠ Backend token expired — showing refresh banner');
                    return false;
                }
            }

            if (!resp.ok) throw new Error('Backend unavailable');
            const quote = await resp.json();

            // Check for token_expired in response body (non-401 case)
            if (quote.error === 'token_expired') {
                dispatch(setError('token_expired'));
                console.warn('[QuantFusion] ⚠ Backend token expired — showing refresh banner');
                return false;
            }

            // ── DEBUG: Log raw backend response ──
            console.log(`[QuantFusion] 🔍 Raw backend response for ${symbol}:`, JSON.stringify(quote, null, 2));

            if (!quote.price && !quote.close) throw new Error('Empty quote');
            dispatch(updatePrice({
                price: quote.price || quote.close || 0,
                change: quote.change || 0,
                changePercent: quote.change_percent || 0,
                high: quote.high || 0,
                low: quote.low || 0,
                volume: quote.volume || 0,
                bid: quote.bid || 0,
                ask: quote.ask || 0,
            }));
            currentSource = 'backend';
            console.log(`[QuantFusion] ✓ Live data for ${simpleName(symbol)} from Python backend — ₹${quote.price}`);
            return true;
        } catch {
            return false;
        }
    }, [symbol, dispatch]);

    const fetchFromTD = useCallback(async (): Promise<boolean> => {
        try {
            // For forex symbols, use the pair directly; for stocks, use simple name
            const tdSymbol = symbolType === 'forex' ? symbol : simpleName(symbol);
            const quote = await tdFetchQuote(tdSymbol);

            // ── DEBUG: Log raw TwelveData response ──
            console.log(`[QuantFusion] 🔍 Raw TwelveData response for ${tdSymbol}:`, JSON.stringify(quote, null, 2));

            if (!quote.price || isNaN(quote.price) || quote.price <= 0) throw new Error('Invalid quote');
            dispatch(updatePrice({
                price: quote.price,
                change: quote.change,
                changePercent: quote.percent_change,
                high: quote.high,
                low: quote.low,
                volume: quote.volume,
            }));
            currentSource = 'twelvedata';
            console.log(`[QuantFusion] ✓ Live data for ${simpleName(symbol)} from TwelveData — ₹${quote.price}`);
            return true;
        } catch (err) {
            console.warn(`[QuantFusion] TwelveData quote failed for ${simpleName(symbol)}:`, err);
            return false;
        }
    }, [symbol, symbolType, dispatch]);

    const fetchTDHistory = useCallback(async (): Promise<boolean> => {
        try {
            const tdSymbol = symbolType === 'forex' ? symbol : simpleName(symbol);
            const bars = await fetchTimeSeries(tdSymbol, '5min', 78);
            if (bars.length > 0) {
                dispatch(setOHLCV(bars.map(b => ({
                    time: b.datetime, open: b.open, high: b.high,
                    low: b.low, close: b.close, volume: b.volume,
                }))));
                console.log(`[QuantFusion] ✓ ${bars.length} OHLCV bars loaded from TwelveData (5min)`);
                return true;
            }
            return false;
        } catch (err) {
            console.warn(`[QuantFusion] TwelveData history failed:`, err);
            return false;
        }
    }, [symbol, symbolType, dispatch]);

    /** Simulated demo data — always works */
    const loadDemoData = useCallback(() => {
        const base = getBasePrice(symbol);
        const bars = generateDemoOHLCV(base, 78);
        demoOHLCV.current = bars;
        demoPriceRef.current = bars[bars.length - 1].close;

        dispatch(setOHLCV(bars));
        const quote = generateDemoQuote(symbol, bars);
        dispatch(updatePrice(quote));
        currentSource = 'demo';
        console.log(`[QuantFusion] ⚠ Using demo data for ${simpleName(symbol)} (base: ₹${base}). Prices are simulated.`);
    }, [symbol, dispatch]);

    /** Tick the demo price forward */
    const tickDemo = useCallback(() => {
        if (demoOHLCV.current.length === 0) return;
        const lastBar = demoOHLCV.current[demoOHLCV.current.length - 1];
        const price = lastBar.close * (1 + (Math.random() - 0.48) * 0.005);
        const spread = price * 0.006; // wider spread for visible H/L lines
        const newBar = {
            time: new Date().toISOString(),
            open: lastBar.close,
            high: parseFloat(Math.max(lastBar.close, price + (0.3 + Math.random() * 0.7) * spread).toFixed(2)),
            low: parseFloat(Math.min(lastBar.close, price - (0.3 + Math.random() * 0.7) * spread).toFixed(2)),
            close: parseFloat(price.toFixed(2)),
            volume: Math.floor(50000 + Math.random() * 400000),
        };
        demoOHLCV.current = [...demoOHLCV.current.slice(1), newBar];
        dispatch(setOHLCV(demoOHLCV.current));

        const quote = generateDemoQuote(symbol, demoOHLCV.current);
        dispatch(updatePrice(quote));
    }, [symbol, dispatch]);

    const fetchData = useCallback(async () => {
        // If already in demo mode, just tick
        if (backendAvailable.current === false && tdAvailable.current === false) {
            tickDemo();
            return;
        }

        // Try backend first
        const backendOk = await fetchFromBackend();
        if (backendOk) {
            backendAvailable.current = true;
            return;
        }

        // Then try TwelveData
        const tdOk = await fetchFromTD();
        if (tdOk) {
            tdAvailable.current = true;
            backendAvailable.current = false;
            return;
        }

        // Both failed — switch to demo mode
        if (demoOHLCV.current.length === 0) {
            loadDemoData();
        } else {
            tickDemo();
        }
        backendAvailable.current = false;
        tdAvailable.current = false;
    }, [fetchFromBackend, fetchFromTD, loadDemoData, tickDemo]);

    const fetchHistory = useCallback(async () => {
        // Try backend
        if (API_BASE) {
            try {
                const resp = await fetch(`${API_BASE}/api/history/${encodeURIComponent(symbol)}?interval=5min&days=1`, {
                    signal: AbortSignal.timeout(5000),
                });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.bars && data.bars.length > 0) {
                        dispatch(setOHLCV(data.bars.map((b: any) => ({
                            time: b.time, open: b.open, high: b.high,
                            low: b.low, close: b.close, volume: b.volume,
                        }))));
                        console.log(`[QuantFusion] ✓ ${data.bars.length} OHLCV bars loaded from backend`);
                        return;
                    }
                }
            } catch { /* fallback */ }
        }

        // Try TwelveData
        const tdOk = await fetchTDHistory();
        if (tdOk) return;

        // Demo data fallback
        loadDemoData();
    }, [symbol, dispatch, loadDemoData, fetchTDHistory]);

    useEffect(() => {
        // Reset state on symbol change
        backendAvailable.current = null;
        tdAvailable.current = null;
        demoOHLCV.current = [];
        clearTDCache(); // clear cache for fresh symbol data

        console.log(`[QuantFusion] 🔄 Symbol changed → ${symbol} (type: ${detectSymbolType(symbol)})`);

        fetchHistory();
        fetchData();
        intervalRef.current = setInterval(fetchData, 300000); // refresh every 5 minutes
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

    return { refetch: fetchData };
}
