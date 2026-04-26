// Kyle Model — informed trading detection
// Estimates price impact (lambda) and informed flow percentage

export interface KyleOutput {
    lambda: number;        // price impact coefficient
    informedPct: number;   // informed flow percentage (0-100)
    toxicity: number;      // VPIN-proxy toxicity score (0-1)
}

export function kyle(
    prices: number[],
    volumes: number[],
): KyleOutput {
    if (prices.length < 10 || volumes.length < 10) {
        return { lambda: 0, informedPct: 0, toxicity: 0 };
    }

    const n = Math.min(prices.length, volumes.length);

    // Classify volume into buy/sell initiated using tick rule
    let buyVolume = 0, sellVolume = 0;
    const orderFlow: number[] = [];

    for (let i = 1; i < n; i++) {
        const direction = prices[i] >= prices[i - 1] ? 1 : -1;
        const signedVol = direction * volumes[i];
        orderFlow.push(signedVol);
        if (direction > 0) buyVolume += volumes[i];
        else sellVolume += volumes[i];
    }

    const totalVol = buyVolume + sellVolume;
    if (totalVol === 0) return { lambda: 0, informedPct: 0, toxicity: 0 };

    // Estimate lambda via OLS: deltaP = lambda * orderFlow + epsilon
    const priceChanges: number[] = [];
    for (let i = 1; i < n; i++) {
        priceChanges.push(prices[i] - prices[i - 1]);
    }

    let sumXY = 0, sumX2 = 0;
    for (let i = 0; i < orderFlow.length; i++) {
        sumXY += orderFlow[i] * priceChanges[i];
        sumX2 += orderFlow[i] ** 2;
    }

    const lambda = sumX2 > 0 ? Math.abs(sumXY / sumX2) : 0;

    // Informed flow = |buy - sell| / total (VPIN approximation)
    const imbalance = Math.abs(buyVolume - sellVolume);
    const informedPct = (imbalance / totalVol) * 100;

    // Toxicity = rolling VPIN with buckets
    const bucketSize = Math.max(1, Math.floor(n / 10));
    let toxicBuckets = 0;
    for (let b = 0; b < 10 && b * bucketSize < orderFlow.length; b++) {
        const start = b * bucketSize;
        const end = Math.min(start + bucketSize, orderFlow.length);
        let bBuy = 0, bSell = 0;
        for (let i = start; i < end; i++) {
            if (orderFlow[i] > 0) bBuy += Math.abs(orderFlow[i]);
            else bSell += Math.abs(orderFlow[i]);
        }
        const bTotal = bBuy + bSell;
        if (bTotal > 0 && Math.abs(bBuy - bSell) / bTotal > 0.3) toxicBuckets++;
    }

    return {
        lambda: parseFloat((lambda * 1e6).toFixed(4)),
        informedPct: parseFloat(informedPct.toFixed(1)),
        toxicity: parseFloat((toxicBuckets / 10).toFixed(2)),
    };
}
