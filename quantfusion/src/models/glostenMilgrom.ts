// Glosten-Milgrom spread decomposition
// Separates observed bid-ask spread into adverse selection and order processing components

export interface GMOutput {
    adverseSelection: number;  // adverse selection cost ($)
    orderProcessing: number;   // order processing cost ($)
}

export function glostenMilgrom(
    bid: number,
    ask: number,
    midPrice: number,
    informedPct: number = 20, // from Kyle model output
    priceVol: number = 0.02,  // daily price volatility (decimal)
): GMOutput {
    if (bid <= 0 || ask <= 0 || ask <= bid) {
        return { adverseSelection: 0, orderProcessing: 0 };
    }

    const totalSpread = ask - bid;
    const halfSpread = totalSpread / 2;

    // Probability of informed trade
    const pi = Math.min(informedPct / 100, 0.8);

    // Adverse selection component
    // AS = pi * E[value change | informed trade]
    // Approximated as pi * sigma * midPrice
    const adverseSelection = pi * priceVol * midPrice;

    // Order processing = residual
    const orderProcessing = Math.max(halfSpread - adverseSelection, 0);

    return {
        adverseSelection: parseFloat(adverseSelection.toFixed(4)),
        orderProcessing: parseFloat(orderProcessing.toFixed(4)),
    };
}
