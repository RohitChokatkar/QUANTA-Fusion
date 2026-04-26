// PortfolioCard — Markowitz allocation pie chart
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
    weights: { symbol: string; weight: number }[];
    sharpe: number;
}

const COLORS = ['#c9a227', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899'];

export default function PortfolioCard({ weights, sharpe }: Props) {
    const data = weights.map((w) => ({
        name: w.symbol,
        value: parseFloat(w.weight.toFixed(1)),
    }));

    return (
        <div className="glass-card animate-in" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <span className="panel-title">Optimal Portfolio</span>
                </div>
                <span className="badge badge-gold">Sharpe {sharpe.toFixed(2)}</span>
            </div>

            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(6,13,31,0.95)',
                            border: '1px solid rgba(201,162,39,0.2)',
                            borderRadius: 8, fontSize: 12,
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: any) => `${value}%`) as any}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {weights.map((w, i) => (
                    <div key={w.symbol} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, color: 'var(--text)',
                    }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: 2,
                            background: COLORS[i % COLORS.length],
                        }} />
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{w.symbol}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{w.weight.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
