// Markowitz Mean-Variance Portfolio Optimization
// Finds optimal weights, efficient frontier, and Sharpe ratio

export interface MarkowitzOutput {
    weights: { symbol: string; weight: number }[];
    sharpe: number;
    frontier: { risk: number; ret: number }[];
}

// Compute covariance matrix from returns
function covMatrix(returns: number[][]): number[][] {
    const n = returns.length;
    const T = returns[0]?.length || 0;
    const means = returns.map(r => r.reduce((s, v) => s + v, 0) / T);
    const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            let s = 0;
            for (let t = 0; t < T; t++) {
                s += (returns[i][t] - means[i]) * (returns[j][t] - means[j]);
            }
            cov[i][j] = s / (T - 1);
            cov[j][i] = cov[i][j];
        }
    }
    return cov;
}

// Solve for minimum variance portfolio with target return using Lagrangian
function minVarWeights(cov: number[][], meanReturns: number[], targetReturn: number): number[] {
    const n = cov.length;
    // Simple approach: use analytical solution for 2-asset case
    // For n-asset: use gradient descent or equal-weight fallback
    if (n === 2) {
        const w1 = (targetReturn - meanReturns[1]) / (meanReturns[0] - meanReturns[1] || 1e-10);
        return [Math.max(0, Math.min(1, w1)), Math.max(0, Math.min(1, 1 - w1))];
    }

    // Multi-asset: iterative proportional fitting (simplified)
    const weights = Array(n).fill(1 / n);
    const lr = 0.01;
    for (let iter = 0; iter < 200; iter++) {
        // Gradient of portfolio variance
        for (let i = 0; i < n; i++) {
            let grad = 0;
            for (let j = 0; j < n; j++) {
                grad += 2 * cov[i][j] * weights[j];
            }
            weights[i] -= lr * grad;
        }
        // Normalise
        const sum = weights.reduce((s, w) => s + Math.max(w, 0), 0) || 1;
        for (let i = 0; i < n; i++) {
            weights[i] = Math.max(weights[i], 0) / sum;
        }
    }
    return weights;
}

export function markowitz(
    symbols: string[],
    dailyCloses: number[][], // dailyCloses[asset][day]
    riskFreeRate = 0.05,
): MarkowitzOutput {
    if (symbols.length < 2 || dailyCloses.some(c => c.length < 20)) {
        return { weights: symbols.map(s => ({ symbol: s, weight: 1 / symbols.length })), sharpe: 0, frontier: [] };
    }

    const n = symbols.length;
    // Compute daily returns
    const returns: number[][] = dailyCloses.map(closes => {
        const ret: number[] = [];
        for (let i = 1; i < closes.length; i++) {
            ret.push(Math.log(closes[i] / closes[i - 1]));
        }
        return ret;
    });

    const meanReturns = returns.map(r => r.reduce((s, v) => s + v, 0) / r.length * 252);
    const cov = covMatrix(returns);

    // Find optimal weights (max Sharpe)
    let bestSharpe = -Infinity;
    let bestWeights = Array(n).fill(1 / n);

    // Random portfolio sampling to find approximate max Sharpe
    for (let trial = 0; trial < 1000; trial++) {
        const w = Array.from({ length: n }, () => Math.random());
        const sum = w.reduce((s, v) => s + v, 0);
        for (let i = 0; i < n; i++) w[i] /= sum;

        // Portfolio return and risk
        let pRet = 0, pVar = 0;
        for (let i = 0; i < n; i++) {
            pRet += w[i] * meanReturns[i];
            for (let j = 0; j < n; j++) {
                pVar += w[i] * w[j] * cov[i][j] * 252;
            }
        }
        const pRisk = Math.sqrt(Math.max(pVar, 1e-10));
        const sharpe = (pRet - riskFreeRate) / pRisk;

        if (sharpe > bestSharpe) {
            bestSharpe = sharpe;
            bestWeights = [...w];
        }
    }

    // Generate efficient frontier
    const frontier: { risk: number; ret: number }[] = [];
    for (let t = 0; t <= 20; t++) {
        const targetRet = Math.min(...meanReturns) + (Math.max(...meanReturns) - Math.min(...meanReturns)) * t / 20;
        const w = minVarWeights(cov, meanReturns, targetRet);
        let pRet = 0, pVar = 0;
        for (let i = 0; i < n; i++) {
            pRet += w[i] * meanReturns[i];
            for (let j = 0; j < n; j++) {
                pVar += w[i] * w[j] * cov[i][j] * 252;
            }
        }
        frontier.push({
            risk: parseFloat((Math.sqrt(Math.max(pVar, 0)) * 100).toFixed(2)),
            ret: parseFloat((pRet * 100).toFixed(2)),
        });
    }

    return {
        weights: symbols.map((s, i) => ({
            symbol: s,
            weight: parseFloat((bestWeights[i] * 100).toFixed(1)),
        })),
        sharpe: parseFloat(bestSharpe.toFixed(3)),
        frontier,
    };
}
