// RoboAdvisor — Floating chatbot-style robo-advisor with 3-step questionnaire
// Suggests portfolio allocation based on risk tolerance and investment horizon
// Uses Modern Portfolio Theory principles for allocation recommendations
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type RiskLevel = 'conservative' | 'moderate' | 'aggressive';
type Horizon = 'short' | 'medium' | 'long';
type Goal = 'preservation' | 'growth' | 'income' | 'aggressive_growth';

interface Allocation {
    name: string;
    value: number;
    color: string;
    description: string;
}

const COLORS = {
    stocks: '#3b82f6',
    bonds: '#10b981',
    gold: '#c9a227',
    cash: '#8b5cf6',
    reits: '#06b6d4',
    international: '#f59e0b',
};

function getPortfolio(risk: RiskLevel, horizon: Horizon, goal: Goal): { allocations: Allocation[]; summary: string; riskScore: number } {
    let stocks = 0, bonds = 0, gold = 0, cash = 0, reits = 0, intl = 0;

    // Base allocation by risk
    if (risk === 'conservative') {
        stocks = 20; bonds = 45; gold = 15; cash = 15; reits = 5; intl = 0;
    } else if (risk === 'moderate') {
        stocks = 40; bonds = 25; gold = 10; cash = 10; reits = 5; intl = 10;
    } else {
        stocks = 60; bonds = 10; gold = 5; cash = 5; reits = 5; intl = 15;
    }

    // Adjust for horizon
    if (horizon === 'long') {
        stocks += 10; bonds -= 5; cash -= 5;
    } else if (horizon === 'short') {
        stocks -= 10; bonds += 5; cash += 5;
    }

    // Adjust for goal
    if (goal === 'preservation') {
        bonds += 10; stocks -= 10;
    } else if (goal === 'aggressive_growth') {
        stocks += 10; bonds -= 5; gold -= 5;
    } else if (goal === 'income') {
        bonds += 5; reits += 5; stocks -= 10;
    }

    // Normalize
    const total = stocks + bonds + gold + cash + reits + intl;
    stocks = Math.max(0, Math.round(stocks / total * 100));
    bonds = Math.max(0, Math.round(bonds / total * 100));
    gold = Math.max(0, Math.round(gold / total * 100));
    cash = Math.max(0, Math.round(cash / total * 100));
    reits = Math.max(0, Math.round(reits / total * 100));
    intl = Math.max(0, Math.round(intl / total * 100));

    // Adjust rounding
    const sum = stocks + bonds + gold + cash + reits + intl;
    if (sum !== 100) stocks += (100 - sum);

    const allocations: Allocation[] = [];
    if (stocks > 0) allocations.push({ name: 'Equity (Stocks)', value: stocks, color: COLORS.stocks, description: 'Indian large-cap and mid-cap equities for growth' });
    if (bonds > 0) allocations.push({ name: 'Bonds / Debt', value: bonds, color: COLORS.bonds, description: 'Government and corporate bonds for stability' });
    if (gold > 0) allocations.push({ name: 'Gold / Commodities', value: gold, color: COLORS.gold, description: 'Gold ETFs and sovereign gold bonds as hedge' });
    if (cash > 0) allocations.push({ name: 'Cash / Liquid', value: cash, color: COLORS.cash, description: 'Liquid funds and savings for emergency access' });
    if (reits > 0) allocations.push({ name: 'REITs / Real Estate', value: reits, color: COLORS.reits, description: 'Real estate investment trusts for diversification' });
    if (intl > 0) allocations.push({ name: 'International', value: intl, color: COLORS.international, description: 'US and global equity funds for geographic diversification' });

    const riskScore = risk === 'conservative' ? 3 : risk === 'moderate' ? 6 : 9;
    const horizonLabel = horizon === 'short' ? '1-3 years' : horizon === 'medium' ? '3-7 years' : '7+ years';

    let summary = '';
    if (risk === 'conservative') {
        summary = `Based on your conservative risk profile and ${horizonLabel} horizon, we recommend a stability-focused portfolio. The emphasis on bonds (${bonds}%) and gold (${gold}%) helps preserve capital while equities (${stocks}%) provide modest growth. This follows the low-volatility frontier of Modern Portfolio Theory — maximizing return for your acceptable risk level.`;
    } else if (risk === 'moderate') {
        summary = `Your moderate risk tolerance with a ${horizonLabel} horizon calls for a balanced approach. We've allocated ${stocks}% to equities for growth, balanced with ${bonds}% in bonds for stability. Gold at ${gold}% acts as an inflation hedge. This portfolio sits near the tangency point on the efficient frontier — the optimal risk-adjusted return per MPT.`;
    } else {
        summary = `With your aggressive risk appetite and ${horizonLabel} horizon, we've maximized growth potential. ${stocks}% in equities and ${intl}% in international markets capture higher expected returns. Per Modern Portfolio Theory, your longer horizon allows you to ride out market volatility and benefit from the equity risk premium over time.`;
    }

    return { allocations, summary, riskScore };
}

type Step = 0 | 1 | 2 | 3; // 0=idle, 1=risk, 2=horizon, 3=goal, after 3=results

export default function RoboAdvisor() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>(0);
    const [risk, setRisk] = useState<RiskLevel | null>(null);
    const [horizon, setHorizon] = useState<Horizon | null>(null);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [showResult, setShowResult] = useState(false);

    const portfolio = useMemo(() => {
        if (risk && horizon && goal) return getPortfolio(risk, horizon, goal);
        return null;
    }, [risk, horizon, goal]);

    const reset = () => {
        setStep(0);
        setRisk(null);
        setHorizon(null);
        setGoal(null);
        setShowResult(false);
    };

    const handleOpen = () => {
        setOpen(true);
        if (step === 0) setStep(1);
    };

    const selectRisk = (r: RiskLevel) => {
        setRisk(r);
        setStep(2);
    };

    const selectHorizon = (h: Horizon) => {
        setHorizon(h);
        setStep(3);
    };

    const selectGoal = (g: Goal) => {
        setGoal(g);
        setTimeout(() => setShowResult(true), 300);
    };

    const riskEmoji = risk === 'conservative' ? '🛡️' : risk === 'moderate' ? '⚖️' : '🚀';

    return (
        <>
            {/* Floating Robot Face */}
            <button
                className="robo-fab"
                onClick={handleOpen}
                aria-label="Open Robo-Advisor"
            >
                <div className="robo-fab-face">
                    <div className="robo-fab-eyes">
                        <span className="robo-fab-eye" />
                        <span className="robo-fab-eye" />
                    </div>
                    <div className="robo-fab-mouth" />
                </div>
                <div className="robo-fab-pulse" />
            </button>

            {/* Centered Modal Window */}
            {open && (
                <>
                    <div className="robo-overlay" onClick={() => setOpen(false)} />
                    <div className="robo-window-centered">
                        <div className="robo-window">
                            <div className="robo-header">
                                <div className="robo-header-left">
                                    <div className="robo-avatar">
                                        <div className="robo-avatar-eyes">
                                            <span /><span />
                                        </div>
                                        <div className="robo-avatar-mouth" />
                                    </div>
                                    <div>
                                        <div className="robo-header-title">QF RoboAdvisor</div>
                                        <div className="robo-header-sub">Portfolio Allocation Simulator</div>
                                    </div>
                                </div>
                                <button className="robo-close" onClick={() => setOpen(false)}>✕</button>
                            </div>

                            <div className="robo-body">
                                {/* Welcome message */}
                                <div className="robo-msg robo-msg-bot">
                                    <span className="robo-msg-avatar">🤖</span>
                                    <div className="robo-msg-bubble">
                                        Hello! I'm your AI Portfolio Advisor. I'll help you find the ideal asset allocation based on your preferences. Let's begin! 📊
                                    </div>
                                </div>

                                {/* Step 1: Risk Tolerance */}
                                {step >= 1 && (
                                    <>
                                        <div className="robo-msg robo-msg-bot">
                                            <span className="robo-msg-avatar">🤖</span>
                                            <div className="robo-msg-bubble">
                                                <strong>Step 1/3:</strong> What is your risk tolerance?
                                            </div>
                                        </div>
                                        {!risk ? (
                                            <div className="robo-options">
                                                <button className="robo-option" onClick={() => selectRisk('conservative')}>
                                                    🛡️ Conservative
                                                    <span className="robo-option-sub">I prefer safety over returns</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectRisk('moderate')}>
                                                    ⚖️ Moderate
                                                    <span className="robo-option-sub">Balance of growth and safety</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectRisk('aggressive')}>
                                                    🚀 Aggressive
                                                    <span className="robo-option-sub">Maximize returns, accept volatility</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="robo-msg robo-msg-user">
                                                <div className="robo-msg-bubble robo-msg-user-bubble">
                                                    {riskEmoji} {risk.charAt(0).toUpperCase() + risk.slice(1)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Step 2: Investment Horizon */}
                                {step >= 2 && (
                                    <>
                                        <div className="robo-msg robo-msg-bot">
                                            <span className="robo-msg-avatar">🤖</span>
                                            <div className="robo-msg-bubble">
                                                <strong>Step 2/3:</strong> What is your investment horizon?
                                            </div>
                                        </div>
                                        {!horizon ? (
                                            <div className="robo-options">
                                                <button className="robo-option" onClick={() => selectHorizon('short')}>
                                                    ⏱️ Short-term (1-3 years)
                                                    <span className="robo-option-sub">Near-term goals</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectHorizon('medium')}>
                                                    📅 Medium-term (3-7 years)
                                                    <span className="robo-option-sub">Mid-range planning</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectHorizon('long')}>
                                                    🏔️ Long-term (7+ years)
                                                    <span className="robo-option-sub">Retirement or wealth building</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="robo-msg robo-msg-user">
                                                <div className="robo-msg-bubble robo-msg-user-bubble">
                                                    {horizon === 'short' ? '⏱️ Short-term' : horizon === 'medium' ? '📅 Medium-term' : '🏔️ Long-term'}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Step 3: Investment Goal */}
                                {step >= 3 && (
                                    <>
                                        <div className="robo-msg robo-msg-bot">
                                            <span className="robo-msg-avatar">🤖</span>
                                            <div className="robo-msg-bubble">
                                                <strong>Step 3/3:</strong> What is your primary investment goal?
                                            </div>
                                        </div>
                                        {!goal ? (
                                            <div className="robo-options">
                                                <button className="robo-option" onClick={() => selectGoal('preservation')}>
                                                    🔒 Capital Preservation
                                                    <span className="robo-option-sub">Protect existing wealth</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectGoal('income')}>
                                                    💰 Regular Income
                                                    <span className="robo-option-sub">Dividends and interest</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectGoal('growth')}>
                                                    📈 Steady Growth
                                                    <span className="robo-option-sub">Grow wealth consistently</span>
                                                </button>
                                                <button className="robo-option" onClick={() => selectGoal('aggressive_growth')}>
                                                    🚀 Aggressive Growth
                                                    <span className="robo-option-sub">Maximum capital appreciation</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="robo-msg robo-msg-user">
                                                <div className="robo-msg-bubble robo-msg-user-bubble">
                                                    {goal === 'preservation' ? '🔒 Preservation' : goal === 'income' ? '💰 Income' : goal === 'growth' ? '📈 Growth' : '🚀 Aggressive Growth'}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Results */}
                                {showResult && portfolio && (
                                    <>
                                        <div className="robo-msg robo-msg-bot">
                                            <span className="robo-msg-avatar">🤖</span>
                                            <div className="robo-msg-bubble">
                                                ✅ Analysis complete! Here's your recommended portfolio allocation:
                                            </div>
                                        </div>

                                        <div className="robo-result-card">
                                            <div className="robo-result-header">
                                                <span>📊 Recommended Allocation</span>
                                                <span className="robo-risk-badge">
                                                    Risk Score: {portfolio.riskScore}/10
                                                </span>
                                            </div>

                                            <div className="robo-chart-wrap">
                                                <ResponsiveContainer width="100%" height={180}>
                                                    <PieChart>
                                                        <Pie
                                                            data={portfolio.allocations}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={45}
                                                            outerRadius={75}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            animationBegin={0}
                                                            animationDuration={800}
                                                        >
                                                            {portfolio.allocations.map((entry, i) => (
                                                                <Cell key={i} fill={entry.color} stroke="transparent" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                background: 'rgba(6,13,31,0.95)',
                                                                border: '1px solid rgba(201,162,39,0.2)',
                                                                borderRadius: 8,
                                                                fontSize: 11,
                                                            }}
                                                            formatter={(value: any, name: any) => [`${value}%`, name]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="robo-alloc-list">
                                                {portfolio.allocations.map((a, i) => (
                                                    <div key={i} className="robo-alloc-item">
                                                        <div className="robo-alloc-dot" style={{ background: a.color }} />
                                                        <div className="robo-alloc-info">
                                                            <div className="robo-alloc-name">{a.name}</div>
                                                            <div className="robo-alloc-desc">{a.description}</div>
                                                        </div>
                                                        <div className="robo-alloc-pct">{a.value}%</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="robo-summary">
                                                <div className="robo-summary-title">💡 Why this allocation?</div>
                                                <p>{portfolio.summary}</p>
                                            </div>

                                            <div className="robo-disclaimer-text">
                                                ⚠️ This is a simulation for educational purposes only. No personal data is collected. Consult a SEBI-registered advisor before investing.
                                            </div>
                                        </div>

                                        <div className="robo-restart-row">
                                            <button className="robo-restart-btn" onClick={reset}>
                                                🔄 Start Over
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
