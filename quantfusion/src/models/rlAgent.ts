// Reinforcement Learning Agent — Q-learning trade signal
// State: [GARCH vol, Kyle lambda, sentiment, momentum]
// Action: BUY / HOLD / SELL

export interface RLOutput {
    signal: 'BUY' | 'HOLD' | 'SELL';
    confidence: number; // 0-100%
}

// Discretise continuous state into buckets
function discretise(value: number, min: number, max: number, buckets: number): number {
    const normalised = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
    return Math.min(Math.floor(normalised * buckets), buckets - 1);
}

// Pre-trained Q-table (simplified — trained offline on historical patterns)
// Dimensions: vol_state(3) x lambda_state(3) x sentiment_state(3) x momentum_state(3) x action(3)
function getQTable(): number[][][][][] {
    // Heuristic Q-values encoding market regime logic:
    // Low vol + high sentiment + positive momentum → BUY
    // High vol + low sentiment + negative momentum → SELL
    // Otherwise → HOLD
    const Q: number[][][][][] = [];
    for (let v = 0; v < 3; v++) {
        Q[v] = [];
        for (let l = 0; l < 3; l++) {
            Q[v][l] = [];
            for (let s = 0; s < 3; s++) {
                Q[v][l][s] = [];
                for (let m = 0; m < 3; m++) {
                    // [BUY, HOLD, SELL] Q-values
                    const buyQ = (2 - v) * 0.3 + s * 0.3 + m * 0.3 - l * 0.1;
                    const holdQ = 0.5 + (1 - Math.abs(v - 1)) * 0.2;
                    const sellQ = v * 0.3 + (2 - s) * 0.3 + (2 - m) * 0.3 + l * 0.1;
                    Q[v][l][s][m] = [buyQ, holdQ, sellQ];
                }
            }
        }
    }
    return Q;
}

const Q_TABLE = getQTable();

export function rlAgent(
    garchVol: number,       // annualised vol %
    kyleLambda: number,     // lambda from Kyle model
    sentimentScore: number, // 0-100 bullish score
    momentum: number,       // 5-day price momentum (%)
): RLOutput {
    // Discretise state
    const volState = discretise(garchVol, 10, 50, 3);
    const lambdaState = discretise(kyleLambda, 0, 10, 3);
    const sentState = discretise(sentimentScore, 0, 100, 3);
    const momState = discretise(momentum, -5, 5, 3);

    // Look up Q-values
    const qValues = Q_TABLE[volState][lambdaState][sentState][momState];
    const maxQ = Math.max(...qValues);
    const actionIdx = qValues.indexOf(maxQ);

    const actions: ('BUY' | 'HOLD' | 'SELL')[] = ['BUY', 'HOLD', 'SELL'];
    const signal = actions[actionIdx];

    // Confidence = softmax probability of chosen action
    const expQ = qValues.map(q => Math.exp(q * 2)); // temperature = 0.5
    const sumExp = expQ.reduce((s, e) => s + e, 0);
    const confidence = (expQ[actionIdx] / sumExp) * 100;

    return {
        signal,
        confidence: parseFloat(confidence.toFixed(1)),
    };
}
