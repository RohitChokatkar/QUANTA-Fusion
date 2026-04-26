// Python FastAPI REST client — connects React to Python backend
import axios from 'axios';

const API_BASE = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

export interface BSEQuote {
    symbol: string;
    name: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    previous_close: number;
    change: number;
    change_percent: number;
    volume: number;
    bid: number;
    ask: number;
    currency: string;
}

export interface OHLCVBar {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export async function fetchQuote(symbol: string): Promise<BSEQuote> {
    const { data } = await api.get(`/api/quote/${encodeURIComponent(symbol)}`);
    return data;
}

export async function fetchHistory(symbol: string, interval = '5min', days = 1): Promise<OHLCVBar[]> {
    const { data } = await api.get(`/api/history/${encodeURIComponent(symbol)}`, {
        params: { interval, days },
    });
    return data.bars || [];
}

export async function fetchAllModels(): Promise<any> {
    const { data } = await api.get('/api/models');
    return data;
}

export async function fetchModel(modelName: string): Promise<any> {
    const { data } = await api.get(`/api/models/${modelName}`);
    return data;
}

export async function setActiveSymbol(symbol: string): Promise<void> {
    await api.post('/api/symbol', { symbol });
}

export async function fetchSentiment(symbol: string): Promise<any> {
    const { data } = await api.get(`/api/sentiment/${encodeURIComponent(symbol)}`);
    return data;
}

export async function fetchPortfolioOptimize(tickers: string[], riskAversion = 2.5): Promise<any> {
    const { data } = await api.get('/api/portfolio/optimize', {
        params: { tickers: tickers.join(','), risk_aversion: riskAversion },
    });
    return data;
}

export async function fetchMarketStatus(): Promise<any> {
    const { data } = await api.get('/api/market-status');
    return data;
}

// Check if Python backend is available
export async function isBackendAvailable(): Promise<boolean> {
    try {
        await api.get('/health', { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}
