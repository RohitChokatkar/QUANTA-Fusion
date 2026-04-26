import { useState, useMemo } from 'react';

export default function SIPCalculator() {
    const [monthly, setMonthly] = useState<number>(5000);
    const [rate, setRate] = useState<number>(12);
    const [years, setYears] = useState<number>(10);

    const result = useMemo(() => {
        const m = Math.max(0, monthly);
        const y = Math.max(0, years);
        const n = y * 12;
        
        if (n <= 0 || m <= 0) return { maturity: 0, totalInvested: 0, wealthGained: 0, wealthMultiple: 0 };

        const totalInvested = m * n;

        if (rate <= 0) {
            // No interest — just accumulation
            return { maturity: totalInvested, totalInvested, wealthGained: 0, wealthMultiple: 1 };
        }

        // Standard SIP future value formula (ordinary annuity): FV = P × [(1+r)^n - 1] / r
        const r = rate / 12 / 100;
        const maturity = m * ((Math.pow(1 + r, n) - 1) / r);
        const wealthGained = maturity - totalInvested;
        const wealthMultiple = maturity / totalInvested;

        return {
            maturity: isNaN(maturity) ? 0 : maturity,
            totalInvested,
            wealthGained: isNaN(wealthGained) ? 0 : wealthGained,
            wealthMultiple: isNaN(wealthMultiple) ? 0 : wealthMultiple,
        };
    }, [monthly, rate, years]);

    const formatINR = (val: number) => {
        if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
        if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
        return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    // Progress bar percentage (invested vs gain)
    const investedPct = result.maturity > 0 ? (result.totalInvested / result.maturity * 100) : 100;

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--display)', marginBottom: 16 }}>SIP Calculator</h2>
            <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Monthly Investment (₹)</label>
                        <input className="input-field" type="number" min="100" step="500" value={monthly} onChange={e => setMonthly(Number(e.target.value))} />
                        <input type="range" min="500" max="100000" step="500" value={monthly}
                            onChange={e => setMonthly(Number(e.target.value))}
                            style={{ width: '100%', marginTop: 8, accentColor: 'var(--gold)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                            <span>₹500</span><span>₹1,00,000</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Expected Annual Return (%)</label>
                        <input className="input-field" type="number" step="0.5" min="0" max="30" value={rate} onChange={e => setRate(Number(e.target.value))} />
                        <input type="range" min="1" max="30" step="0.5" value={rate}
                            onChange={e => setRate(Number(e.target.value))}
                            style={{ width: '100%', marginTop: 8, accentColor: 'var(--gold)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                            <span>1%</span><span>30%</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Investment Period (Years)</label>
                        <input className="input-field" type="number" min="1" max="40" value={years} onChange={e => setYears(Number(e.target.value))} />
                        <input type="range" min="1" max="40" step="1" value={years}
                            onChange={e => setYears(Number(e.target.value))}
                            style={{ width: '100%', marginTop: 8, accentColor: 'var(--gold)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                            <span>1 yr</span><span>40 yrs</span>
                        </div>
                    </div>
                </div>
                
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Maturity Value</div>
                        <div className="number-morph text-gold" style={{ fontSize: 32, fontWeight: 700 }}>{formatINR(result.maturity)}</div>
                    </div>

                    {/* Stacked bar */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--bg2)' }}>
                            <div style={{ width: `${investedPct}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
                            <div style={{ flex: 1, background: '#10b981' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
                            <span style={{ color: '#3b82f6' }}>● Invested: {formatINR(result.totalInvested)}</span>
                            <span style={{ color: '#10b981' }}>● Gains: {formatINR(result.wealthGained)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(59,130,246,0.06)', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Total Invested</div>
                            <div className="number-morph" style={{ fontSize: 16, fontWeight: 700 }}>{formatINR(result.totalInvested)}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>Wealth Multiple</div>
                            <div className="number-morph" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{result.wealthMultiple.toFixed(2)}x</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 12, padding: 10, background: 'rgba(201,162,39,0.04)', borderRadius: 8, fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
                        💡 Investing ₹{monthly.toLocaleString('en-IN')}/month for {years} years at {rate}% p.a. will grow to {formatINR(result.maturity)}. Your money grows {result.wealthMultiple.toFixed(1)}x due to compounding.
                    </div>
                </div>
            </div>
        </div>
    );
}
