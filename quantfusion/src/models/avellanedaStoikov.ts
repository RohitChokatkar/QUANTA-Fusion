// Avellaneda-Stoikov optimal market making model
// Computes optimal bid/ask prices accounting for inventory risk

export interface ASOutput {
    bidPrice: number;
    askPrice: number;
    spread: number;
}

export function avellanedaStoikov(
    midPrice: number,
    sigma: number,       // volatility (decimal, e.g. 0.25 for 25%)
    gamma: number = 0.1, // risk aversion
    inventory: number = 0,
    T: number = 1,       // time remaining (fraction of day)
    k: number = 1.5,     // order arrival intensity
): ASOutput {
    if (midPrice <= 0 || sigma <= 0) {
        return { bidPrice: midPrice, askPrice: midPrice, spread: 0 };
    }

    // Reservation price: shifted by inventory risk
    const reservationPrice = midPrice - inventory * gamma * sigma * sigma * T;

    // Optimal spread
    const optimalSpread = gamma * sigma * sigma * T + (2 / gamma) * Math.log(1 + gamma / k);

    const halfSpread = optimalSpread / 2;
    const bidPrice = reservationPrice - halfSpread;
    const askPrice = reservationPrice + halfSpread;

    return {
        bidPrice: parseFloat(bidPrice.toFixed(2)),
        askPrice: parseFloat(askPrice.toFixed(2)),
        spread: parseFloat((askPrice - bidPrice).toFixed(4)),
    };
}
