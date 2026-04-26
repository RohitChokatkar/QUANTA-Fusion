// ComparePage — Standalone stock comparison page with metrics table + price history chart
import CompareWidget from '../components/Tools/CompareWidget';

export default function ComparePage() {
    return (
        <div className="animate-in" style={{ paddingTop: 36 }}>
            <div className="section-header">
                <div className="section-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>⚖️</div>
                <div>
                    <h2 className="section-title">Stock Comparison</h2>
                    <p className="section-sub">Compare two BSE stocks side-by-side — metrics, fundamentals, and price history</p>
                </div>
            </div>

            <div className="panel" style={{ padding: 24, minHeight: 400 }}>
                <CompareWidget />
            </div>
        </div>
    );
}
