// Glossary — Comprehensive educational reference with formulas, calculation steps, and examples
// Expandable cards with search and category filtering
import { useState, useMemo } from 'react';

interface Term {
    term: string;
    definition: string;
    category: string;
    formula?: string;
    formulaDesc?: string;
    variables?: string[];
    steps?: string[];
    example?: string;
    insight?: string;
    relatedTerms?: string[];
}

const TERMS: Term[] = [
    {
        term: 'Alpha',
        definition: 'Excess return of an investment relative to its benchmark index.',
        category: 'Performance',
        formula: 'α = Rₚ − [Rf + β × (Rₘ − Rf)]',
        formulaDesc: 'Jensen\'s Alpha measures the abnormal return above what CAPM predicts.',
        variables: ['Rₚ = Portfolio return', 'Rf = Risk-free rate (e.g., RBI repo rate ≈ 6.5%)', 'β = Portfolio beta', 'Rₘ = Market return (NIFTY 50)'],
        steps: ['1. Calculate portfolio return Rₚ over the period', '2. Find risk-free rate Rf (use 91-day T-bill yield or repo rate)', '3. Calculate market return Rₘ from NIFTY 50', '4. Compute expected return using CAPM: Rf + β × (Rₘ − Rf)', '5. Alpha = Actual return − Expected return'],
        example: 'If your portfolio returned 18%, Rf = 6.5%, β = 1.2, and NIFTY returned 14%: α = 18% − [6.5% + 1.2 × (14% − 6.5%)] = 18% − 15.5% = +2.5%',
        insight: 'Positive alpha means the manager outperformed after adjusting for risk. In Indian markets, consistent alpha generation is rare — most active funds underperform NIFTY 50 over 10+ years.',
        relatedTerms: ['Beta', 'CAPM', 'Sharpe Ratio'],
    },
    {
        term: 'Arbitrage',
        definition: 'Simultaneous buying and selling of an asset to profit from price differences across markets.',
        category: 'Trading',
        formula: 'Profit = P_sell − P_buy − Transaction Costs',
        variables: ['P_sell = Price in the higher-priced market', 'P_buy = Price in the lower-priced market'],
        steps: ['1. Identify the same asset trading at different prices on two exchanges (e.g., BSE vs NSE)', '2. Simultaneously buy on the cheaper exchange and sell on the more expensive one', '3. Profit = Price difference minus transaction costs (brokerage, STT, taxes)', '4. The trade must be executed simultaneously to be risk-free'],
        example: 'RELIANCE trades at ₹1,350 on BSE and ₹1,352 on NSE. Buy on BSE, sell on NSE simultaneously → ₹2 profit per share minus ≈₹0.10 transaction costs = ₹1.90 net profit.',
        insight: 'True arbitrage is risk-free profit. In modern electronic markets, these opportunities last milliseconds and are captured by HFT firms. Statistical arbitrage (stat-arb) is a related but riskier strategy.',
        relatedTerms: ['Bid-Ask Spread', 'Liquidity', 'Dark Pool'],
    },
    {
        term: 'Ask Price',
        definition: 'The lowest price a seller is willing to accept for a security.',
        category: 'Market Structure',
        formula: 'Ask = Best (lowest) sell order in the order book',
        variables: ['The ask side of the order book contains all pending sell orders', 'Ask > Bid always (otherwise a trade would execute)'],
        steps: ['1. Sellers place limit orders at prices they are willing to sell', '2. The lowest such price becomes the "ask" or "offer"', '3. A market buy order will execute at the ask price', '4. The ask is always higher than the bid — the difference is the spread'],
        example: 'If the order book shows sell orders at ₹1,352, ₹1,353, ₹1,355 — the ask price is ₹1,352.',
        insight: 'In the Avellaneda-Stoikov model used in QuantFusion, the optimal ask price is computed as: Ask = Mid Price + Spread/2 + κ (inventory adjustment).',
        relatedTerms: ['Bid Price', 'Bid-Ask Spread', 'Avellaneda-Stoikov'],
    },
    {
        term: 'Avellaneda-Stoikov',
        definition: 'A market-making model that computes optimal bid/ask prices accounting for inventory risk and volatility.',
        category: 'Quant Models',
        formula: 'r(s,t) = s − q·γ·σ²·(T−t)\nδ = γ·σ²·(T−t) + (2/γ)·ln(1 + γ/κ)',
        formulaDesc: 'The reservation price r adjusts the mid-price for inventory risk. The optimal spread δ accounts for volatility and adverse selection.',
        variables: ['s = Current mid-price', 'q = Current inventory (positive = long)', 'γ = Risk-aversion parameter', 'σ = Volatility of the asset', 'T−t = Time remaining', 'κ = Order arrival intensity'],
        steps: ['1. Calculate reservation price: r = s − q·γ·σ²·(T−t)', '2. Calculate optimal spread: δ = γ·σ²·(T−t) + (2/γ)·ln(1 + γ/κ)', '3. Bid price = r − δ/2', '4. Ask price = r + δ/2', '5. The market maker posts these quotes and profits from the spread while managing inventory risk'],
        example: 'For RELIANCE at ₹1,350 with σ=0.25, γ=0.1, zero inventory (q=0): Reservation price = ₹1,350.00. Spread ≈ ₹3.20. Bid = ₹1,348.40, Ask = ₹1,351.60.',
        insight: 'This is one of the 10 quant models running in QuantFusion. The bid/ask lines on the live chart are computed by this model in real-time. Higher volatility → wider spreads → safer market making.',
        relatedTerms: ['Bid-Ask Spread', 'Kyle Model', 'Glosten-Milgrom', 'Volatility'],
    },
    {
        term: 'Beta',
        definition: 'A measure of a security\'s volatility relative to the overall market. Beta of 1 means the asset moves in line with the market.',
        category: 'Risk',
        formula: 'β = Cov(Rᵢ, Rₘ) / Var(Rₘ)',
        formulaDesc: 'Beta is the slope of the regression line of asset returns vs market returns.',
        variables: ['Rᵢ = Return of the individual stock', 'Rₘ = Return of the market (NIFTY 50)', 'Cov = Covariance', 'Var = Variance'],
        steps: ['1. Collect daily returns for the stock and NIFTY 50 over 1–3 years', '2. Calculate covariance of stock returns with NIFTY returns', '3. Calculate variance of NIFTY returns', '4. β = Covariance / Variance', '5. Alternatively, run a linear regression: Rᵢ = α + β·Rₘ + ε'],
        example: 'If RELIANCE has β = 1.1 and NIFTY rises 2%: Expected RELIANCE move = 1.1 × 2% = 2.2%. Higher beta = more sensitive to market moves.',
        insight: 'β > 1: More volatile than market (growth stocks like ADANIENT). β < 1: Less volatile (defensive stocks like ITC, HINDUNILVR). β < 0: Moves inversely (rare, e.g., gold ETFs during crashes).',
        relatedTerms: ['Alpha', 'CAPM', 'Volatility', 'Correlation'],
    },
    {
        term: 'Bid Price',
        definition: 'The highest price a buyer is willing to pay for a security.',
        category: 'Market Structure',
        formula: 'Bid = Best (highest) buy order in the order book',
        variables: ['The bid side contains all pending buy orders', 'A market sell order executes at the bid price'],
        steps: ['1. Buyers place limit orders at prices they are willing to pay', '2. The highest such price becomes the "bid"', '3. A market sell order will execute at the bid price', '4. The bid is always lower than the ask'],
        example: 'If buy orders sit at ₹1,348, ₹1,347, ₹1,345 — the bid price is ₹1,348.',
        relatedTerms: ['Ask Price', 'Bid-Ask Spread', 'Market Order', 'Limit Order'],
    },
    {
        term: 'Bid-Ask Spread',
        definition: 'The difference between the bid and ask price. A narrower spread indicates higher liquidity.',
        category: 'Market Structure',
        formula: 'Spread = Ask − Bid\nSpread % = (Ask − Bid) / Mid × 100\nMid = (Bid + Ask) / 2',
        variables: ['Bid = Highest buy price', 'Ask = Lowest sell price', 'Mid = Midpoint of bid and ask'],
        steps: ['1. Look up the current bid and ask prices for a stock', '2. Spread = Ask − Bid', '3. Spread % = (Ask − Bid) / ((Ask + Bid) / 2) × 100', '4. Compare across stocks — lower spread = more liquid'],
        example: 'RELIANCE: Bid ₹1,349.80, Ask ₹1,350.20 → Spread = ₹0.40 (0.03%). Penny stock: Bid ₹12.50, Ask ₹13.00 → Spread = ₹0.50 (3.92%).',
        insight: 'In the Glosten-Milgrom model, the spread is decomposed into: (1) Adverse selection cost — compensating for informed traders, (2) Order processing cost — operational expenses, (3) Inventory holding cost.',
        relatedTerms: ['Bid Price', 'Ask Price', 'Liquidity', 'Glosten-Milgrom', 'Avellaneda-Stoikov'],
    },
    {
        term: 'Black-Scholes',
        definition: 'A model for pricing European options that accounts for the underlying price, strike, time to expiry, volatility, and risk-free rate.',
        category: 'Quant Models',
        formula: 'C = S·N(d₁) − K·e⁻ʳᵗ·N(d₂)\nd₁ = [ln(S/K) + (r + σ²/2)·t] / (σ·√t)\nd₂ = d₁ − σ·√t',
        formulaDesc: 'The Black-Scholes formula prices a European call option. N() is the cumulative standard normal distribution.',
        variables: ['C = Call option price', 'S = Current stock price', 'K = Strike price', 'r = Risk-free interest rate (annual)', 't = Time to expiration (in years)', 'σ = Annualized volatility of the stock', 'N(x) = Cumulative normal distribution function', 'e = Euler\'s number ≈ 2.71828'],
        steps: ['1. Gather inputs: S (stock price), K (strike), t (time to expiry), r (risk-free rate), σ (volatility from GARCH)', '2. Calculate d₁ = [ln(S/K) + (r + σ²/2)·t] / (σ·√t)', '3. Calculate d₂ = d₁ − σ·√t', '4. Find N(d₁) and N(d₂) from the normal CDF table', '5. Call Price C = S·N(d₁) − K·e⁻ʳᵗ·N(d₂)', '6. Put Price P = K·e⁻ʳᵗ·N(−d₂) − S·N(−d₁)'],
        example: 'RELIANCE at ₹1,350, ATM call (K=₹1,350), 30 days to expiry, r=6.5%, σ=25%: d₁ ≈ 0.15, d₂ ≈ 0.08, C ≈ ₹38.50.',
        insight: 'This is one of the 10 models running in QuantFusion. It uses GARCH volatility (σ) and the RBI repo rate as the risk-free rate. The model computes Delta (Δ), Gamma (Γ), Theta (Θ), Vega, and Rho in real-time.',
        relatedTerms: ['GARCH', 'Implied Volatility', 'Delta', 'Gamma', 'Theta', 'Vega', 'Rho', 'Heston Model'],
    },
    {
        term: 'Bollinger Bands',
        definition: 'A volatility indicator consisting of a moving average with upper and lower bands set at standard deviations.',
        category: 'Technical Analysis',
        formula: 'Middle Band = SMA(n)\nUpper Band = SMA(n) + k × σ(n)\nLower Band = SMA(n) − k × σ(n)',
        variables: ['SMA(n) = Simple Moving Average over n periods (typically 20)', 'σ(n) = Standard deviation over n periods', 'k = Number of standard deviations (typically 2)'],
        steps: ['1. Calculate 20-period SMA of closing prices', '2. Calculate 20-period standard deviation of closing prices', '3. Upper Band = SMA + 2 × Standard Deviation', '4. Lower Band = SMA − 2 × Standard Deviation', '5. Price touching upper band → potential overbought signal', '6. Price touching lower band → potential oversold signal'],
        example: 'RELIANCE 20-day SMA = ₹1,350, σ = ₹25: Upper Band = ₹1,400, Lower Band = ₹1,300. Price at ₹1,395 → near upper band (possible reversal).',
        insight: 'Bollinger Band squeeze (bands narrowing) often precedes a breakout. In Indian markets, combining Bollinger Bands with RSI produces stronger signals than either alone.',
        relatedTerms: ['Moving Average', 'Volatility', 'RSI'],
    },
    {
        term: 'Bull Market',
        definition: 'A market condition where prices are rising or expected to rise, typically by 20% or more.',
        category: 'Markets',
        steps: ['1. A bull market is officially declared when prices rise 20%+ from a recent low', '2. Characterized by investor optimism, economic growth, and rising corporate earnings', '3. Bull markets in India have historically lasted 2–5 years'],
        example: 'The Indian bull run from March 2020 (NIFTY ≈ 7,500) to late 2024 (NIFTY ≈ 26,000) — a 246% gain over 4.5 years.',
        relatedTerms: ['Bear Market'],
    },
    {
        term: 'Bear Market',
        definition: 'A market condition where prices are falling or expected to fall by 20% or more from recent highs.',
        category: 'Markets',
        steps: ['1. A bear market is declared when prices drop 20%+ from a recent peak', '2. Characterized by pessimism, falling earnings, and economic slowdown', '3. Bear markets are typically shorter than bull markets (6–18 months)'],
        example: 'COVID crash: NIFTY fell from 12,362 (Jan 2020) to 7,511 (Mar 2020) — a 39% decline in 2 months. It recovered in less than a year.',
        relatedTerms: ['Bull Market', 'Drawdown'],
    },
    {
        term: 'CAPM',
        definition: 'Capital Asset Pricing Model — describes the relationship between systematic risk and expected return.',
        category: 'Portfolio Theory',
        formula: 'E(Rᵢ) = Rf + βᵢ × (E(Rₘ) − Rf)',
        formulaDesc: 'The expected return of an asset equals the risk-free rate plus its beta times the market risk premium.',
        variables: ['E(Rᵢ) = Expected return of asset i', 'Rf = Risk-free rate', 'βᵢ = Beta of asset i', 'E(Rₘ) = Expected market return', 'E(Rₘ) − Rf = Market risk premium'],
        steps: ['1. Determine the risk-free rate Rf (RBI repo rate or 91-day T-bill)', '2. Estimate market return E(Rₘ) from historical NIFTY 50 returns', '3. Calculate the stock\'s beta from historical regression', '4. E(Rᵢ) = Rf + β × (E(Rₘ) − Rf)', '5. Compare with actual return to compute alpha'],
        example: 'For SBIN with β=1.3, Rf=6.5%, E(Rₘ)=12%: E(R) = 6.5% + 1.3 × (12% − 6.5%) = 6.5% + 7.15% = 13.65%.',
        insight: 'CAPM assumes markets are efficient — investors can only earn higher returns by taking more systematic risk. This is the foundation for alpha measurement.',
        relatedTerms: ['Alpha', 'Beta', 'Efficient Frontier', 'Markowitz'],
    },
    {
        term: 'Call Option',
        definition: 'A contract giving the buyer the right, but not obligation, to buy an asset at a specified price before expiry.',
        category: 'Derivatives',
        formula: 'Payoff = max(S − K, 0) − Premium',
        variables: ['S = Stock price at expiry', 'K = Strike price', 'Premium = Price paid for the option'],
        steps: ['1. Buy a call option by paying the premium', '2. At expiry, if S > K: exercise the option, profit = S − K − Premium', '3. If S ≤ K: let the option expire worthless, loss = Premium paid', '4. Breakeven = K + Premium'],
        example: 'Buy NIFTY 24000 CE (Call) at ₹150. At expiry NIFTY = 24,300: Payoff = 24,300 − 24,000 − 150 = ₹150 profit. If NIFTY = 23,800: Loss = ₹150 (premium).',
        relatedTerms: ['Put Option', 'Black-Scholes', 'Greeks', 'Implied Volatility'],
    },
    {
        term: 'Candlestick',
        definition: 'A price chart showing open, high, low, and close for a given period. The body shows open-close range.',
        category: 'Technical Analysis',
        formula: 'Body = |Close − Open|\nUpper Shadow = High − max(Open, Close)\nLower Shadow = min(Open, Close) − Low',
        variables: ['Green/hollow candle: Close > Open (bullish)', 'Red/filled candle: Close < Open (bearish)', 'Shadows (wicks) show price extremes'],
        steps: ['1. The body represents the open-to-close range', '2. Upper wick = highest price reached during the period', '3. Lower wick = lowest price reached during the period', '4. Green candle: price went up (close > open)', '5. Red candle: price went down (close < open)'],
        example: 'A 5-minute candle for RELIANCE: Open ₹1,348, High ₹1,355, Low ₹1,346, Close ₹1,352 → Green candle with body ₹4, upper wick ₹3, lower wick ₹2.',
        insight: 'QuantFusion displays 5-minute OHLCV candles. Common patterns: Doji (indecision), Hammer (reversal), Engulfing (trend change).',
        relatedTerms: ['OHLCV', 'Bollinger Bands', 'Moving Average'],
    },
    {
        term: 'CIR Model',
        definition: 'Cox-Ingersoll-Ross model — a mean-reverting interest rate model where volatility scales with the square root of the rate.',
        category: 'Quant Models',
        formula: 'dr = a(b − r)dt + σ√r · dW',
        formulaDesc: 'The CIR model ensures interest rates stay positive (unlike Vasicek). Volatility increases with the rate level.',
        variables: ['r = Current interest rate', 'a = Speed of mean reversion', 'b = Long-term mean rate', 'σ = Volatility parameter', 'dW = Wiener process (random shock)', '√r = Square root ensures non-negative rates'],
        steps: ['1. Start with current rate r₀ (e.g., RBI repo rate 6.5%)', '2. Calibrate a, b, σ from historical RBI rate data', '3. The drift term a(b − r) pulls rates toward long-term mean b', '4. The diffusion term σ√r adds randomness scaled by current rate level', '5. Simulate thousands of rate paths using Monte Carlo', '6. Use for interest rate derivatives pricing'],
        example: 'If current repo rate = 6.5%, long-term mean b = 6%, speed a = 0.3, σ = 0.1: The model forecasts rates drifting down toward 6% with moderate uncertainty.',
        insight: 'CIR improves on Vasicek by guaranteeing rates never go negative — important for emerging markets like India where rates are always positive.',
        relatedTerms: ['Vasicek Model', 'Monte Carlo'],
    },
    {
        term: 'Correlation',
        definition: 'A statistical measure showing how two securities move in relation to each other, ranging from -1 to +1.',
        category: 'Statistics',
        formula: 'ρ(X,Y) = Cov(X,Y) / (σₓ · σᵧ)',
        variables: ['ρ = Correlation coefficient (−1 to +1)', 'Cov(X,Y) = Covariance between X and Y', 'σₓ = Standard deviation of X', 'σᵧ = Standard deviation of Y'],
        steps: ['1. Collect returns for both securities over the same period', '2. Calculate the covariance of the two return series', '3. Calculate standard deviation of each', '4. ρ = Covariance / (σₓ × σᵧ)', '5. ρ = +1: perfect positive correlation, ρ = −1: perfect inverse, ρ = 0: no correlation'],
        example: 'HDFCBANK and ICICIBANK typically have ρ ≈ 0.75 (both are banking stocks). RELIANCE and gold have ρ ≈ −0.2 (mild inverse relationship).',
        insight: 'Low correlation between portfolio assets is the key to Markowitz diversification. In Indian markets, IT stocks (TCS, INFY) and banking stocks (HDFCBANK, ICICIBANK) have moderate correlation — mixing both reduces portfolio risk.',
        relatedTerms: ['Covariance', 'Markowitz', 'Efficient Frontier'],
    },
    {
        term: 'Covariance',
        definition: 'A measure of how two variables change together. Used in portfolio theory to compute diversification benefits.',
        category: 'Statistics',
        formula: 'Cov(X,Y) = Σ[(Xᵢ − X̄)(Yᵢ − Ȳ)] / (n − 1)',
        variables: ['Xᵢ, Yᵢ = Individual return observations', 'X̄, Ȳ = Mean returns', 'n = Number of observations'],
        steps: ['1. Calculate mean return for both assets', '2. For each period, compute (Xᵢ − X̄) × (Yᵢ − Ȳ)', '3. Sum all products', '4. Divide by (n − 1) for sample covariance', '5. Positive covariance → assets tend to move together'],
        relatedTerms: ['Correlation', 'Markowitz', 'Efficient Frontier'],
    },
    {
        term: 'Dark Pool',
        definition: 'A private exchange for trading securities, hidden from the public order book until after execution.',
        category: 'Market Structure',
        steps: ['1. Large institutional orders are placed in dark pools to avoid market impact', '2. The order is not visible to other participants until it executes', '3. After execution, the trade is reported to the exchange', '4. Benefits: reduced slippage for large orders. Drawback: less price transparency'],
        insight: 'In India, dark pools are limited. SEBI regulates block deals (₹10 crore+ trades) with separate windows. NSE\'s block deal window operates 8:45–9:00 AM and 2:05–2:20 PM IST.',
        relatedTerms: ['Liquidity', 'Market Order', 'VWAP'],
    },
    {
        term: 'Delta',
        definition: 'The rate of change of an option\'s price relative to a ₹1 change in the underlying asset price.',
        category: 'Greeks',
        formula: 'Δ = ∂C/∂S = N(d₁)  (for call)\nΔ = N(d₁) − 1     (for put)',
        variables: ['Δ ranges from 0 to 1 for calls, −1 to 0 for puts', 'ATM options have Δ ≈ 0.5', 'Deep ITM calls have Δ → 1'],
        steps: ['1. Calculate d₁ from the Black-Scholes formula', '2. For a call: Δ = N(d₁) where N is the standard normal CDF', '3. For a put: Δ = N(d₁) − 1', '4. Delta tells you how many shares to hold to hedge 1 option contract'],
        example: 'NIFTY 24000 CE with Δ = 0.55: If NIFTY moves up ₹100, the option price increases by ₹55. To delta-hedge 1 lot (25 units), hold 25 × 0.55 = 13.75 units of NIFTY.',
        relatedTerms: ['Black-Scholes', 'Gamma', 'Greeks'],
    },
    {
        term: 'Dividend Yield',
        definition: 'Annual dividend payments divided by the stock price, expressed as a percentage.',
        category: 'Fundamentals',
        formula: 'Dividend Yield = (Annual Dividend per Share / Current Stock Price) × 100',
        steps: ['1. Find the annual dividend per share (DPS) from company financials', '2. Get the current stock price', '3. Yield = (DPS / Price) × 100'],
        example: 'ITC pays ₹15.50 annual dividend, stock price ₹304.25: Yield = (15.50 / 304.25) × 100 = 5.09%.',
        insight: 'High dividend yield stocks in India: Coal India (~7%), ITC (~5%), Power Grid (~4%). Growth stocks like ADANIENT typically pay no dividends.',
        relatedTerms: ['EPS', 'P/E Ratio'],
    },
    {
        term: 'Drawdown',
        definition: 'The peak-to-trough decline of an investment during a specific period. Maximum drawdown measures the worst such decline.',
        category: 'Risk',
        formula: 'Drawdown = (Peak Value − Trough Value) / Peak Value × 100\nMax Drawdown = max(all drawdowns)',
        steps: ['1. Track the portfolio\'s cumulative high-water mark (maximum value reached)', '2. At each point, drawdown = (peak − current) / peak × 100', '3. Maximum drawdown = the largest such decline', '4. Recovery time = days to reach a new high after the trough'],
        example: 'Portfolio peaked at ₹10,00,000, fell to ₹7,50,000 during COVID: Drawdown = 25%. If the prior worst was 15%, the new max drawdown = 25%.',
        relatedTerms: ['Volatility', 'Sharpe Ratio', 'Bear Market'],
    },
    {
        term: 'Efficient Frontier',
        definition: 'The set of portfolios offering the highest expected return for each level of risk (Markowitz).',
        category: 'Portfolio Theory',
        formula: 'min   w\'Σw   (portfolio variance)\nsubject to: w\'μ = target return,  w\'1 = 1',
        formulaDesc: 'The efficient frontier is found by solving this optimization for every target return level.',
        variables: ['w = Vector of portfolio weights', 'Σ = Covariance matrix of asset returns', 'μ = Vector of expected returns', '1 = Vector of ones (weights sum to 1)'],
        steps: ['1. Estimate expected returns μ for each asset', '2. Build the covariance matrix Σ from historical returns', '3. For each target return, minimize portfolio variance subject to constraints', '4. Plot all optimal portfolios on a risk-return graph', '5. The upper boundary of this plot is the efficient frontier', '6. No rational investor should hold a portfolio below the frontier'],
        example: 'A 3-stock portfolio (RELIANCE, TCS, HDFCBANK): By varying weights, you trace a curve. The optimal mix for 12% target return might be 40%-35%-25% with σ = 18%.',
        insight: 'QuantFusion\'s Markowitz optimizer computes this frontier in real-time for your selected BSE stocks. The tangent portfolio (highest Sharpe ratio) is the point where a line from the risk-free rate touches the frontier.',
        relatedTerms: ['Markowitz', 'Sharpe Ratio', 'Covariance', 'CAPM'],
    },
    {
        term: 'EPS',
        definition: 'Earnings Per Share — a company\'s net profit divided by the number of outstanding shares.',
        category: 'Fundamentals',
        formula: 'EPS = (Net Income − Preferred Dividends) / Weighted Avg Shares Outstanding',
        steps: ['1. Get net income from the income statement', '2. Subtract any preferred dividends', '3. Divide by weighted average shares outstanding', '4. Trailing EPS uses last 4 quarters, Forward EPS uses estimates'],
        example: 'TCS: Net income ₹47,500 Cr, Shares outstanding = 365 Cr → EPS = ₹47,500 / 365 = ₹130.14.',
        relatedTerms: ['P/E Ratio', 'Dividend Yield'],
    },
    {
        term: 'ETF',
        definition: 'Exchange-Traded Fund — a fund that trades on an exchange and tracks an index, commodity, or basket of assets.',
        category: 'Instruments',
        steps: ['1. ETFs trade on BSE/NSE like regular stocks', '2. They track an underlying index (e.g., NIFTY 50 ETF)', '3. Lower expense ratios than active mutual funds', '4. Examples in India: Nippon India NIFTY 50 BeES, SBI ETF Sensex, Kotak Gold ETF'],
        insight: 'NIFTY 50 ETFs have expense ratios of 0.05–0.10%, making them the cheapest way to get market exposure in India. They are optimal for the "market portfolio" in CAPM theory.',
        relatedTerms: ['Market Cap', 'CAPM'],
    },
    {
        term: 'GARCH',
        definition: 'Generalised Autoregressive Conditional Heteroskedasticity — a model forecasting time-varying volatility.',
        category: 'Quant Models',
        formula: 'σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁',
        formulaDesc: 'GARCH(1,1) models volatility as a weighted combination of a long-run average (ω), the previous shock squared (α·ε²), and previous variance (β·σ²).',
        variables: ['σ²ₜ = Conditional variance at time t', 'ω = Long-run variance weight (constant)', 'α = Weight of previous shock (ARCH term)', 'β = Weight of previous variance (GARCH term)', 'ε²ₜ₋₁ = Squared residual return at t−1', 'α + β < 1 for stationarity'],
        steps: ['1. Collect daily log returns: rₜ = ln(Pₜ/Pₜ₋₁)', '2. Estimate initial variance from the first 30 days', '3. Use Maximum Likelihood Estimation (MLE) to fit ω, α, β', '4. Forecast next-day variance: σ²ₜ₊₁ = ω + α·ε²ₜ + β·σ²ₜ', '5. Annualize: σ_annual = σ_daily × √252', '6. Feed σ into Black-Scholes and Avellaneda-Stoikov models'],
        example: 'RELIANCE GARCH(1,1) with ω=0.00001, α=0.08, β=0.90: If yesterday\'s return was −3% (shock) and σ was 22%: σ²ₜ₊₁ = 0.00001 + 0.08×(0.03²) + 0.90×(0.22/√252)² → σ ≈ 23.5% annualized.',
        insight: 'This is one of the core models in QuantFusion. The σ (sigma) badge on the dashboard shows the GARCH-forecasted annualized volatility. It feeds into BSM option pricing and A-S market making spreads.',
        relatedTerms: ['Volatility', 'Black-Scholes', 'Avellaneda-Stoikov', 'Heston Model'],
    },
    {
        term: 'Gamma',
        definition: 'The rate of change of Delta with respect to the underlying price. Measures convexity of the option.',
        category: 'Greeks',
        formula: 'Γ = ∂²C/∂S² = N\'(d₁) / (S·σ·√t)',
        variables: ['N\'(d₁) = Standard normal PDF evaluated at d₁', 'S = Underlying price', 'σ = Volatility', 't = Time to expiry'],
        steps: ['1. Calculate d₁ from Black-Scholes', '2. Evaluate the standard normal PDF at d₁: N\'(d₁) = (1/√2π)·e^(−d₁²/2)', '3. Γ = N\'(d₁) / (S × σ × √t)', '4. Gamma is highest for ATM options near expiry'],
        example: 'NIFTY 24000 CE near expiry with Γ = 0.003: If NIFTY moves ₹100, Delta changes by 0.003 × 100 = 0.3. This is why ATM options near expiry move explosively.',
        relatedTerms: ['Delta', 'Black-Scholes', 'Greeks'],
    },
    {
        term: 'Glosten-Milgrom',
        definition: 'A model decomposing the bid-ask spread into adverse selection and order processing components.',
        category: 'Quant Models',
        formula: 'Ask = E[V | Buy] = V + μ·(V_H − V)\nBid = E[V | Sell] = V − μ·(V − V_L)',
        formulaDesc: 'The market maker sets prices based on the probability (μ) that the trader is informed.',
        variables: ['V = True (estimated) asset value', 'μ = Probability of informed trading', 'V_H = Value if good news', 'V_L = Value if bad news', 'Ask − Bid = Spread due to adverse selection'],
        steps: ['1. Market maker estimates probability μ that next order is from an informed trader', '2. If a buy order arrives, the trader might know the price will go up', '3. Market maker adjusts ask upward: Ask = V + μ·(V_H − V)', '4. If a sell order arrives, adjust bid downward: Bid = V − μ·(V − V_L)', '5. Higher μ → wider spread (more adverse selection risk)'],
        example: 'If RELIANCE fair value = ₹1,350, μ = 0.3, V_H = ₹1,380, V_L = ₹1,320: Ask = 1350 + 0.3×30 = ₹1,359. Bid = 1350 − 0.3×30 = ₹1,341. Spread = ₹18.',
        insight: 'This is one of the 10 models in QuantFusion. It helps detect when informed traders (insiders, algorithmic traders) are active. High spreads suggest information asymmetry.',
        relatedTerms: ['Kyle Model', 'Bid-Ask Spread', 'VPIN', 'Lambda'],
    },
    {
        term: 'Greeks',
        definition: 'A set of risk measures (Delta, Gamma, Theta, Vega, Rho) for options positions.',
        category: 'Derivatives',
        steps: ['1. Delta (Δ): Price sensitivity to ₹1 move in underlying', '2. Gamma (Γ): Rate of change of Delta', '3. Theta (Θ): Daily time decay of option value', '4. Vega (ν): Sensitivity to 1% change in implied volatility', '5. Rho (ρ): Sensitivity to interest rate changes'],
        insight: 'QuantFusion\'s Black-Scholes model computes all five Greeks in real-time for the selected stock. They are displayed on the BSM model output card.',
        relatedTerms: ['Delta', 'Gamma', 'Theta', 'Vega', 'Rho', 'Black-Scholes'],
    },
    {
        term: 'Hedge',
        definition: 'An investment to reduce the risk of adverse price movements in an asset.',
        category: 'Risk Management',
        steps: ['1. Identify the risk you want to reduce (e.g., long RELIANCE stock)', '2. Take an offsetting position (e.g., buy RELIANCE put option)', '3. If the stock falls, the put gains value, offsetting the loss', '4. Cost of hedging = premium paid for the hedge instrument'],
        example: 'You own 100 shares of RELIANCE at ₹1,350. Buy 1 lot of RELIANCE 1300 PE at ₹15. If RELIANCE drops to ₹1,250, your stock loss = ₹10,000, put gain ≈ ₹3,500. Net hedged loss = ₹6,500 vs ₹10,000 unhedged.',
        relatedTerms: ['Put Option', 'Delta', 'Volatility'],
    },
    {
        term: 'Heston Model',
        definition: 'A stochastic volatility model extending Black-Scholes where vol itself follows a random process.',
        category: 'Quant Models',
        formula: 'dS = μS·dt + √v·S·dW₁\ndv = κ(θ − v)dt + ξ√v·dW₂\ncorr(dW₁, dW₂) = ρ',
        formulaDesc: 'Two correlated stochastic processes: one for the stock price, one for its variance.',
        variables: ['S = Stock price', 'v = Instantaneous variance', 'μ = Drift rate', 'κ = Mean-reversion speed of variance', 'θ = Long-term variance', 'ξ = Vol-of-vol (volatility of volatility)', 'ρ = Correlation between price and vol (usually negative)'],
        steps: ['1. Calibrate κ, θ, ξ, ρ from historical data or option prices', '2. ρ < 0 means volatility increases when prices fall ("leverage effect")', '3. Simulate correlated paths for S and v using Monte Carlo', '4. The Heston model captures the volatility smile/skew seen in option markets', '5. More realistic than Black-Scholes which assumes constant volatility'],
        example: 'With θ = 0.04 (20% long-term vol), κ = 2 (fast mean reversion), ξ = 0.3 (moderate vol-of-vol), ρ = −0.7 (strong leverage effect) — the model generates realistic NIFTY option prices.',
        insight: 'Heston is one of the 10 models in QuantFusion. It addresses the main weakness of Black-Scholes: assuming constant volatility. Real markets show volatility clustering and leverage effects.',
        relatedTerms: ['Black-Scholes', 'GARCH', 'Implied Volatility', 'Monte Carlo'],
    },
    {
        term: 'Implied Volatility',
        definition: 'The market\'s forecast of future volatility, derived from option prices using models like Black-Scholes.',
        category: 'Options',
        formula: 'Market Price = BSM(S, K, t, r, σ_imp)\nSolve for σ_imp numerically',
        variables: ['σ_imp = Implied volatility (what markets expect)', 'Market Price = Observed option price on NSE', 'BSM() = Black-Scholes model function'],
        steps: ['1. Observe the market price of an option (e.g., NIFTY 24000 CE)', '2. Input all known BS parameters: S, K, t, r', '3. Use numerical methods (Newton-Raphson) to find σ that makes BS price = market price', '4. This σ is the implied volatility', '5. India VIX is the NIFTY implied volatility index'],
        example: 'If NIFTY 24000 CE trades at ₹200, and plugging σ=22% into BS gives ₹185, but σ=25% gives ₹200 → Implied volatility = 25%.',
        insight: 'India VIX > 20 = high fear/uncertainty. India VIX < 14 = complacency. Options are expensive when IV is high (good time to sell), cheap when IV is low (good time to buy).',
        relatedTerms: ['Black-Scholes', 'Volatility', 'GARCH', 'Vega'],
    },
    {
        term: 'Kyle Model',
        definition: 'A model estimating the price impact of informed trading via the lambda coefficient.',
        category: 'Quant Models',
        formula: 'ΔP = λ · ΔQ\nλ = σ_v / (2 · σ_u)',
        formulaDesc: 'Price moves λ rupees for each unit of order flow imbalance. Lambda measures market depth.',
        variables: ['ΔP = Price change', 'λ = Kyle\'s lambda (price impact coefficient)', 'ΔQ = Net order flow (buys − sells)', 'σ_v = Variance of fundamental value', 'σ_u = Variance of noise trading'],
        steps: ['1. Collect trade data: price, volume, and direction (buy/sell)', '2. Classify trades as buyer-initiated or seller-initiated using tick rule', '3. Calculate net order flow ΔQ for each period', '4. Run regression: ΔP = λ · ΔQ + ε', '5. λ is the slope — higher λ = less liquid, more price impact', '6. Use λ to estimate informed trading activity'],
        example: 'In a liquid stock (RELIANCE), λ ≈ 0.001 (₹0.001 price impact per share traded). In a smallcap, λ ≈ 0.05 (₹0.05 per share). Large orders in illiquid stocks move prices dramatically.',
        insight: 'This is one of the 10 models in QuantFusion. The λ badge shows the current estimated price impact. High λ → illiquid market, be cautious with large orders.',
        relatedTerms: ['Lambda', 'Glosten-Milgrom', 'VPIN', 'Liquidity'],
    },
    {
        term: 'Lambda',
        definition: 'In the Kyle model, the price impact coefficient measuring how much prices move per unit of order flow.',
        category: 'Market Microstructure',
        formula: 'λ = ΔP / ΔQ',
        variables: ['ΔP = Price change', 'ΔQ = Net order flow imbalance', 'Higher λ = less liquid, higher price impact'],
        relatedTerms: ['Kyle Model', 'Liquidity', 'VPIN'],
    },
    {
        term: 'Limit Order',
        definition: 'An order to buy or sell at a specific price or better. Not guaranteed to execute.',
        category: 'Trading',
        steps: ['1. Set a specific price at which you want to buy or sell', '2. Buy limit order: will only execute at your price or lower', '3. Sell limit order: will only execute at your price or higher', '4. The order sits in the order book until the price is reached or you cancel', '5. Advantage: price control. Disadvantage: may never execute.'],
        example: 'Place a buy limit for RELIANCE at ₹1,340 when the market price is ₹1,350. Your order waits until the price drops to ₹1,340.',
        relatedTerms: ['Market Order', 'Bid Price', 'Ask Price'],
    },
    {
        term: 'Liquidity',
        definition: 'The ease with which an asset can be bought or sold without affecting its price significantly.',
        category: 'Market Structure',
        steps: ['1. High liquidity: tight bid-ask spread, high volume, low price impact (e.g., RELIANCE, TCS)', '2. Low liquidity: wide spread, low volume, high price impact (smallcaps)', '3. Measured by: volume, spread, Kyle\'s lambda, market depth'],
        insight: 'In Indian markets, NIFTY 50 stocks are highly liquid (₹1,000+ Cr daily turnover). Mid/small-caps can have spreads 5-10x wider. SEBI uses ASM (Additional Surveillance Measures) on illiquid stocks.',
        relatedTerms: ['Bid-Ask Spread', 'Kyle Model', 'Lambda', 'Dark Pool'],
    },
    {
        term: 'Market Cap',
        definition: 'The total market value of a company\'s outstanding shares (price × shares outstanding).',
        category: 'Fundamentals',
        formula: 'Market Cap = Share Price × Total Shares Outstanding',
        steps: ['1. Get current share price', '2. Get total shares outstanding from BSE/NSE filings', '3. Market Cap = Price × Shares', '4. Large Cap: > ₹20,000 Cr | Mid Cap: ₹5,000–20,000 Cr | Small Cap: < ₹5,000 Cr'],
        example: 'RELIANCE: Price ₹1,350 × 676 Cr shares = Market Cap ≈ ₹9,12,600 Cr (~$108 billion).',
        relatedTerms: ['P/E Ratio', 'EPS'],
    },
    {
        term: 'Market Order',
        definition: 'An order to buy or sell immediately at the best available price. Guaranteed execution but not price.',
        category: 'Trading',
        steps: ['1. Submit a market order to buy or sell', '2. It executes immediately at the best available price', '3. Buy market order → executes at the ask price', '4. Sell market order → executes at the bid price', '5. In illiquid stocks, large market orders cause slippage'],
        relatedTerms: ['Limit Order', 'Bid Price', 'Ask Price', 'VWAP'],
    },
    {
        term: 'Markowitz',
        definition: 'Harry Markowitz\'s mean-variance optimization framework for constructing portfolios along the efficient frontier.',
        category: 'Quant Models',
        formula: 'min w\'Σw − λ·w\'μ\nsubject to: Σwᵢ = 1, wᵢ ≥ 0',
        formulaDesc: 'Minimize portfolio variance while targeting a return, subject to weights summing to 1.',
        variables: ['w = Weight vector (allocation per asset)', 'Σ = Covariance matrix', 'μ = Expected return vector', 'λ = Risk aversion parameter'],
        steps: ['1. Select BSE stocks for your portfolio', '2. Collect 1+ year daily returns for each stock', '3. Estimate expected returns μ (historical or analyst-based)', '4. Build the covariance matrix Σ from return data', '5. Solve the quadratic programming problem for each target return', '6. The solution traces the efficient frontier', '7. The tangent portfolio maximizes Sharpe ratio'],
        example: 'For RELIANCE (30%), TCS (25%), HDFCBANK (25%), ITC (20%): If μ = [12%, 14%, 10%, 8%] and the resulting portfolio return is 11.5% with σ = 16.2%, the Sharpe ratio = (11.5% − 6.5%) / 16.2% = 0.31.',
        insight: 'QuantFusion\'s portfolio optimizer runs Markowitz MVO with scipy.optimize.minimize on your selected BSE stocks. The covariance matrix is estimated from 1 year of daily data.',
        relatedTerms: ['Efficient Frontier', 'Sharpe Ratio', 'Correlation', 'Covariance'],
    },
    {
        term: 'Monte Carlo',
        definition: 'A computational technique using random sampling to estimate complex mathematical functions or simulate processes.',
        category: 'Methods',
        steps: ['1. Define the stochastic model (e.g., GBM for stock prices)', '2. Generate thousands of random price paths', '3. Each path follows: Sₜ₊₁ = Sₜ × exp((μ − σ²/2)Δt + σ√Δt × Z)', '4. Where Z ~ N(0,1) is a random standard normal', '5. Average the outcomes across all paths to estimate the expected value', '6. Used for option pricing, VaR, and risk measurement'],
        example: 'To price an Asian option on RELIANCE: Simulate 10,000 price paths over 30 days, calculate the average price along each path, compute the payoff, and take the mean discounted payoff.',
        relatedTerms: ['Black-Scholes', 'Heston Model', 'CIR Model'],
    },
    {
        term: 'Moving Average',
        definition: 'A smoothing indicator calculating the average price over a specified number of periods.',
        category: 'Technical Analysis',
        formula: 'SMA(n) = (P₁ + P₂ + ... + Pₙ) / n\nEMA(n) = Pₜ × k + EMA_prev × (1 − k)\nk = 2 / (n + 1)',
        variables: ['SMA = Simple Moving Average', 'EMA = Exponential Moving Average (responds faster to recent prices)', 'n = Number of periods', 'k = Smoothing factor for EMA'],
        steps: ['1. SMA: Sum the last n closing prices, divide by n', '2. EMA: Apply exponential weighting — recent prices matter more', '3. Common periods: 9 (short-term), 20 (medium), 50 (intermediate), 200 (long-term)', '4. Golden Cross: 50-day MA crosses above 200-day MA (bullish)', '5. Death Cross: 50-day MA crosses below 200-day MA (bearish)'],
        example: 'RELIANCE 20-day SMA at ₹1,340, current price ₹1,350: Price above SMA suggests bullish momentum. If 50-day SMA (₹1,320) crosses above 200-day SMA (₹1,310) → Golden Cross.',
        relatedTerms: ['Bollinger Bands', 'RSI', 'Candlestick'],
    },
    {
        term: 'OHLCV',
        definition: 'Open, High, Low, Close, Volume — the five key data points for each trading period.',
        category: 'Data',
        variables: ['Open = First trade price of the period', 'High = Highest price during the period', 'Low = Lowest price during the period', 'Close = Last trade price of the period', 'Volume = Total number of shares traded'],
        steps: ['1. Each candle interval (1min, 5min, 1day) produces one OHLCV bar', '2. Open: first trade after the interval starts', '3. High/Low: extreme prices during the interval', '4. Close: last trade before interval ends', '5. Volume: total shares exchanged in the interval'],
        insight: 'QuantFusion displays 5-minute OHLCV bars on the live chart. The BSE trading day (9:15 AM – 3:30 PM IST) produces 75 candles of 5 minutes each.',
        relatedTerms: ['Candlestick', 'VWAP'],
    },
    {
        term: 'P/E Ratio',
        definition: 'Price-to-Earnings Ratio — stock price divided by earnings per share. Measures relative valuation.',
        category: 'Fundamentals',
        formula: 'P/E = Stock Price / EPS\nForward P/E = Stock Price / Expected EPS',
        steps: ['1. Get current stock price', '2. Get trailing 12-month EPS (or forward estimated EPS)', '3. P/E = Price / EPS', '4. Compare with sector average and historical P/E', '5. High P/E (>25) = growth expectations. Low P/E (<15) = value stock or low growth'],
        example: 'TCS at ₹2,524 with EPS ₹130: P/E = 2,524 / 130 = 19.4x. NIFTY 50 average P/E ≈ 22x. TCS is slightly below market average — fairly valued.',
        insight: 'Indian large-caps typically trade at P/E 18–25x. FMCG stocks (HINDUNILVR, NESTLEIND) command premium P/E (50–70x) due to consistent earnings. PSU banks trade at lower P/E (8–12x).',
        relatedTerms: ['EPS', 'Market Cap', 'Dividend Yield'],
    },
    {
        term: 'Put Option',
        definition: 'A contract giving the buyer the right, but not obligation, to sell an asset at a specified price before expiry.',
        category: 'Derivatives',
        formula: 'Payoff = max(K − S, 0) − Premium',
        variables: ['K = Strike price', 'S = Stock price at expiry', 'Premium = Price paid for the put'],
        steps: ['1. Buy a put option by paying the premium', '2. At expiry, if S < K: exercise the option, profit = K − S − Premium', '3. If S ≥ K: let the option expire worthless, loss = Premium paid', '4. Breakeven = K − Premium', '5. Used for hedging downside risk in your portfolio'],
        example: 'Buy NIFTY 24000 PE at ₹120. NIFTY falls to 23,600: Payoff = 24,000 − 23,600 − 120 = ₹280 profit. If NIFTY stays above 24,000: Loss = ₹120.',
        relatedTerms: ['Call Option', 'Black-Scholes', 'Delta', 'Hedge'],
    },
    {
        term: 'Rho',
        definition: 'The rate of change of an option\'s price relative to a change in the risk-free interest rate.',
        category: 'Greeks',
        formula: 'ρ_call = K·t·e⁻ʳᵗ·N(d₂)\nρ_put = −K·t·e⁻ʳᵗ·N(−d₂)',
        variables: ['K = Strike price', 't = Time to expiry', 'r = Risk-free rate', 'N(d₂) = Cumulative normal distribution'],
        steps: ['1. Calculate d₂ from the Black-Scholes formula', '2. For calls: ρ = K × t × e^(−rt) × N(d₂)', '3. For puts: ρ = −K × t × e^(−rt) × N(−d₂)', '4. Rho is typically the least significant Greek for short-dated options'],
        example: 'A 90-day NIFTY call with ρ = 15: If RBI raises repo rate by 0.25% (25 bps), the option price increases by ≈₹3.75.',
        insight: 'In India, RBI rate decisions are infrequent (6 MPC meetings per year), so Rho matters mainly for LEAPS (long-dated options).',
        relatedTerms: ['Greeks', 'Black-Scholes', 'Vasicek Model'],
    },
    {
        term: 'RSI',
        definition: 'Relative Strength Index — a momentum oscillator measuring speed and change of price movements (0-100).',
        category: 'Technical Analysis',
        formula: 'RSI = 100 − [100 / (1 + RS)]\nRS = Average Gain / Average Loss',
        variables: ['RSI ranges from 0 to 100', 'RS = Relative Strength (ratio of average gains to average losses)', 'Typically calculated over 14 periods'],
        steps: ['1. Calculate daily price changes for the last 14 periods', '2. Separate gains (positive changes) and losses (negative changes)', '3. Average Gain = mean of gains over 14 periods', '4. Average Loss = mean of |losses| over 14 periods', '5. RS = Average Gain / Average Loss', '6. RSI = 100 − (100 / (1 + RS))', '7. RSI > 70 → Overbought (potential sell signal)', '8. RSI < 30 → Oversold (potential buy signal)'],
        example: 'RELIANCE over 14 days: 8 up days averaging +1.2%, 6 down days averaging −0.8%. RS = 1.2/0.8 = 1.5. RSI = 100 − 100/2.5 = 60 (neutral territory).',
        insight: 'QuantFusion\'s RL Agent uses RSI as one of its input features for generating buy/sell signals. RSI works best in range-bound markets; in strong trends, RSI can stay overbought/oversold for extended periods.',
        relatedTerms: ['Bollinger Bands', 'Moving Average'],
    },
    {
        term: 'Sharpe Ratio',
        definition: 'Risk-adjusted return: (portfolio return - risk-free rate) / portfolio standard deviation.',
        category: 'Performance',
        formula: 'Sharpe = (Rₚ − Rf) / σₚ',
        formulaDesc: 'Measures the excess return per unit of total risk.',
        variables: ['Rₚ = Portfolio return (annualized)', 'Rf = Risk-free rate (RBI repo rate)', 'σₚ = Portfolio standard deviation (annualized)'],
        steps: ['1. Calculate annualized portfolio return Rₚ', '2. Get risk-free rate Rf (repo rate ≈ 6.5%)', '3. Calculate annualized standard deviation σₚ of portfolio returns', '4. Sharpe = (Rₚ − Rf) / σₚ', '5. Sharpe > 1.0 = good, > 2.0 = excellent, < 0 = underperforming risk-free rate'],
        example: 'Portfolio return 15%, Rf = 6.5%, σ = 18%: Sharpe = (15% − 6.5%) / 18% = 0.47. NIFTY 50 Sharpe over 10 years ≈ 0.55.',
        insight: 'The tangent portfolio on the efficient frontier is the portfolio with the highest Sharpe ratio. In Indian markets, a Sharpe ratio > 0.5 is considered decent.',
        relatedTerms: ['Alpha', 'Efficient Frontier', 'Markowitz', 'Volatility'],
    },
    {
        term: 'Short Selling',
        definition: 'Selling borrowed shares with the aim of buying them back later at a lower price for profit.',
        category: 'Trading',
        formula: 'Profit = (Sell Price − Buy Price) × Shares − Borrowing Costs',
        steps: ['1. Borrow shares from a broker', '2. Sell the borrowed shares at the current market price', '3. Wait for the price to drop', '4. Buy back the shares at the lower price', '5. Return shares to the lender', '6. Profit = Price difference minus borrowing and transaction costs', '7. Risk: unlimited loss if price rises instead'],
        example: 'Short sell 100 shares of ADANIENT at ₹2,140. Price drops to ₹2,000 → Buy back. Profit = (₹2,140 − ₹2,000) × 100 = ₹14,000.',
        insight: 'In India, intraday short selling is allowed. For delivery-based shorting, you need to use SLBM (Stock Lending and Borrowing Mechanism) on NSE. SEBI restricts naked short selling.',
        relatedTerms: ['Bear Market', 'Put Option', 'Hedge'],
    },
    {
        term: 'Theta',
        definition: 'The rate at which an option loses value each day as it approaches expiry (time decay).',
        category: 'Greeks',
        formula: 'Θ = −[S·N\'(d₁)·σ / (2√t)] − r·K·e⁻ʳᵗ·N(d₂)',
        variables: ['Θ is always negative for long options (value erodes daily)', 'ATM options have the highest time decay', 'Time decay accelerates as expiry approaches'],
        steps: ['1. Calculate d₁ and d₂ from Black-Scholes', '2. Evaluate the formula (typically expressed as daily decay)', '3. For ATM options: Θ ≈ −(S × σ) / (2 × √(2π × t))', '4. Theta decay is non-linear — it accelerates in the last week before expiry'],
        example: 'NIFTY 24000 CE with 15 days to expiry, Θ = −₹8.50/day: The option loses ₹8.50 each day even if NIFTY does not move. With 3 days left, Θ may be −₹25/day — decay accelerates.',
        insight: 'Option sellers benefit from theta decay. In India, weekly NIFTY/BANKNIFTY options (expiring every Thursday) have extreme theta decay on Wednesday/Thursday, which is why "theta gang" strategies are popular.',
        relatedTerms: ['Greeks', 'Black-Scholes', 'Delta', 'Gamma'],
    },
    {
        term: 'Vasicek Model',
        definition: 'A mean-reverting interest rate model used to forecast the short-term rate. Feeds into BSM pricing.',
        category: 'Quant Models',
        formula: 'dr = a(b − r)dt + σ · dW',
        formulaDesc: 'Interest rates are pulled toward the long-term mean b at speed a, with Gaussian noise.',
        variables: ['r = Current short rate', 'a = Speed of mean reversion', 'b = Long-term mean rate', 'σ = Volatility of rate changes', 'dW = Wiener process (random noise)'],
        steps: ['1. Collect historical RBI repo rate data', '2. Estimate parameters a, b, σ via OLS or MLE', '3. The drift term a(b − r) pulls rates toward b', '4. When r > b, rates tend to fall; when r < b, rates tend to rise', '5. Forecast future rates: E[rₜ] = b + (r₀ − b)·e⁻ᵃᵗ', '6. Use for discounting cash flows and bond pricing'],
        example: 'Current repo rate r = 6.5%, b = 6.0%, a = 0.5, σ = 0.8%: Expected rate in 1 year = 6.0% + (6.5% − 6.0%)×e^(−0.5) = 6.0% + 0.30% = 6.30%. The rate is expected to decline toward 6%.',
        insight: 'This is one of the 10 models in QuantFusion. It uses actual RBI DBIE API data for calibration. The forecasted risk-free rate feeds into Black-Scholes option pricing.',
        relatedTerms: ['CIR Model', 'Black-Scholes', 'Yield Curve'],
    },
    {
        term: 'Vega',
        definition: 'The sensitivity of an option\'s price to a 1% change in implied volatility.',
        category: 'Greeks',
        formula: 'ν = S·√t·N\'(d₁)',
        variables: ['S = Underlying price', 't = Time to expiry', 'N\'(d₁) = Standard normal PDF at d₁'],
        steps: ['1. Calculate d₁ from Black-Scholes', '2. Evaluate standard normal PDF at d₁', '3. Vega = S × √t × N\'(d₁)', '4. Vega is highest for ATM options with long time to expiry', '5. Both calls and puts have positive Vega (benefit from rising IV)'],
        example: 'NIFTY 24000 CE with Vega = ₹45: If India VIX rises from 14 to 15 (1 point increase), option price increases by ₹45. If VIX drops by 3 points, option loses ₹135.',
        relatedTerms: ['Implied Volatility', 'Greeks', 'GARCH'],
    },
    {
        term: 'Volatility',
        definition: 'A statistical measure of price dispersion, typically annualised standard deviation of returns.',
        category: 'Risk',
        formula: 'σ_daily = √[Σ(rᵢ − r̄)² / (n−1)]\nσ_annual = σ_daily × √252',
        formulaDesc: '252 trading days per year is the convention for annualizing daily volatility.',
        variables: ['rᵢ = Daily log return = ln(Pᵢ/Pᵢ₋₁)', 'r̄ = Mean daily return', 'n = Number of observations', '√252 = Annualization factor'],
        steps: ['1. Calculate daily log returns for the stock', '2. Compute the standard deviation of returns over the window', '3. Annualize by multiplying by √252', '4. Historical vol = based on past data', '5. Implied vol = derived from option prices (forward-looking)'],
        example: 'RELIANCE daily σ = 1.5%. Annual σ = 1.5% × √252 = 1.5% × 15.87 = 23.8%. This means roughly 68% of the time, annual returns fall within ±23.8% of the mean.',
        insight: 'QuantFusion\'s GARCH model dynamically forecasts volatility rather than using simple historical vol. GARCH captures volatility clustering — periods of high vol tend to follow periods of high vol.',
        relatedTerms: ['GARCH', 'Implied Volatility', 'Beta', 'Drawdown'],
    },
    {
        term: 'VPIN',
        definition: 'Volume-Synchronized Probability of Informed Trading — measures toxicity of order flow.',
        category: 'Market Microstructure',
        formula: 'VPIN = |V_buy − V_sell| / V_total',
        formulaDesc: 'VPIN estimates the fraction of trading volume coming from informed traders.',
        variables: ['V_buy = Buyer-initiated volume (classified via tick rule)', 'V_sell = Seller-initiated volume', 'V_total = Total volume in the bucket', 'VPIN ranges from 0 (no informed trading) to 1 (all informed)'],
        steps: ['1. Divide trading into volume-equal buckets (e.g., 10,000 shares each)', '2. Classify each trade as buyer- or seller-initiated', '3. For each bucket: VPIN = |V_buy − V_sell| / V_total', '4. Average over n buckets (typically 50)', '5. High VPIN (>0.5) warns of potential large price moves or flash crashes'],
        example: 'In a RELIANCE volume bucket: 6,500 buyer-initiated, 3,500 seller-initiated → VPIN = |6,500 − 3,500| / 10,000 = 0.30 (moderate informed trading).',
        insight: 'VPIN spiked before major crashes (2010 US Flash Crash, COVID sell-off). It can serve as an early warning system for institutional traders. In Indian markets, high VPIN on F&O expiry days is common.',
        relatedTerms: ['Kyle Model', 'Lambda', 'Glosten-Milgrom'],
    },
    {
        term: 'VWAP',
        definition: 'Volume-Weighted Average Price — the average price weighted by volume, used as a trading benchmark.',
        category: 'Trading',
        formula: 'VWAP = Σ(Pᵢ × Vᵢ) / Σ(Vᵢ)',
        variables: ['Pᵢ = Typical price of candle i = (High + Low + Close) / 3', 'Vᵢ = Volume of candle i', 'Σ = Sum across all intraday candles'],
        steps: ['1. For each intraday period, calculate typical price = (H + L + C) / 3', '2. Multiply by volume: PV = Typical Price × Volume', '3. Accumulate running totals of PV and Volume', '4. VWAP = Cumulative PV / Cumulative Volume', '5. Price above VWAP → bullish sentiment. Below VWAP → bearish'],
        example: 'After 4 candles: PV totals ₹4,72,50,000, Volume total = 35,000 shares → VWAP = ₹4,72,50,000 / 35,000 = ₹1,350. If current price is ₹1,355 (above VWAP) → buyers in control.',
        insight: 'VWAP is the benchmark for institutional execution in India. Large mutual funds aim to execute at or better than VWAP. Algorithms like TWAP and POV try to beat VWAP.',
        relatedTerms: ['Market Order', 'OHLCV', 'Liquidity'],
    },
    {
        term: 'Yield Curve',
        definition: 'A plot of interest rates across different maturities. An inverted curve may signal recession.',
        category: 'Fixed Income',
        steps: ['1. Plot Indian government bond yields: 91-day T-bill, 1yr, 5yr, 10yr, 30yr', '2. Normal curve: upward sloping (long-term rates > short-term)', '3. Flat curve: similar rates across maturities (uncertainty)', '4. Inverted curve: short-term rates > long-term rates (recession signal)', '5. RBI rate changes shift the short end; inflation expectations shift the long end'],
        example: 'India yield curve (April 2026): 91-day = 6.40%, 1yr = 6.55%, 5yr = 6.90%, 10yr = 7.10% → Normal upward-sloping curve indicating healthy economic outlook.',
        insight: 'The Vasicek and CIR models in QuantFusion model the short-term rate (91-day). The entire yield curve can be derived from these models using no-arbitrage conditions.',
        relatedTerms: ['Vasicek Model', 'CIR Model', 'Rho'],
    },
];

// Category icons and colors
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
    'Performance': { icon: '📊', color: '#10b981' },
    'Trading': { icon: '⚡', color: '#f59e0b' },
    'Market Structure': { icon: '🏛️', color: '#3b82f6' },
    'Quant Models': { icon: '🧮', color: '#c9a227' },
    'Risk': { icon: '⚠️', color: '#ef4444' },
    'Portfolio Theory': { icon: '📁', color: '#8b5cf6' },
    'Derivatives': { icon: '📜', color: '#06b6d4' },
    'Technical Analysis': { icon: '📈', color: '#10b981' },
    'Greeks': { icon: 'Δ', color: '#8b5cf6' },
    'Fundamentals': { icon: '📋', color: '#3b82f6' },
    'Statistics': { icon: '📐', color: '#06b6d4' },
    'Risk Management': { icon: '🛡️', color: '#ef4444' },
    'Options': { icon: '⚖️', color: '#f59e0b' },
    'Market Microstructure': { icon: 'λ', color: '#c9a227' },
    'Markets': { icon: '🌍', color: '#10b981' },
    'Instruments': { icon: '🏦', color: '#3b82f6' },
    'Methods': { icon: '🎲', color: '#8b5cf6' },
    'Data': { icon: '📦', color: '#06b6d4' },
    'Fixed Income': { icon: '📉', color: '#f59e0b' },
};

export default function Glossary() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

    const categories = useMemo(() => [...new Set(TERMS.map(t => t.category))].sort(), []);

    const filtered = useMemo(() => {
        return TERMS.filter(t => {
            const matchesSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase());
            const matchesCat = !selectedCategory || t.category === selectedCategory;
            return matchesSearch && matchesCat;
        });
    }, [search, selectedCategory]);

    const toggleExpand = (term: string) => {
        setExpandedTerm(expandedTerm === term ? null : term);
    };

    return (
        <div className="animate-in">
            <div className="section-header">
                <div className="section-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>📖</div>
                <div>
                    <h2 className="section-title">QuantFusion Educational Glossary</h2>
                    <p className="section-sub">{TERMS.length} terms with formulas, calculation steps, and examples — your complete quant finance reference</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                    className="input-field"
                    placeholder="Search terms, formulas, concepts…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: 300 }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                        className={selectedCategory === null ? 'btn-gold' : 'btn-outline'}
                        onClick={() => setSelectedCategory(null)}
                        style={{ padding: '6px 12px', fontSize: 11 }}
                    >All ({TERMS.length})</button>
                    {categories.map(cat => {
                        const style = CATEGORY_STYLES[cat] || { icon: '•', color: '#888' };
                        const count = TERMS.filter(t => t.category === cat).length;
                        return (
                            <button
                                key={cat}
                                className={selectedCategory === cat ? 'btn-gold' : 'btn-outline'}
                                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                                style={{ padding: '6px 12px', fontSize: 11 }}
                            >{style.icon} {cat} ({count})</button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(t => {
                    const isExpanded = expandedTerm === t.term;
                    const catStyle = CATEGORY_STYLES[t.category] || { icon: '•', color: '#888' };
                    const hasDetails = t.formula || t.steps || t.example || t.insight;

                    return (
                        <div
                            key={t.term}
                            className="glass-card"
                            style={{
                                padding: 0,
                                overflow: 'hidden',
                                borderLeft: `3px solid ${catStyle.color}`,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {/* Header — always visible */}
                            <div
                                onClick={() => hasDetails && toggleExpand(t.term)}
                                style={{
                                    padding: '16px 20px',
                                    cursor: hasDetails ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 14,
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => { if (hasDetails) e.currentTarget.style.background = 'rgba(201,162,39,0.03)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: `${catStyle.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, flexShrink: 0,
                                }}>{catStyle.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{t.term}</span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 100, fontSize: 9, fontWeight: 600,
                                            background: `${catStyle.color}15`, color: catStyle.color, textTransform: 'uppercase',
                                        }}>{t.category}</span>
                                        {hasDetails && (
                                            <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                                                {isExpanded ? '▲ Collapse' : '▼ Expand details'}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{t.definition}</p>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && hasDetails && (
                                <div style={{
                                    padding: '0 20px 20px 70px',
                                    borderTop: '1px solid var(--border)',
                                    animation: 'fadeIn 0.3s ease-out',
                                }}>
                                    {/* Formula */}
                                    {t.formula && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                📐 Formula
                                            </div>
                                            <div style={{
                                                background: 'rgba(201,162,39,0.06)',
                                                border: '1px solid rgba(201,162,39,0.12)',
                                                borderRadius: 8, padding: '12px 16px',
                                                fontFamily: 'var(--mono)', fontSize: 14,
                                                color: 'var(--gold)', lineHeight: 1.8,
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                                {t.formula}
                                            </div>
                                            {t.formulaDesc && (
                                                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>{t.formulaDesc}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Variables */}
                                    {t.variables && t.variables.length > 0 && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                📝 Variables
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {t.variables.map((v, i) => (
                                                    <div key={i} style={{
                                                        fontSize: 12, color: 'var(--text)',
                                                        padding: '4px 0',
                                                        borderBottom: i < t.variables!.length - 1 ? '1px solid rgba(201,162,39,0.06)' : 'none',
                                                        fontFamily: 'var(--mono)',
                                                    }}>
                                                        {v}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Calculation Steps */}
                                    {t.steps && t.steps.length > 0 && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                🔢 Calculation Steps
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {t.steps.map((step, i) => (
                                                    <div key={i} style={{
                                                        fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
                                                        padding: '6px 10px',
                                                        background: i % 2 === 0 ? 'rgba(201,162,39,0.03)' : 'transparent',
                                                        borderRadius: 4,
                                                    }}>
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Example */}
                                    {t.example && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                💡 Example (Indian Markets)
                                            </div>
                                            <div style={{
                                                background: 'rgba(16,185,129,0.05)',
                                                border: '1px solid rgba(16,185,129,0.12)',
                                                borderRadius: 8, padding: '12px 16px',
                                                fontSize: 12, color: 'var(--text)', lineHeight: 1.7,
                                            }}>
                                                {t.example}
                                            </div>
                                        </div>
                                    )}

                                    {/* Insight */}
                                    {t.insight && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                🎯 Key Insight
                                            </div>
                                            <div style={{
                                                background: 'rgba(59,130,246,0.05)',
                                                border: '1px solid rgba(59,130,246,0.12)',
                                                borderRadius: 8, padding: '12px 16px',
                                                fontSize: 12, color: 'var(--text)', lineHeight: 1.7,
                                                fontStyle: 'italic',
                                            }}>
                                                {t.insight}
                                            </div>
                                        </div>
                                    )}

                                    {/* Related Terms */}
                                    {t.relatedTerms && t.relatedTerms.length > 0 && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: catStyle.color, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                                                🔗 Related Terms
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {t.relatedTerms.map(rt => (
                                                    <span
                                                        key={rt}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSearch('');
                                                            setSelectedCategory(null);
                                                            setExpandedTerm(rt);
                                                            // Scroll to the term
                                                            setTimeout(() => {
                                                                document.getElementById(`term-${rt.replace(/[^a-zA-Z0-9]/g, '')}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }, 100);
                                                        }}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 100, fontSize: 11,
                                                            background: 'rgba(201,162,39,0.08)', color: 'var(--gold)',
                                                            cursor: 'pointer', fontWeight: 600,
                                                            transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.18)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.08)'; }}
                                                    >{rt}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div id={`term-${t.term.replace(/[^a-zA-Z0-9]/g, '')}`} />
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                        No terms match your search
                    </div>
                )}
            </div>
        </div>
    );
}
