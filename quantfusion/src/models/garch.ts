// GARCH(1,1) volatility forecast model
// Estimates conditional volatility from historical returns

export interface GARCHOutput {
    sigma: number;       // predicted next-day vol (annualised %)
    trend: string;       // 'rising' | 'falling' | 'stable'
    sparkline: number[]; // last 30 days of vol estimates
}

export function garch(closes: number[], omega = 0.000001, alpha = 0.1, beta = 0.85): GARCHOutput {
    if (closes.length < 10) {
        return { sigma: 0, trend: 'stable', sparkline: [] };
    }

    // Compute log returns
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        returns.push(Math.log(closes[i] / closes[i - 1]));
    }

    // Initial variance = sample variance
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    let sigma2 = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;

    const sparkline: number[] = [];
    const lookback = Math.min(returns.length, 60);
    const startIdx = returns.length - lookback;

    for (let i = startIdx; i < returns.length; i++) {
        sigma2 = omega + alpha * returns[i] ** 2 + beta * sigma2;
        sparkline.push(Math.sqrt(sigma2) * Math.sqrt(252) * 100); // annualised %
    }

    // One-step-ahead forecast
    const lastReturn = returns[returns.length - 1];
    const forecastSigma2 = omega + alpha * lastReturn ** 2 + beta * sigma2;
    const forecastVol = Math.sqrt(forecastSigma2) * Math.sqrt(252) * 100;

    // Trend detection
    const recent = sparkline.slice(-10);
    const first5 = recent.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
    const last5 = recent.slice(-5).reduce((s, v) => s + v, 0) / 5;
    const trend = last5 > first5 * 1.05 ? 'rising' : last5 < first5 * 0.95 ? 'falling' : 'stable';

    return {
        sigma: parseFloat(forecastVol.toFixed(2)),
        trend,
        sparkline: sparkline.slice(-30).map(v => parseFloat(v.toFixed(2))),
    };
}
