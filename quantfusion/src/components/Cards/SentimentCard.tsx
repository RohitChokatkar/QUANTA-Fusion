// SentimentCard — NLP sentiment bar + top headlines
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

export default function SentimentCard() {
    const sentiment = useSelector((s: RootState) => s.models.outputs.sentiment);

    if (!sentiment) {
        return (
            <div className="glass-card animate-in" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>📰</span>
                    <span className="panel-title">News Sentiment</span>
                </div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
        );
    }

    const barData = [
        { name: 'Positive', value: sentiment.breakdown.positive, color: '#10b981' },
        { name: 'Neutral', value: sentiment.breakdown.neutral, color: '#c9a227' },
        { name: 'Negative', value: sentiment.breakdown.negative, color: '#ef4444' },
    ];

    const scoreColor = sentiment.score > 60 ? '#10b981' : sentiment.score < 40 ? '#ef4444' : '#c9a227';

    return (
        <div className="glass-card animate-in" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📰</span>
                    <span className="panel-title">News Sentiment</span>
                </div>
                <div style={{
                    fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800,
                    color: scoreColor,
                }}>
                    {sentiment.score.toFixed(0)}
                </div>
            </div>

            {/* Sentiment bar chart */}
            <ResponsiveContainer width="100%" height={32}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        {barData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-dim)' }}>
                <span style={{ color: '#10b981' }}>+{sentiment.breakdown.positive.toFixed(0)}%</span>
                <span style={{ color: '#c9a227' }}>{sentiment.breakdown.neutral.toFixed(0)}%</span>
                <span style={{ color: '#ef4444' }}>-{sentiment.breakdown.negative.toFixed(0)}%</span>
            </div>

            {/* Headlines */}
            <div style={{ marginTop: 12 }}>
                {sentiment.positiveHeadlines.slice(0, 2).map((h, i) => (
                    <div key={`p${i}`} style={{
                        fontSize: 11, color: 'var(--text)', padding: '4px 0',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                    }}>
                        <span style={{ color: '#10b981', flexShrink: 0 }}>▲</span>
                        <span style={{ lineHeight: 1.4 }}>{h.slice(0, 80)}{h.length > 80 ? '…' : ''}</span>
                    </div>
                ))}
                {sentiment.negativeHeadlines.slice(0, 2).map((h, i) => (
                    <div key={`n${i}`} style={{
                        fontSize: 11, color: 'var(--text)', padding: '4px 0',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                    }}>
                        <span style={{ color: '#ef4444', flexShrink: 0 }}>▼</span>
                        <span style={{ lineHeight: 1.4 }}>{h.slice(0, 80)}{h.length > 80 ? '…' : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
