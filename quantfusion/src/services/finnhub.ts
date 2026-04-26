// Finnhub REST service — quotes, candles, company info
import axios from 'axios';

const API_KEY = 'd6njad1r01qodk60339gd6njad1r01qodk6033a0';
const BASE = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
    c: number;  // current
    d: number;  // change
    dp: number; // percent change
    h: number;  // high
    l: number;  // low
    o: number;  // open
    pc: number; // previous close
    t: number;  // timestamp
}

export async function fetchQuote(symbol: string): Promise<FinnhubQuote> {
    const { data } = await axios.get(`${BASE}/quote`, {
        params: { symbol, token: API_KEY },
    });
    if (!data || data.c === 0) throw new Error('No quote data');
    return data;
}

export interface FinnhubCandle {
    c: number[];  // close
    h: number[];  // high
    l: number[];  // low
    o: number[];  // open
    v: number[];  // volume
    t: number[];  // timestamps
    s: string;    // status
}

export async function fetchCandles(
    symbol: string,
    resolution: string = '5',
    from?: number,
    to?: number,
): Promise<FinnhubCandle> {
    const now = Math.floor(Date.now() / 1000);
    const { data } = await axios.get(`${BASE}/stock/candle`, {
        params: {
            symbol,
            resolution,
            from: from || now - 86400,
            to: to || now,
            token: API_KEY,
        },
    });
    if (data.s === 'no_data') throw new Error('No candle data');
    return data;
}

export async function fetchCompanyProfile(symbol: string) {
    const { data } = await axios.get(`${BASE}/stock/profile2`, {
        params: { symbol, token: API_KEY },
    });
    return data;
}

export async function fetchCompanyNews(symbol: string) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const { data } = await axios.get(`${BASE}/company-news`, {
        params: { symbol, from: fmt(weekAgo), to: fmt(today), token: API_KEY },
    });
    return data || [];
}
