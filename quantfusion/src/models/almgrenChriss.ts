// Almgren-Chriss optimal execution model
// Minimises market impact + timing risk for large block orders

export interface ACOutput {
    schedule: { bucket: number; lots: number }[];
    impactCost: number;  // total expected market impact ($)
    riskScore: number;   // execution risk (0-100)
}

export function almgrenChriss(
    totalShares: number,
    timeBuckets: number = 10,
    sigma: number = 0.02,     // daily volatility (decimal)
    eta: number = 0.001,      // permanent impact param
    gamma: number = 0.01,     // temporary impact param
    lambda: number = 2.0,     // risk aversion
): ACOutput {
    if (totalShares <= 0 || timeBuckets <= 0) {
        return { schedule: [], impactCost: 0, riskScore: 0 };
    }

    const tau = 1 / timeBuckets; // time interval as fraction
    const kappaTilde = Math.sqrt(lambda * sigma * sigma / (eta * (1 + gamma / eta * tau)));

    // Optimal trading trajectory via hyperbolic functions
    const schedule: { bucket: number; lots: number }[] = [];
    const trajectory: number[] = [];

    for (let j = 0; j <= timeBuckets; j++) {
        const t = j / timeBuckets;
        const remaining = totalShares * Math.sinh(kappaTilde * (1 - t)) / Math.sinh(kappaTilde);
        trajectory.push(remaining);
    }

    let totalImpact = 0;
    for (let j = 0; j < timeBuckets; j++) {
        const lots = trajectory[j] - trajectory[j + 1];
        schedule.push({
            bucket: j + 1,
            lots: Math.round(lots),
        });
        // Impact cost per bucket
        totalImpact += eta * lots * lots;
    }

    // Risk score: higher variance trajectory = riskier
    const uniformLots = totalShares / timeBuckets;
    const deviation = schedule.reduce((s, b) => s + (b.lots - uniformLots) ** 2, 0);
    const riskScore = Math.min(100, Math.sqrt(deviation / timeBuckets) / uniformLots * 100);

    return {
        schedule,
        impactCost: parseFloat(totalImpact.toFixed(2)),
        riskScore: parseFloat(riskScore.toFixed(1)),
    };
}
