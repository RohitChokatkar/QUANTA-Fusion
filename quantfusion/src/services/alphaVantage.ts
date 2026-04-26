// Alpha Vantage service — historical data, fundamentals, fed rate
import axios from 'axios';

const API_KEY = 'P33ZMOT1IUOBENJ6';
const BASE = 'https://www.alphavantage.co/query';

export interface AVDailyBar {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjustedClose: number;
    volume: number;
}

export interface AVOverview {
    Symbol: string;
    Name: string;
    Description: string;
    Exchange: string;
    Sector: string;
    Industry: string;
    MarketCapitalization: string;
    PERatio: string;
    DividendYield: string;
    EPS: string;
    '52WeekHigh': string;
    '52WeekLow': string;
    Beta: string;
    [key: string]: string;
}

export async function fetchDailyAdjusted(symbol: string): Promise<AVDailyBar[]> {
    const { data } = await axios.get(BASE, {
        params: { function: 'TIME_SERIES_DAILY_ADJUSTED', symbol, outputsize: 'compact', apikey: API_KEY },
    });
    const ts = data['Time Series (Daily)'];
    if (!ts) throw new Error(data['Note'] || data['Information'] || 'Alpha Vantage rate limited');
    return Object.entries(ts).map(([date, v]: [string, any]) => ({
        date,
        open: parseFloat(v['1. open']),
        high: parseFloat(v['2. high']),
        low: parseFloat(v['3. low']),
        close: parseFloat(v['4. close']),
        adjustedClose: parseFloat(v['5. adjusted close']),
        volume: parseInt(v['6. volume']),
    })).reverse();
}

export async function fetchOverview(symbol: string): Promise<AVOverview> {
    const { data } = await axios.get(BASE, {
        params: { function: 'OVERVIEW', symbol, apikey: API_KEY },
    });
    if (!data.Symbol) throw new Error(data['Note'] || 'No overview data');
    return data;
}

export interface FedRate {
    date: string;
    rate: number;
}

export async function fetchFederalFundsRate(): Promise<FedRate[]> {
    const { data } = await axios.get(BASE, {
        params: { function: 'FEDERAL_FUNDS_RATE', interval: 'monthly', apikey: API_KEY },
    });
    const rates = data['data'];
    if (!rates) throw new Error('No fed rate data');
    return rates.slice(0, 60).map((r: any) => ({
        date: r.date,
        rate: parseFloat(r.value),
    })).reverse();
}
