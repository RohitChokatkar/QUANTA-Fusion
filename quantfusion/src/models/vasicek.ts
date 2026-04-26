// Vasicek / CIR short-rate model — mean-reverting interest rate

export interface VasicekOutput {
    forecastCurve: { month: number; rate: number }[];
    meanRevSpeed: number;
    longRunRate: number;
}

export function vasicek(
    rateHistory: { date: string; rate: number }[],
    forecastMonths = 12,
): VasicekOutput {
    if (rateHistory.length < 5) {
        return { forecastCurve: [], meanRevSpeed: 0, longRunRate: 0 };
    }

    const rates = rateHistory.map(r => r.rate / 100);
    const n = rates.length;

    // Estimate mean-reversion parameters via OLS on r(t+1) - r(t) = a(b - r(t))dt + noise
    // dr = kappa * (theta - r) * dt
    let sumR = 0, sumR2 = 0, sumDr = 0, sumRDr = 0;
    for (let i = 0; i < n - 1; i++) {
        const dr = rates[i + 1] - rates[i];
        sumR += rates[i];
        sumR2 += rates[i] ** 2;
        sumDr += dr;
        sumRDr += rates[i] * dr;
    }

    const N = n - 1;
    const dt = 1 / 12; // monthly data
    const meanR = sumR / N;

    // OLS: dr = alpha + beta * r → kappa = -beta/dt, theta = -alpha/(beta)
    const beta = (N * sumRDr - sumR * sumDr) / (N * sumR2 - sumR * sumR);
    const alpha = (sumDr - beta * sumR) / N;

    let kappa = Math.max(-beta / dt, 0.01);
    let theta = Math.max(-alpha / (beta || 1e-6), 0.001);

    // Clamp to reasonable values
    kappa = Math.min(kappa, 5);
    theta = Math.min(theta, 0.15);

    // Estimate sigma from residuals
    let ssResid = 0;
    for (let i = 0; i < N; i++) {
        const predicted = alpha + beta * rates[i];
        ssResid += (rates[i + 1] - rates[i] - predicted) ** 2;
    }
    const sigma = Math.sqrt(ssResid / N / dt);

    // Generate forecast curve via Euler discretisation
    let currentRate = rates[rates.length - 1];
    const forecastCurve: { month: number; rate: number }[] = [
        { month: 0, rate: parseFloat((currentRate * 100).toFixed(3)) },
    ];

    for (let m = 1; m <= forecastMonths; m++) {
        currentRate += kappa * (theta - currentRate) * dt;
        // Add small randomness for realistic-looking curve
        currentRate += sigma * Math.sqrt(dt) * (Math.random() * 0.2 - 0.1);
        currentRate = Math.max(currentRate, 0);
        forecastCurve.push({
            month: m,
            rate: parseFloat((currentRate * 100).toFixed(3)),
        });
    }

    return {
        forecastCurve,
        meanRevSpeed: parseFloat(kappa.toFixed(4)),
        longRunRate: parseFloat((theta * 100).toFixed(3)),
    };
}
