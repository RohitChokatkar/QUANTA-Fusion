// Black-Scholes-Merton option pricing + all 5 Greeks

export interface BSMOutput {
    callPrice: number;
    putPrice: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}

// Standard normal CDF (Abramowitz & Stegun approximation)
function normCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const t = 1.0 / (1.0 + p * Math.abs(x));
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
    return 0.5 * (1.0 + sign * y);
}

// Standard normal PDF
function normPDF(x: number): number {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

export function blackScholes(
    S: number,     // underlying price
    K: number,     // strike price
    T: number,     // time to expiry (years)
    r: number,     // risk-free rate (decimal)
    sigma: number, // volatility (decimal)
): BSMOutput {
    if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
        return { callPrice: 0, putPrice: 0, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const Nd1 = normCDF(d1);
    const Nd2 = normCDF(d2);
    const Nmd1 = normCDF(-d1);
    const Nmd2 = normCDF(-d2);
    const nd1 = normPDF(d1);

    const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    const putPrice = K * Math.exp(-r * T) * Nmd2 - S * Nmd1;

    // Greeks
    const delta = Nd1;
    const gamma = nd1 / (S * sigma * sqrtT);
    const theta = (-(S * nd1 * sigma) / (2 * sqrtT)
        - r * K * Math.exp(-r * T) * Nd2) / 365;
    const vega = S * nd1 * sqrtT / 100;
    const rho = K * T * Math.exp(-r * T) * Nd2 / 100;

    return {
        callPrice: parseFloat(callPrice.toFixed(4)),
        putPrice: parseFloat(putPrice.toFixed(4)),
        delta: parseFloat(delta.toFixed(4)),
        gamma: parseFloat(gamma.toFixed(6)),
        theta: parseFloat(theta.toFixed(4)),
        vega: parseFloat(vega.toFixed(4)),
        rho: parseFloat(rho.toFixed(4)),
    };
}
