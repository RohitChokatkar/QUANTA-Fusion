// TwelveData REST API service — with response caching + retry for BSE data
import axios from 'axios';

const API_KEY = import.meta.env.VITE_TWELVEDATA_KEY || '2a7fe93e361240dea043316feee35c57';
const BASE = 'https://api.twelvedata.com';

// ── Cache layer ────────────────────────────────────
interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const quoteCache = new Map<string, CacheEntry<TDQuote>>();
const seriesCache = new Map<string, CacheEntry<TDBar[]>>();
const dailyCache = new Map<string, CacheEntry<TDBar[]>>();

const QUOTE_TTL = 60_000;       // 1 minute for quotes
const SERIES_TTL = 300_000;     // 5 minutes for intraday series
const DAILY_TTL = 3600_000;     // 1 hour for daily history

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.data;
    if (entry) cache.delete(key);
    return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number) {
    cache.set(key, { data, expiry: Date.now() + ttl });
}

// ── Rate limit tracking ────────────────────────────
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 8000; // 8 seconds between calls (free tier: 8/min)

async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = MIN_CALL_INTERVAL - (now - lastCallTime);
    if (wait > 0) {
        await new Promise(resolve => setTimeout(resolve, wait));
    }
    lastCallTime = Date.now();
    return fn();
}

// ── Retry with backoff ─────────────────────────────
async function retryCall<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            if (i === retries) throw err;
            // If rate limited (HTTP 429 or API code), wait longer
            const isRateLimit = err?.response?.status === 429 ||
                err?.message?.includes('rate limit') ||
                err?.message?.includes('Too many');
            const delay = isRateLimit ? 15000 : 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Retry exhausted');
}

// ── Types ──────────────────────────────────────────
export interface TDQuote {
    symbol: string;
    name: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    previous_close: number;
    change: number;
    percent_change: number;
    volume: number;
    timestamp: number;
}

export interface TDBar {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// ── BSE Symbol Resolution ──────────────────────────
// TwelveData supports Indian BSE stocks as: RELIANCE.BSE or BSE:RELIANCE
// We try multiple formats to maximize hit rate
function getBSEformats(symbol: string): string[] {
    const clean = symbol.replace('.BSE', '').replace(':BSE', '');
    return [
        `${clean}.BSE`,   // RELIANCE.BSE — most common working format
        `BSE:${clean}`,   // BSE:RELIANCE
        clean,            // Plain RELIANCE (sometimes resolves to NSE)
    ];
}

// ── Public API ─────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<TDQuote> {
    // Check cache first
    const cached = getCached(quoteCache, symbol);
    if (cached) return cached;

    const formats = getBSEformats(symbol);

    return retryCall(async () => {
        return rateLimitedCall(async () => {
            let lastError: any = null;

            for (const fmt of formats) {
                try {
                    const { data } = await axios.get(`${BASE}/quote`, {
                        params: { symbol: fmt, apikey: API_KEY },
                        timeout: 10000,
                    });

                    if (data.code) {
                        lastError = new Error(data.message || 'TwelveData error');
                        continue;
                    }

                    const result: TDQuote = {
                        symbol: data.symbol || symbol,
                        name: data.name || symbol,
                        price: parseFloat(data.close) || 0,
                        open: parseFloat(data.open) || 0,
                        high: parseFloat(data.high) || 0,
                        low: parseFloat(data.low) || 0,
                        close: parseFloat(data.close) || 0,
                        previous_close: parseFloat(data.previous_close) || 0,
                        change: parseFloat(data.change) || 0,
                        percent_change: parseFloat(data.percent_change) || 0,
                        volume: parseInt(data.volume) || 0,
                        timestamp: data.timestamp,
                    };

                    // Only cache valid quotes
                    if (result.price > 0) {
                        setCache(quoteCache, symbol, result, QUOTE_TTL);
                    }

                    return result;
                } catch (err) {
                    lastError = err;
                }
            }

            throw lastError || new Error('All symbol formats failed');
        });
    });
}

export async function fetchTimeSeries(
    symbol: string,
    interval: string = '5min',
    outputsize: number = 78,
): Promise<TDBar[]> {
    const cacheKey = `${symbol}:${interval}:${outputsize}`;

    // Check cache
    const cached = getCached(seriesCache, cacheKey);
    if (cached) return cached;

    const formats = getBSEformats(symbol);

    return retryCall(async () => {
        return rateLimitedCall(async () => {
            let lastError: any = null;

            for (const fmt of formats) {
                try {
                    const { data } = await axios.get(`${BASE}/time_series`, {
                        params: { symbol: fmt, interval, outputsize, apikey: API_KEY },
                        timeout: 15000,
                    });

                    if (data.code) {
                        lastError = new Error(data.message || 'TwelveData error');
                        continue;
                    }

                    const bars: TDBar[] = (data.values || []).map((v: any) => ({
                        datetime: v.datetime,
                        open: parseFloat(v.open) || 0,
                        high: parseFloat(v.high) || 0,
                        low: parseFloat(v.low) || 0,
                        close: parseFloat(v.close) || 0,
                        volume: parseInt(v.volume) || 0,
                    })).reverse();

                    if (bars.length > 0) {
                        setCache(seriesCache, cacheKey, bars, SERIES_TTL);
                    }

                    return bars;
                } catch (err) {
                    lastError = err;
                }
            }

            throw lastError || new Error('All symbol formats failed');
        });
    });
}

export async function fetchDailyHistory(
    symbol: string,
    outputsize: number = 365,
): Promise<TDBar[]> {
    const cacheKey = `daily:${symbol}:${outputsize}`;

    // Check cache (daily data cached longer)
    const cached = getCached(dailyCache, cacheKey);
    if (cached) return cached;

    const formats = getBSEformats(symbol);

    return retryCall(async () => {
        return rateLimitedCall(async () => {
            let lastError: any = null;

            for (const fmt of formats) {
                try {
                    const { data } = await axios.get(`${BASE}/time_series`, {
                        params: { symbol: fmt, interval: '1day', outputsize, apikey: API_KEY },
                        timeout: 15000,
                    });

                    if (data.code) {
                        lastError = new Error(data.message || 'TwelveData error');
                        continue;
                    }

                    const bars: TDBar[] = (data.values || []).map((v: any) => ({
                        datetime: v.datetime,
                        open: parseFloat(v.open) || 0,
                        high: parseFloat(v.high) || 0,
                        low: parseFloat(v.low) || 0,
                        close: parseFloat(v.close) || 0,
                        volume: parseInt(v.volume) || 0,
                    })).reverse();

                    if (bars.length > 0) {
                        setCache(dailyCache, cacheKey, bars, DAILY_TTL);
                    }

                    return bars;
                } catch (err) {
                    lastError = err;
                }
            }

            throw lastError || new Error('All symbol formats failed');
        });
    });
}

export async function fetchMultiQuote(symbols: string[]): Promise<Record<string, TDQuote>> {
    const result: Record<string, TDQuote> = {};

    // Check cached first
    const uncached: string[] = [];
    for (const sym of symbols) {
        const cached = getCached(quoteCache, sym);
        if (cached) {
            result[sym] = cached;
        } else {
            uncached.push(sym);
        }
    }

    // Fetch uncached one by one (multi-quote doesn't work well with BSE symbols)
    for (const sym of uncached) {
        try {
            result[sym] = await fetchQuote(sym);
        } catch {
            // Skip failed symbols
        }
    }

    return result;
}

/** Clear all caches — useful when switching symbols */
export function clearTDCache() {
    quoteCache.clear();
    seriesCache.clear();
    dailyCache.clear();
}
