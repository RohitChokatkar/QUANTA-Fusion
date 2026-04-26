// NewsPage — Full-page news view with National & International tabs
import { useState } from 'react';

interface NewsItem {
    id: number;
    title: string;
    source: string;
    time: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    summary: string;
}

const NATIONAL_NEWS: NewsItem[] = [
    { id: 1, title: 'Sensex surges 450 points on strong Q4 earnings expectations', source: 'Economic Times', time: '2h ago', sentiment: 'positive', summary: 'Indian benchmark indices rallied sharply as institutional investors increased buying in banking and IT sectors ahead of quarterly results.' },
    { id: 2, title: 'RBI keeps repo rate unchanged at 6.5% in latest MPC meeting', source: 'Mint', time: '3h ago', sentiment: 'neutral', summary: 'The Reserve Bank of India maintained its stance on interest rates, citing the need to balance growth and inflation targets.' },
    { id: 3, title: 'Reliance Industries announces ₹75,000 Cr green energy investment', source: 'NDTV Profit', time: '4h ago', sentiment: 'positive', summary: 'RIL plans to accelerate its renewable energy transition with new solar, hydrogen, and battery manufacturing facilities across Gujarat.' },
    { id: 4, title: 'IT sector faces headwinds as US clients delay decision-making', source: 'Business Standard', time: '5h ago', sentiment: 'negative', summary: 'Major IT companies report slower deal closures as macroeconomic uncertainty in the US leads to cautious technology spending.' },
    { id: 5, title: 'India\'s GDP growth forecast revised upward to 7.2% by IMF', source: 'Reuters India', time: '6h ago', sentiment: 'positive', summary: 'International Monetary Fund raises India growth outlook citing strong domestic consumption and government infrastructure spending.' },
    { id: 6, title: 'SEBI introduces new framework for algorithmic trading in retail', source: 'Moneycontrol', time: '7h ago', sentiment: 'neutral', summary: 'Market regulator SEBI has unveiled a new framework allowing retail investors to participate in algorithmic trading with additional safeguards.' },
    { id: 7, title: 'Auto sector records 15% YoY growth in March sales figures', source: 'ET Auto', time: '8h ago', sentiment: 'positive', summary: 'Passenger vehicle and two-wheeler segments continue their growth trajectory, with EV adoption also seeing strong traction.' },
    { id: 8, title: 'PSU bank stocks rally after strong NPA recovery announcements', source: 'Economic Times', time: '9h ago', sentiment: 'positive', summary: 'State-owned banks see renewed investor interest as asset quality improves and provisions for bad loans decrease significantly.' },
    { id: 9, title: 'Rupee weakens past 83.50 against dollar on FII outflows', source: 'CNBC TV18', time: '10h ago', sentiment: 'negative', summary: 'The Indian rupee remained under pressure as foreign institutional investors pulled out ₹2,400 Cr from Indian equities.' },
    { id: 10, title: 'Adani Group completes debt reduction target six months early', source: 'Mint', time: '12h ago', sentiment: 'positive', summary: 'Adani Group has repaid over $5 billion in debt, strengthening its balance sheet ahead of planned infrastructure expansion.' },
];

const INTERNATIONAL_NEWS: NewsItem[] = [
    { id: 101, title: 'Fed signals potential rate cuts in September amid cooling inflation', source: 'Bloomberg', time: '1h ago', sentiment: 'positive', summary: 'Federal Reserve Chair hinted at possible easing as US CPI data shows continued decline toward the 2% target.' },
    { id: 102, title: 'NVIDIA crosses $3 Trillion market cap on AI chip demand surge', source: 'CNBC', time: '2h ago', sentiment: 'positive', summary: 'The chipmaker becomes the world\'s most valuable company as enterprise AI adoption accelerates globally.' },
    { id: 103, title: 'China\'s manufacturing PMI contracts for second consecutive month', source: 'Reuters', time: '3h ago', sentiment: 'negative', summary: 'Economic recovery in China continues to stall, raising concerns about global commodity demand and supply chain impacts.' },
    { id: 104, title: 'European Central Bank cuts rates by 25 basis points', source: 'Financial Times', time: '4h ago', sentiment: 'positive', summary: 'The ECB begins its easing cycle as eurozone inflation moderates, providing relief to struggling economies.' },
    { id: 105, title: 'Oil prices spike 3% after OPEC+ extends production cuts', source: 'Bloomberg', time: '5h ago', sentiment: 'negative', summary: 'Brent crude rises above $85/barrel as OPEC+ agrees to extend voluntary production cuts through Q3.' },
    { id: 106, title: 'Bitcoin surpasses $75,000 on institutional ETF inflows', source: 'CoinDesk', time: '6h ago', sentiment: 'positive', summary: 'Spot Bitcoin ETFs continue to attract record inflows, pushing the cryptocurrency to new all-time highs.' },
    { id: 107, title: 'Japan ends negative interest rate era, BOJ raises rates to 0.25%', source: 'Nikkei Asia', time: '8h ago', sentiment: 'neutral', summary: 'Bank of Japan makes a historic policy shift, raising rates for the first time in 17 years.' },
    { id: 108, title: 'Apple announces $110 Billion share buyback, largest in US history', source: 'Wall Street Journal', time: '9h ago', sentiment: 'positive', summary: 'The tech giant reaffirms its commitment to returning value to shareholders with record capital return program.' },
    { id: 109, title: 'Global semiconductor shortage eases as new fabs come online', source: 'TechCrunch', time: '10h ago', sentiment: 'positive', summary: 'New manufacturing facilities in Taiwan, US, and Germany begin production, addressing years of chip supply constraints.' },
    { id: 110, title: 'UK economy narrowly avoids recession with 0.1% Q4 growth', source: 'BBC Business', time: '12h ago', sentiment: 'neutral', summary: 'The British economy shows resilience despite tight monetary policy, but outlook remains uncertain.' },
];

const sentimentColor = (s: string) => s === 'positive' ? '#10b981' : s === 'negative' ? '#ef4444' : '#c9a227';
const sentimentIcon = (s: string) => s === 'positive' ? '▲' : s === 'negative' ? '▼' : '●';
const sentimentLabel = (s: string) => s === 'positive' ? 'Bullish' : s === 'negative' ? 'Bearish' : 'Neutral';

export default function NewsPage() {
    const [tab, setTab] = useState<'national' | 'international'>('national');
    const news = tab === 'national' ? NATIONAL_NEWS : INTERNATIONAL_NEWS;

    const positiveCount = news.filter(n => n.sentiment === 'positive').length;
    const negativeCount = news.filter(n => n.sentiment === 'negative').length;
    const neutralCount = news.filter(n => n.sentiment === 'neutral').length;

    return (
        <div className="animate-in" style={{ paddingTop: 36 }}>
            <div className="section-header">
                <div className="section-icon" style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227' }}>📰</div>
                <div>
                    <h1 className="section-title">Market News</h1>
                    <p className="section-sub">Latest financial news from India and around the world.</p>
                </div>
            </div>

            {/* Tabs + Sentiment Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className={tab === 'national' ? 'btn-gold' : 'btn-outline'}
                        onClick={() => setTab('national')}
                        style={{ padding: '8px 20px', fontSize: 14 }}
                    >
                        🇮🇳 National
                    </button>
                    <button
                        className={tab === 'international' ? 'btn-gold' : 'btn-outline'}
                        onClick={() => setTab('international')}
                        style={{ padding: '8px 20px', fontSize: 14 }}
                    >
                        🌍 International
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: 'var(--mono)' }}>
                    <span style={{ color: '#10b981' }}>▲ Bullish: {positiveCount}</span>
                    <span style={{ color: '#ef4444' }}>▼ Bearish: {negativeCount}</span>
                    <span style={{ color: '#c9a227' }}>● Neutral: {neutralCount}</span>
                </div>
            </div>

            {/* News Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                {news.map((item) => (
                    <div key={item.id} className="panel" style={{ padding: 0, overflow: 'hidden', transition: 'all 0.2s' }}>
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                        fontFamily: 'var(--mono)',
                                        background: `${sentimentColor(item.sentiment)}15`,
                                        color: sentimentColor(item.sentiment),
                                    }}
                                >
                                    {sentimentIcon(item.sentiment)} {sentimentLabel(item.sentiment)}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {item.source}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
                                    {item.time}
                                </span>
                            </div>
                            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--white)', lineHeight: 1.4, marginBottom: 8 }}>
                                {item.title}
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>
                                {item.summary}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer info */}
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST · Auto-refreshes every 15 min
            </div>
        </div>
    );
}
