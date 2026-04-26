// Heston stochastic volatility model
// Generates volatility surface (strike x expiry)

export interface HestonOutput {
    surface: { strike: number; expiry: number; vol: number }[];
    kappa: number;   // mean-reversion speed of variance
    theta: number;   // long-run variance
    xi: number;      // vol of vol
}

export function heston(
    currentPrice: number,
    historicalCloses: number[],
    strikes?: number[],
    expiries?: number[],
): HestonOutput {
    if (historicalCloses.length < 30) {
        return { surface: [], kappa: 0, theta: 0, xi: 0 };
    }

    // Compute daily returns and their variance
    const returns: number[] = [];
    for (let i = 1; i < historicalCloses.length; i++) {
        returns.push(Math.log(historicalCloses[i] / historicalCloses[i - 1]));
    }

    const meanRet = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variances = returns.map(r => (r - meanRet) ** 2);

    // Estimate Heston parameters from variance series
    const meanVar = variances.reduce((s, v) => s + v, 0) / variances.length;
    const annualVar = meanVar * 252;

    // Variance of variance (vol of vol)
    const varOfVar = variances.reduce((s, v) => s + (v - meanVar) ** 2, 0) / variances.length;

    // Estimate kappa from variance autocorrelation
    let num = 0, den = 0;
    for (let i = 1; i < variances.length; i++) {
        num += (variances[i] - meanVar) * (variances[i - 1] - meanVar);
        den += (variances[i - 1] - meanVar) ** 2;
    }
    const rho = den > 0 ? num / den : 0;
    const kappa = Math.max(-Math.log(Math.max(rho, 0.01)) * 252, 0.5);
    const theta = annualVar;
    const xi = Math.sqrt(varOfVar * 252) * 10;

    // Generate default strikes and expiries
    if (!strikes) {
        strikes = [];
        for (let pct = 0.8; pct <= 1.2; pct += 0.05) {
            strikes.push(Math.round(currentPrice * pct));
        }
    }
    if (!expiries) {
        expiries = [0.083, 0.25, 0.5, 0.75, 1.0]; // 1m, 3m, 6m, 9m, 12m
    }

    // Generate vol surface
    // Use simplified Heston implied vol formula
    const v0 = meanVar * 252;
    const surface: { strike: number; expiry: number; vol: number }[] = [];

    for (const K of strikes) {
        for (const T of expiries) {
            const moneyness = Math.log(K / currentPrice);

            // Vol smile: base vol + skew + curvature
            const baseVol = Math.sqrt(
                theta + (v0 - theta) * (1 - Math.exp(-kappa * T)) / (kappa * T || 1)
            );

            // Add smile/skew effect
            const skew = -0.1 * moneyness * xi;
            const curvature = 0.5 * moneyness * moneyness * xi;
            const impliedVol = Math.max(baseVol + skew + curvature, 0.05);

            surface.push({
                strike: K,
                expiry: parseFloat(T.toFixed(3)),
                vol: parseFloat((impliedVol * 100).toFixed(2)),
            });
        }
    }

    return {
        surface,
        kappa: parseFloat(kappa.toFixed(2)),
        theta: parseFloat((theta * 100).toFixed(2)),
        xi: parseFloat(xi.toFixed(2)),
    };
}
