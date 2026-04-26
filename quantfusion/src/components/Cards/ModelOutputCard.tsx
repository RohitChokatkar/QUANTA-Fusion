// ModelOutputCard — animated display for individual model outputs
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import './ModelOutputCard.css';

interface Props {
    model: string;
    title: string;
    icon: string;
    color: string;
}

export default function ModelOutputCard({ model, title, icon, color }: Props) {
    const outputs = useSelector((s: RootState) => s.models.outputs);
    const data = (outputs as any)[model];
    const [timedOut, setTimedOut] = useState(false);

    // Show error state after 15s of no data
    useEffect(() => {
        if (data) {
            setTimedOut(false);
            return;
        }
        const timer = setTimeout(() => setTimedOut(true), 15000);
        return () => clearTimeout(timer);
    }, [data]);

    const renderContent = () => {
        if (!data && timedOut) {
            return (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 16, marginBottom: 6, opacity: 0.5 }}>⏳</div>
                    <div>Model data unavailable</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                        Waiting for backend computation…
                    </div>
                </div>
            );
        }
        if (!data) {
            return <div className="skeleton skeleton-text" style={{ width: '60%', height: 20 }} />;
        }

        switch (model) {
            case 'garch':
                return (
                    <>
                        <div className="moc-value" style={{ color }}>
                            {data.sigma}%
                        </div>
                        <div className="moc-label">
                            Predicted Vol · <span className={data.trend === 'rising' ? 'text-red' : data.trend === 'falling' ? 'text-green' : 'text-gold'}>
                                {data.trend === 'rising' ? '↑' : data.trend === 'falling' ? '↓' : '→'} {data.trend}
                            </span>
                        </div>
                    </>
                );

            case 'blackScholes':
                return (
                    <>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                                <div className="moc-mini-label">Call</div>
                                <div className="moc-value text-green">₹{data.callPrice.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="moc-mini-label">Put</div>
                                <div className="moc-value text-red">₹{data.putPrice.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="moc-greeks">
                            <span>Δ {data.delta.toFixed(3)}</span>
                            <span>Γ {data.gamma.toFixed(4)}</span>
                            <span>Θ {data.theta.toFixed(3)}</span>
                            <span>ν {data.vega.toFixed(3)}</span>
                        </div>
                    </>
                );

            case 'avellanedaStoikov':
                return (
                    <>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                                <div className="moc-mini-label">Bid</div>
                                <div className="moc-value text-green">₹{data.bidPrice.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="moc-mini-label">Ask</div>
                                <div className="moc-value text-red">₹{data.askPrice.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="moc-label">Spread: ₹{data.spread.toFixed(4)}</div>
                    </>
                );

            case 'kyle':
                return (
                    <>
                        <div className="moc-value" style={{ color }}>
                            λ = {data.lambda.toFixed(4)}
                        </div>
                        <div className="moc-label">
                            Informed: {data.informedPct.toFixed(1)}% · Toxicity: {(data.toxicity * 100).toFixed(0)}%
                        </div>
                    </>
                );

            case 'glostenMilgrom':
                return (
                    <>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                                <div className="moc-mini-label">Adverse Sel.</div>
                                <div className="moc-value text-red">₹{data.adverseSelection.toFixed(4)}</div>
                            </div>
                            <div>
                                <div className="moc-mini-label">Order Proc.</div>
                                <div className="moc-value text-blue">₹{data.orderProcessing.toFixed(4)}</div>
                            </div>
                        </div>
                    </>
                );

            case 'rlAgent':
                return (
                    <>
                        <div className={`moc-signal signal-${data.signal.toLowerCase()}`}>
                            {data.signal}
                        </div>
                        <div className="moc-label">
                            Confidence: {data.confidence.toFixed(1)}%
                        </div>
                        <div className="moc-confidence-bar">
                            <div
                                className="moc-confidence-fill"
                                style={{
                                    width: `${data.confidence}%`,
                                    backgroundColor: data.signal === 'BUY' ? '#10b981' :
                                        data.signal === 'SELL' ? '#ef4444' : '#c9a227',
                                }}
                            />
                        </div>
                    </>
                );

            default:
                return <div className="moc-label">No data</div>;
        }
    };

    return (
        <div className="glass-card moc-card animate-in">
            <div className="moc-header">
                <span className="moc-icon" style={{ background: `${color}15`, color }}>{icon}</span>
                <span className="moc-title">{title}</span>
            </div>
            {renderContent()}
        </div>
    );
}
