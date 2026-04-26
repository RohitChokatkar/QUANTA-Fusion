import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModelOutputs {
    garch: { sigma: number; trend: string; sparkline: number[] } | null;
    blackScholes: { callPrice: number; putPrice: number; delta: number; gamma: number; theta: number; vega: number; rho: number } | null;
    vasicek: { forecastCurve: { month: number; rate: number }[]; meanRevSpeed: number; longRunRate: number } | null;
    avellanedaStoikov: { bidPrice: number; askPrice: number; spread: number } | null;
    kyle: { lambda: number; informedPct: number; toxicity: number } | null;
    glostenMilgrom: { adverseSelection: number; orderProcessing: number } | null;
    markowitz: { weights: { symbol: string; weight: number }[]; sharpe: number; frontier: { risk: number; ret: number }[] } | null;
    heston: { surface: { strike: number; expiry: number; vol: number }[]; kappa: number; theta: number; xi: number } | null;
    almgrenChriss: { schedule: { bucket: number; lots: number }[]; impactCost: number; riskScore: number } | null;
    rlAgent: { signal: 'BUY' | 'HOLD' | 'SELL'; confidence: number } | null;
    sentiment: { score: number; positiveHeadlines: string[]; negativeHeadlines: string[]; breakdown: { positive: number; neutral: number; negative: number } } | null;
}

interface ModelState {
    outputs: ModelOutputs;
    activeModels: Set<string>;
    computing: boolean;
}

const initialState: ModelState = {
    outputs: {
        garch: null, blackScholes: null, vasicek: null, avellanedaStoikov: null,
        kyle: null, glostenMilgrom: null, markowitz: null, heston: null,
        almgrenChriss: null, rlAgent: null, sentiment: null,
    },
    activeModels: new Set(['garch', 'blackScholes', 'avellanedaStoikov', 'kyle', 'sentiment', 'rlAgent']),
    computing: false,
};

const modelSlice = createSlice({
    name: 'models',
    initialState,
    reducers: {
        setModelOutput(state, action: PayloadAction<{ model: keyof ModelOutputs; data: any }>) {
            (state.outputs as any)[action.payload.model] = action.payload.data;
        },
        toggleModel(state, action: PayloadAction<string>) {
            const s = state.activeModels as any;
            if (s.has) {
                // Set-like behavior with plain object fallback for Redux serialization
            }
        },
        setComputing(state, action: PayloadAction<boolean>) {
            state.computing = action.payload;
        },
        clearOutputs(state) {
            Object.keys(state.outputs).forEach(k => {
                (state.outputs as any)[k] = null;
            });
        },
    },
});

export const { setModelOutput, toggleModel, setComputing, clearOutputs } = modelSlice.actions;
export default modelSlice.reducer;
