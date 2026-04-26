// useModelOutput — fetches model outputs from Python FastAPI backend
// Falls back to client-side computation if backend unavailable
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setModelOutput } from '../store/modelSlice';
import { garch } from '../models/garch';
import { blackScholes } from '../models/blackScholes';
import { avellanedaStoikov } from '../models/avellanedaStoikov';
import { kyle } from '../models/kyle';
import { glostenMilgrom } from '../models/glostenMilgrom';
import { rlAgent } from '../models/rlAgent';

const API_BASE = import.meta.env.VITE_PYTHON_API_URL || '';

export function useModelOutput() {
    const dispatch = useDispatch();
    const { price, ohlcv, bid, ask } = useSelector((s: RootState) => s.ticker);
    const sentiment = useSelector((s: RootState) => s.models.outputs.sentiment);
    const garchOut = useSelector((s: RootState) => s.models.outputs.garch);
    const kyleOut = useSelector((s: RootState) => s.models.outputs.kyle);
    const prevPrice = useRef(0);
    const backendChecked = useRef(false);
    const useBackend = useRef(false);

    // Try fetching from Python backend
    useEffect(() => {
        if (!API_BASE) return;

        async function fetchFromBackend() {
            try {
                const resp = await fetch(`${API_BASE}/api/models`);

                // Handle token expiry
                if (resp.status === 401) {
                    useBackend.current = false;
                    backendChecked.current = true;
                    return;
                }

                if (!resp.ok) throw new Error('Backend unavailable');
                const data = await resp.json();

                // Check for token_expired in response body
                if (data.error === 'token_expired') {
                    useBackend.current = false;
                    backendChecked.current = true;
                    return;
                }

                useBackend.current = true;

                if (data.outputs) {
                    const outputs = data.outputs;
                    if (outputs.garch) dispatch(setModelOutput({ model: 'garch', data: { sigma: outputs.garch.sigma, trend: outputs.garch.direction, sparkline: outputs.garch.sparkline || [] } }));
                    if (outputs.blackScholes) dispatch(setModelOutput({ model: 'blackScholes', data: { callPrice: outputs.blackScholes.call_price, putPrice: outputs.blackScholes.put_price, delta: outputs.blackScholes.delta, gamma: outputs.blackScholes.gamma, theta: outputs.blackScholes.theta, vega: outputs.blackScholes.vega, rho: outputs.blackScholes.rho } }));
                    if (outputs.avellanedaStoikov) dispatch(setModelOutput({ model: 'avellanedaStoikov', data: { bidPrice: outputs.avellanedaStoikov.optimal_bid, askPrice: outputs.avellanedaStoikov.optimal_ask, spread: outputs.avellanedaStoikov.spread } }));
                    if (outputs.kyle) dispatch(setModelOutput({ model: 'kyle', data: { lambda: outputs.kyle.lambda, informedPct: outputs.kyle.informed_pct, toxicity: outputs.kyle.vpin } }));
                    if (outputs.glostenMilgrom) dispatch(setModelOutput({ model: 'glostenMilgrom', data: { adverseSelection: outputs.glostenMilgrom.adverse_selection, orderProcessing: outputs.glostenMilgrom.order_processing } }));
                    if (outputs.rlAgent) dispatch(setModelOutput({ model: 'rlAgent', data: { signal: outputs.rlAgent.signal, confidence: outputs.rlAgent.confidence } }));
                }
            } catch {
                useBackend.current = false;
            }
            backendChecked.current = true;
        }

        fetchFromBackend();
        const interval = setInterval(fetchFromBackend, 5000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Client-side fallback — runs when backend is NOT confirmed working
    useEffect(() => {
        if (useBackend.current && backendChecked.current) return;
        if (!price || ohlcv.length < 5) return;
        if (price === prevPrice.current) return;
        prevPrice.current = price;

        const closes = ohlcv.map(b => b.close);
        const volumes = ohlcv.map(b => b.volume);

        try { const g = garch(closes); dispatch(setModelOutput({ model: 'garch', data: g })); } catch { }
        try {
            const sigma = garchOut?.sigma ? garchOut.sigma / 100 : 0.25;
            const bsm = blackScholes(price, price, 30 / 365, 0.055, sigma);
            dispatch(setModelOutput({ model: 'blackScholes', data: bsm }));
        } catch { }
        try {
            const sigma = garchOut?.sigma ? garchOut.sigma / 100 : 0.25;
            const as = avellanedaStoikov(price, sigma, 0.1, 0);
            dispatch(setModelOutput({ model: 'avellanedaStoikov', data: as }));
        } catch { }
        try {
            const k = kyle(closes, volumes);
            dispatch(setModelOutput({ model: 'kyle', data: k }));
        } catch { }
        try {
            const bidP = bid || price * 0.999;
            const askP = ask || price * 1.001;
            const informedPct = kyleOut?.informedPct || 20;
            const gm = glostenMilgrom(bidP, askP, price, informedPct);
            dispatch(setModelOutput({ model: 'glostenMilgrom', data: gm }));
        } catch { }
        try {
            const vol = garchOut?.sigma || 25;
            const lambda = kyleOut?.lambda || 0;
            const sentScore = sentiment?.score || 50;
            const mom5 = closes.length >= 6
                ? ((closes[closes.length - 1] / closes[closes.length - 6]) - 1) * 100
                : 0;
            const rl = rlAgent(vol, lambda, sentScore, mom5);
            dispatch(setModelOutput({ model: 'rlAgent', data: rl }));
        } catch { }
    }, [price, ohlcv, dispatch, bid, ask, garchOut, kyleOut, sentiment]);
}
