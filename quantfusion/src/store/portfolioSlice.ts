import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PortfolioState {
    watchlist: string[];
    selectedTickers: string[];
    riskAversion: number;
    allocations: { symbol: string; weight: number }[];
}

const initialState: PortfolioState = {
    watchlist: ['BSE:RELIANCE-EQ', 'BSE:TCS-EQ', 'BSE:INFY-EQ', 'BSE:HDFCBANK-EQ', 'BSE:WIPRO-EQ'],
    selectedTickers: ['BSE:RELIANCE-EQ', 'BSE:TCS-EQ'],
    riskAversion: 2.5,
    allocations: [],
};

const portfolioSlice = createSlice({
    name: 'portfolio',
    initialState,
    reducers: {
        addToWatchlist(state, action: PayloadAction<string>) {
            if (!state.watchlist.includes(action.payload)) {
                state.watchlist.push(action.payload);
            }
        },
        removeFromWatchlist(state, action: PayloadAction<string>) {
            state.watchlist = state.watchlist.filter(s => s !== action.payload);
        },
        setSelectedTickers(state, action: PayloadAction<string[]>) {
            state.selectedTickers = action.payload;
        },
        setRiskAversion(state, action: PayloadAction<number>) {
            state.riskAversion = action.payload;
        },
        setAllocations(state, action: PayloadAction<{ symbol: string; weight: number }[]>) {
            state.allocations = action.payload;
        },
    },
});

export const { addToWatchlist, removeFromWatchlist, setSelectedTickers, setRiskAversion, setAllocations } = portfolioSlice.actions;
export default portfolioSlice.reducer;
