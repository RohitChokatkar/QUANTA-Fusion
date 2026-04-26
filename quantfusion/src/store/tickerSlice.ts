import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OHLCVBar {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TickerState {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    bid: number;
    ask: number;
    high: number;
    low: number;
    volume: number;
    ohlcv: OHLCVBar[];
    loading: boolean;
    error: string | null;
    lastUpdate: number;
}

const initialState: TickerState = {
    symbol: 'BSE:RELIANCE-EQ',
    price: 0,
    change: 0,
    changePercent: 0,
    bid: 0,
    ask: 0,
    high: 0,
    low: 0,
    volume: 0,
    ohlcv: [],
    loading: false,
    error: null,
    lastUpdate: 0,
};

const tickerSlice = createSlice({
    name: 'ticker',
    initialState,
    reducers: {
        setSymbol(state, action: PayloadAction<string>) {
            state.symbol = action.payload;
            state.loading = true;
            state.error = null;
        },
        updatePrice(state, action: PayloadAction<{
            price: number; change: number; changePercent: number;
            bid?: number; ask?: number; high?: number; low?: number; volume?: number;
        }>) {
            const p = action.payload;
            state.price = p.price;
            state.change = p.change;
            state.changePercent = p.changePercent;
            if (p.bid !== undefined) state.bid = p.bid;
            if (p.ask !== undefined) state.ask = p.ask;
            if (p.high !== undefined) state.high = p.high;
            if (p.low !== undefined) state.low = p.low;
            if (p.volume !== undefined) state.volume = p.volume;
            state.loading = false;
            state.lastUpdate = Date.now();
        },
        setOHLCV(state, action: PayloadAction<OHLCVBar[]>) {
            state.ohlcv = action.payload;
        },
        appendOHLCV(state, action: PayloadAction<OHLCVBar>) {
            state.ohlcv.push(action.payload);
            if (state.ohlcv.length > 200) state.ohlcv.shift();
        },
        setError(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setSymbol, updatePrice, setOHLCV, appendOHLCV, setError } = tickerSlice.actions;
export default tickerSlice.reducer;
