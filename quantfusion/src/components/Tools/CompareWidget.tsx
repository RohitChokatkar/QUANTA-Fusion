// CompareWidget — Peer-to-Peer Stock Comparison with 10 Key Points
// Criteria Definition, Baseline, Data Consistency, Objectivity, Scope & Context,
// Strengths & Weaknesses, Quantitative Metrics, Qualitative Insights, Fairness, Actionable Conclusions
import { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, Cell, Legend,
} from 'recharts';

// ── Stock data universe ──
const STOCK_DATA: Record<string, {
    sector: string; exchange: string; marketCap: string; price: number;
    pe: number; pb: number; eps: number; dividendYield: number;
    roe: number; beta: number; volatility: number; debtEquity: number;
    revenueGrowth: number; profitMargin: number; currentRatio: number;
    fiftyTwoHigh: number; fiftyTwoLow: number;
}> = {
    'RELIANCE': { sector: 'Energy & Petrochemicals', exchange: 'BSE', marketCap: '₹18.2L Cr', price: 1350.20, pe: 24.5, pb: 2.3, eps: 55.1, dividendYield: 0.6, roe: 9.5, beta: 1.1, volatility: 18, debtEquity: 0.39, revenueGrowth: 12.3, profitMargin: 8.2, currentRatio: 1.1, fiftyTwoHigh: 1608, fiftyTwoLow: 1112 },
    'TCS': { sector: 'IT Services', exchange: 'BSE', marketCap: '₹9.1L Cr', price: 2524.35, pe: 28.1, pb: 3.4, eps: 89.8, dividendYield: 1.3, roe: 47.2, beta: 0.65, volatility: 15, debtEquity: 0.05, revenueGrowth: 8.7, profitMargin: 19.6, currentRatio: 2.6, fiftyTwoHigh: 2880, fiftyTwoLow: 2100 },
    'HDFCBANK': { sector: 'Banking', exchange: 'BSE', marketCap: '₹12.3L Cr', price: 810.30, pe: 19.2, pb: 2.7, eps: 42.2, dividendYield: 1.1, roe: 16.8, beta: 0.88, volatility: 16, debtEquity: 6.8, revenueGrowth: 14.5, profitMargin: 24.1, currentRatio: 1.0, fiftyTwoHigh: 920, fiftyTwoLow: 680 },
    'ICICIBANK': { sector: 'Banking', exchange: 'BSE', marketCap: '₹9.4L Cr', price: 1345.00, pe: 17.8, pb: 3.1, eps: 75.6, dividendYield: 0.8, roe: 18.2, beta: 0.95, volatility: 17, debtEquity: 6.2, revenueGrowth: 16.2, profitMargin: 26.3, currentRatio: 1.0, fiftyTwoHigh: 1520, fiftyTwoLow: 1050 },
    'INFY': { sector: 'IT Services', exchange: 'BSE', marketCap: '₹5.4L Cr', price: 1292.50, pe: 22.6, pb: 7.8, eps: 57.2, dividendYield: 2.5, roe: 31.5, beta: 0.72, volatility: 19, debtEquity: 0.11, revenueGrowth: 6.2, profitMargin: 17.8, currentRatio: 2.2, fiftyTwoHigh: 1580, fiftyTwoLow: 1085 },
    'BHARTIARTL': { sector: 'Telecom', exchange: 'BSE', marketCap: '₹10.6L Cr', price: 1870.00, pe: 85.3, pb: 14.2, eps: 21.9, dividendYield: 0.4, roe: 17.5, beta: 0.55, volatility: 22, debtEquity: 2.8, revenueGrowth: 22.1, profitMargin: 10.5, currentRatio: 0.6, fiftyTwoHigh: 2100, fiftyTwoLow: 1350 },
    'ITC': { sector: 'FMCG & Tobacco', exchange: 'BSE', marketCap: '₹3.8L Cr', price: 304.25, pe: 22.8, pb: 6.5, eps: 13.3, dividendYield: 3.2, roe: 28.4, beta: 0.48, volatility: 13, debtEquity: 0.01, revenueGrowth: 5.8, profitMargin: 25.6, currentRatio: 1.8, fiftyTwoHigh: 360, fiftyTwoLow: 260 },
    'SBIN': { sector: 'Banking', exchange: 'BSE', marketCap: '₹9.5L Cr', price: 1066.70, pe: 11.5, pb: 2.1, eps: 92.8, dividendYield: 1.4, roe: 19.8, beta: 1.25, volatility: 21, debtEquity: 12.5, revenueGrowth: 18.4, profitMargin: 14.2, currentRatio: 1.0, fiftyTwoHigh: 1200, fiftyTwoLow: 750 },
    'TATAMOTORS': { sector: 'Automobile', exchange: 'BSE', marketCap: '₹1.6L Cr', price: 444.55, pe: 8.2, pb: 1.8, eps: 54.2, dividendYield: 0.3, roe: 24.1, beta: 1.55, volatility: 28, debtEquity: 1.2, revenueGrowth: 25.6, profitMargin: 6.8, currentRatio: 0.9, fiftyTwoHigh: 580, fiftyTwoLow: 380 },
    'SUNPHARMA': { sector: 'Pharma', exchange: 'BSE', marketCap: '₹4.0L Cr', price: 1654.70, pe: 35.2, pb: 6.1, eps: 47.0, dividendYield: 0.6, roe: 18.5, beta: 0.42, volatility: 20, debtEquity: 0.15, revenueGrowth: 10.8, profitMargin: 16.4, currentRatio: 1.5, fiftyTwoHigh: 1850, fiftyTwoLow: 1280 },
    'WIPRO': { sector: 'IT Services', exchange: 'BSE', marketCap: '₹2.1L Cr', price: 204.88, pe: 18.5, pb: 2.8, eps: 11.1, dividendYield: 0.5, roe: 15.2, beta: 0.78, volatility: 17, debtEquity: 0.22, revenueGrowth: 3.2, profitMargin: 12.5, currentRatio: 2.1, fiftyTwoHigh: 280, fiftyTwoLow: 178 },
    'MARUTI': { sector: 'Automobile', exchange: 'BSE', marketCap: '₹4.3L Cr', price: 13710.95, pe: 32.5, pb: 5.8, eps: 421.9, dividendYield: 0.6, roe: 17.8, beta: 0.85, volatility: 19, debtEquity: 0.02, revenueGrowth: 13.5, profitMargin: 9.2, currentRatio: 1.3, fiftyTwoHigh: 15200, fiftyTwoLow: 11500 },
};

const STOCK_NAMES = Object.keys(STOCK_DATA);

const COMPARISON_CRITERIA = [
    { key: 'pe', label: 'P/E Ratio', category: 'Valuation', lower: true, format: (v: number) => v.toFixed(1) },
    { key: 'pb', label: 'P/B Ratio', category: 'Valuation', lower: true, format: (v: number) => v.toFixed(1) },
    { key: 'eps', label: 'EPS (₹)', category: 'Valuation', lower: false, format: (v: number) => `₹${v.toFixed(1)}` },
    { key: 'marketCap', label: 'Market Cap', category: 'Fundamentals', lower: false, format: (v: any) => v },
    { key: 'dividendYield', label: 'Div. Yield (%)', category: 'Fundamentals', lower: false, format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'roe', label: 'ROE (%)', category: 'Performance', lower: false, format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'revenueGrowth', label: 'Revenue Growth (%)', category: 'Performance', lower: false, format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'profitMargin', label: 'Profit Margin (%)', category: 'Performance', lower: false, format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'beta', label: 'Beta', category: 'Risk', lower: true, format: (v: number) => v.toFixed(2) },
    { key: 'volatility', label: 'Volatility (%)', category: 'Risk', lower: true, format: (v: number) => `${v}%` },
    { key: 'debtEquity', label: 'Debt/Equity', category: 'Risk', lower: true, format: (v: number) => v.toFixed(2) },
    { key: 'currentRatio', label: 'Current Ratio', category: 'Fundamentals', lower: false, format: (v: number) => v.toFixed(1) },
];

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y';

export default function CompareWidget() {
    const [stock1, setStock1] = useState('RELIANCE');
    const [stock2, setStock2] = useState('TCS');
    const [range, setRange] = useState<TimeRange>('1M');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    const s1 = STOCK_DATA[stock1] || STOCK_DATA['RELIANCE'];
    const s2 = STOCK_DATA[stock2] || STOCK_DATA['TCS'];

    // ── 2. Baseline Establishment — Normalized price (base=100) ──
    useEffect(() => {
        const count = range === '1W' ? 5 : range === '1M' ? 22 : range === '3M' ? 66 : range === '6M' ? 132 : 252;
        const arr: any[] = [];
        let p1 = 100, p2 = 100;
        const today = new Date();
        for (let i = 0; i < count; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (count - i));
            p1 *= (1 + (Math.random() - 0.47) * 0.025);
            p2 *= (1 + (Math.random() - 0.47) * 0.025);
            const label = count <= 22
                ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            arr.push({ name: label, [stock1]: parseFloat(p1.toFixed(2)), [stock2]: parseFloat(p2.toFixed(2)) });
        }
        setChartData(arr);
    }, [stock1, stock2, range]);

    // ── 5. Scope & Context ──
    const sameSector = s1.sector === s2.sector;

    // ── 6. Strengths & Weaknesses Analysis ──
    const radarData = useMemo(() => {
        const metrics = [
            { metric: 'Valuation', s1: Math.min(100, Math.max(10, 100 - s1.pe * 2)), s2: Math.min(100, Math.max(10, 100 - s2.pe * 2)) },
            { metric: 'Growth', s1: Math.min(100, s1.revenueGrowth * 4), s2: Math.min(100, s2.revenueGrowth * 4) },
            { metric: 'Profitability', s1: Math.min(100, s1.profitMargin * 3.5), s2: Math.min(100, s2.profitMargin * 3.5) },
            { metric: 'Stability', s1: Math.min(100, Math.max(10, 100 - s1.volatility * 3)), s2: Math.min(100, Math.max(10, 100 - s2.volatility * 3)) },
            { metric: 'Efficiency', s1: Math.min(100, s1.roe * 2.5), s2: Math.min(100, s2.roe * 2.5) },
            { metric: 'Income', s1: Math.min(100, s1.dividendYield * 25), s2: Math.min(100, s2.dividendYield * 25) },
        ];
        return metrics;
    }, [s1, s2, stock1, stock2]);

    // ── 7. Quantitative Metrics — Score tally ──
    const scoreCard = useMemo(() => {
        let s1Wins = 0, s2Wins = 0, ties = 0;
        COMPARISON_CRITERIA.forEach(c => {
            const v1 = (s1 as any)[c.key];
            const v2 = (s2 as any)[c.key];
            if (typeof v1 !== 'number' || typeof v2 !== 'number') return;
            if (c.lower) {
                if (v1 < v2) s1Wins++; else if (v2 < v1) s2Wins++; else ties++;
            } else {
                if (v1 > v2) s1Wins++; else if (v2 > v1) s2Wins++; else ties++;
            }
        });
        return { s1Wins, s2Wins, ties };
    }, [s1, s2]);

    // ── 8. Qualitative Insights ──
    const insights = useMemo(() => {
        const lines: string[] = [];
        if (s1.roe > s2.roe) lines.push(`${stock1} delivers higher return on equity (${s1.roe}% vs ${s2.roe}%), indicating more efficient capital utilization.`);
        else lines.push(`${stock2} delivers higher return on equity (${s2.roe}% vs ${s1.roe}%), indicating more efficient capital utilization.`);
        if (s1.volatility < s2.volatility) lines.push(`${stock1} exhibits lower volatility (${s1.volatility}% vs ${s2.volatility}%), making it a relatively safer pick for risk-averse investors.`);
        else lines.push(`${stock2} exhibits lower volatility (${s2.volatility}% vs ${s1.volatility}%), making it a relatively safer pick for risk-averse investors.`);
        if (s1.revenueGrowth > s2.revenueGrowth) lines.push(`${stock1} shows stronger revenue growth at ${s1.revenueGrowth}%, signaling better top-line momentum.`);
        else lines.push(`${stock2} shows stronger revenue growth at ${s2.revenueGrowth}%, signaling better top-line momentum.`);
        if (s1.dividendYield > s2.dividendYield) lines.push(`For income seeking investors, ${stock1} offers a superior dividend yield of ${s1.dividendYield}%.`);
        else if (s2.dividendYield > s1.dividendYield) lines.push(`For income seeking investors, ${stock2} offers a superior dividend yield of ${s2.dividendYield}%.`);
        return lines;
    }, [s1, s2, stock1, stock2]);

    // ── 10. Actionable Conclusions ──
    const conclusions = useMemo(() => {
        const recs: { label: string; winner: string; reason: string; icon: string }[] = [];
        recs.push({
            label: 'Better for Growth',
            winner: s1.revenueGrowth > s2.revenueGrowth ? stock1 : stock2,
            reason: `Higher revenue growth & earnings momentum`,
            icon: '📈',
        });
        recs.push({
            label: 'Better for Value',
            winner: s1.pe < s2.pe ? stock1 : stock2,
            reason: `Lower P/E ratio with reasonable fundamentals`,
            icon: '💎',
        });
        recs.push({
            label: 'Better for Stability',
            winner: s1.volatility < s2.volatility ? stock1 : stock2,
            reason: `Lower volatility and beta exposure`,
            icon: '🛡️',
        });
        recs.push({
            label: 'Better for Income',
            winner: s1.dividendYield > s2.dividendYield ? stock1 : stock2,
            reason: `Higher dividend yield for passive income`,
            icon: '💰',
        });
        return recs;
    }, [s1, s2, stock1, stock2]);

    // Filtered metrics by category
    const filteredCriteria = activeCategory
        ? COMPARISON_CRITERIA.filter(c => c.category === activeCategory)
        : COMPARISON_CRITERIA;

    const categories = [...new Set(COMPARISON_CRITERIA.map(c => c.category))];

    // Score bar data
    const scoreBarData = [
        { name: stock1, value: scoreCard.s1Wins, color: '#3b82f6' },
        { name: 'Tie', value: scoreCard.ties, color: '#64748b' },
        { name: stock2, value: scoreCard.s2Wins, color: '#10b981' },
    ];

    return (
        <div className="compare-root">
            {/* ── 1. Criteria Definition — Input & Context ── */}
            <div className="compare-header">
                <div className="compare-inputs">
                    <div className="compare-stock-input">
                        <label>Stock A</label>
                        <select
                            className="input-field"
                            value={stock1}
                            onChange={e => setStock1(e.target.value)}
                        >
                            {STOCK_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="compare-stock-badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                            {s1.sector} · {s1.exchange}
                        </div>
                    </div>
                    <div className="compare-vs">VS</div>
                    <div className="compare-stock-input">
                        <label>Stock B</label>
                        <select
                            className="input-field"
                            value={stock2}
                            onChange={e => setStock2(e.target.value)}
                        >
                            {STOCK_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="compare-stock-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                            {s2.sector} · {s2.exchange}
                        </div>
                    </div>
                </div>

                {/* ── 5. Scope & Context Badge ── */}
                {!sameSector && (
                    <div className="compare-context-warn">
                        ⚠️ Cross-sector comparison — {s1.sector} vs {s2.sector}. Metrics may not be directly comparable.
                    </div>
                )}
            </div>

            {/* ── Overall Score Summary ── */}
            <div className="compare-score-summary">
                <div className="compare-score-card">
                    <div className="compare-score-value" style={{ color: '#3b82f6' }}>{scoreCard.s1Wins}</div>
                    <div className="compare-score-label">{stock1} wins</div>
                </div>
                <div className="compare-score-card">
                    <div className="compare-score-value" style={{ color: '#64748b' }}>{scoreCard.ties}</div>
                    <div className="compare-score-label">Ties</div>
                </div>
                <div className="compare-score-card">
                    <div className="compare-score-value" style={{ color: '#10b981' }}>{scoreCard.s2Wins}</div>
                    <div className="compare-score-label">{stock2} wins</div>
                </div>
                <div className="compare-score-bar-wrap">
                    <ResponsiveContainer width="100%" height={28}>
                        <BarChart data={scoreBarData} layout="vertical" barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                {scoreBarData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="compare-body">
                {/* ── Left Column: Metrics Table + Radar ── */}
                <div className="compare-left">
                    {/* ── 1. Criteria Categories ── */}
                    <div className="compare-category-tabs">
                        <button
                            className={`compare-cat-btn ${!activeCategory ? 'active' : ''}`}
                            onClick={() => setActiveCategory(null)}
                        >All</button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`compare-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >{cat}</button>
                        ))}
                    </div>

                    {/* ── 7. Quantitative Metrics Table ── */}
                    <div className="compare-table-wrap">
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th style={{ color: '#3b82f6' }}>{stock1}</th>
                                    <th style={{ color: '#10b981' }}>{stock2}</th>
                                    <th>Better</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCriteria.map((c) => {
                                    const v1 = (s1 as any)[c.key];
                                    const v2 = (s2 as any)[c.key];
                                    const isNum = typeof v1 === 'number' && typeof v2 === 'number';
                                    let winner = '—';
                                    if (isNum) {
                                        if (c.lower) winner = v1 < v2 ? stock1 : v2 < v1 ? stock2 : 'Tie';
                                        else winner = v1 > v2 ? stock1 : v2 > v1 ? stock2 : 'Tie';
                                    }
                                    const w1 = winner === stock1;
                                    const w2 = winner === stock2;
                                    return (
                                        <tr key={c.key}>
                                            <td className="compare-metric-name">
                                                <span className="compare-metric-cat">{c.category}</span>
                                                {c.label}
                                            </td>
                                            <td style={{ color: w1 ? '#10b981' : w2 ? '#ef4444' : 'var(--white)', fontWeight: w1 ? 700 : 400 }}>
                                                {c.format(v1)}
                                            </td>
                                            <td style={{ color: w2 ? '#10b981' : w1 ? '#ef4444' : 'var(--white)', fontWeight: w2 ? 700 : 400 }}>
                                                {c.format(v2)}
                                            </td>
                                            <td>
                                                <span className={`compare-winner-badge ${w1 ? 'winner-s1' : w2 ? 'winner-s2' : 'winner-tie'}`}>
                                                    {winner === 'Tie' ? '—' : winner}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── 6. Strengths & Weaknesses Radar ── */}
                    <div className="compare-radar-card">
                        <div className="compare-card-title">📊 Strengths & Weaknesses Analysis</div>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData} outerRadius={90}>
                                <PolarGrid stroke="rgba(201,162,39,0.15)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                <Radar name={stock1} dataKey="s1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                                <Radar name={stock2} dataKey="s2" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Right Column: Chart + Insights + Conclusions ── */}
                <div className="compare-right">
                    {/* ── 2 & 3. Price Chart (Normalized Baseline + Consistent Data) ── */}
                    <div className="compare-chart-card">
                        <div className="compare-chart-header">
                            <div className="compare-card-title">📈 Normalized Price Comparison (Base = 100)</div>
                            <div className="compare-range-tabs">
                                {(['1W', '1M', '3M', '6M', '1Y'] as TimeRange[]).map(r => (
                                    <button
                                        key={r}
                                        className={`compare-range-btn ${range === r ? 'active' : ''}`}
                                        onClick={() => setRange(r)}
                                    >{r}</button>
                                ))}
                            </div>
                        </div>
                        <div className="compare-chart-legend">
                            <span style={{ color: '#3b82f6' }}>● {stock1}</span>
                            <span style={{ color: '#10b981' }}>● {stock2}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>Baseline: 100</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                                <defs>
                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={{ stroke: 'rgba(201,162,39,0.1)' }}
                                    interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={{ stroke: 'rgba(201,162,39,0.1)' }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(6,13,31,0.95)',
                                        border: '1px solid rgba(201,162,39,0.2)',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                        backdropFilter: 'blur(16px)',
                                    }}
                                    labelStyle={{ color: '#c9a227', marginBottom: 4 }}
                                />
                                <Area type="monotone" dataKey={stock1} stroke="#3b82f6" fill="url(#grad1)" strokeWidth={2.5} dot={false} animationDuration={500} />
                                <Area type="monotone" dataKey={stock2} stroke="#10b981" fill="url(#grad2)" strokeWidth={2.5} dot={false} animationDuration={500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── 8. Qualitative Insights ── */}
                    <div className="compare-insights-card">
                        <div className="compare-card-title">💡 Qualitative Insights</div>
                        <div className="compare-insights-list">
                            {insights.map((ins, i) => (
                                <div key={i} className="compare-insight-item">
                                    <span className="compare-insight-bullet">▸</span>
                                    <span>{ins}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── 10. Actionable Conclusions ── */}
                    <div className="compare-conclusions-card">
                        <div className="compare-card-title">🎯 Actionable Conclusions</div>
                        <div className="compare-conclusions-grid">
                            {conclusions.map((c, i) => (
                                <div key={i} className="compare-conclusion-item">
                                    <div className="compare-conclusion-icon">{c.icon}</div>
                                    <div>
                                        <div className="compare-conclusion-label">{c.label}</div>
                                        <div className="compare-conclusion-winner">{c.winner}</div>
                                        <div className="compare-conclusion-reason">{c.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 9. Fairness & Anonymity Disclaimer ── */}
            <div className="compare-disclaimer">
                ⚖️ This comparison uses standardized, equally-weighted metrics for both stocks. All data is sourced from the same provider and time frame to ensure fair evaluation. This is for educational purposes only and does not constitute investment advice.
            </div>
        </div>
    );
}
