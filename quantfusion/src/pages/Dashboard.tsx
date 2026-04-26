// Dashboard — main page with chart, ticker tape, model cards, and sentiment (BSE/NSE/INR)
// Includes tabbed watchlist: Stocks / Indices / Forex with index summary cards
import { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setSymbol } from '../store/tickerSlice';
import { clearOutputs } from '../store/modelSlice';
import { useLivePrice } from '../hooks/useLivePrice';
import { useModelOutput } from '../hooks/useModelOutput';
import { useSentiment } from '../hooks/useSentiment';
import LiveChart from '../components/Chart/LiveChart';
import ModelOutputCard from '../components/Cards/ModelOutputCard';
import SentimentCard from '../components/Cards/SentimentCard';

// All NIFTY 50 constituent stocks
const NIFTY50_TICKERS = [
    'BSE:RELIANCE-EQ', 'BSE:TCS-EQ', 'BSE:HDFCBANK-EQ', 'BSE:ICICIBANK-EQ', 'BSE:INFY-EQ',
    'BSE:BHARTIARTL-EQ', 'BSE:ITC-EQ', 'BSE:SBIN-EQ', 'BSE:LT-EQ', 'BSE:HINDUNILVR-EQ',
    'BSE:BAJFINANCE-EQ', 'BSE:KOTAKBANK-EQ', 'BSE:AXISBANK-EQ', 'BSE:MARUTI-EQ', 'BSE:TITAN-EQ',
    'BSE:SUNPHARMA-EQ', 'BSE:TATAMOTORS-EQ', 'BSE:NTPC-EQ', 'BSE:ONGC-EQ', 'BSE:WIPRO-EQ',
    'BSE:HCLTECH-EQ', 'BSE:POWERGRID-EQ', 'BSE:ADANIENT-EQ', 'BSE:ADANIPORTS-EQ', 'BSE:ULTRACEMCO-EQ',
    'BSE:ASIANPAINT-EQ', 'BSE:COALINDIA-EQ', 'BSE:BAJAJ-AUTO-EQ', 'BSE:BAJAJFINSV-EQ', 'BSE:NESTLEIND-EQ',
    'BSE:JSWSTEEL-EQ', 'BSE:TATASTEEL-EQ', 'BSE:TECHM-EQ', 'BSE:GRASIM-EQ', 'BSE:INDUSINDBK-EQ',
    'BSE:HINDALCO-EQ', 'BSE:DRREDDY-EQ', 'BSE:M&M-EQ', 'BSE:CIPLA-EQ', 'BSE:EICHERMOT-EQ',
    'BSE:APOLLOHOSP-EQ', 'BSE:DIVISLAB-EQ', 'BSE:SBILIFE-EQ', 'BSE:BPCL-EQ', 'BSE:TATACONSUM-EQ',
    'BSE:BRITANNIA-EQ', 'BSE:HEROMOTOCO-EQ', 'BSE:HDFCLIFE-EQ', 'BSE:TRENT-EQ', 'BSE:SHRIRAMFIN-EQ',
];

// Major Indices
const INDICES_TICKERS = [
    'NSE:NIFTY50-INDEX',
    'BSE:SENSEX-INDEX',
    'NSE:NIFTYBANK-INDEX',
    'NSE:NIFTYIT-INDEX',
    'NSE:NIFTYNEXT50-INDEX',
    'NSE:NIFTYMIDCAP100-INDEX',
];

// Major Forex Pairs
const FOREX_TICKERS = [
    'USD/INR', 'EUR/USD', 'GBP/USD', 'JPY/USD',
    'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD',
    'EUR/INR', 'GBP/INR',
];

// Index summary cards data (static simulated)
const INDEX_SUMMARY = [
    { name: 'NIFTY 50', sym: 'NSE:NIFTY50-INDEX', value: 24050.60, change: +182.35, pct: +0.76 },
    { name: 'SENSEX', sym: 'BSE:SENSEX-INDEX', value: 77550.25, change: +512.90, pct: +0.67 },
    { name: 'BANK NIFTY', sym: 'NSE:NIFTYBANK-INDEX', value: 55912.75, change: -234.10, pct: -0.42 },
    { name: 'NIFTY IT', sym: 'NSE:NIFTYIT-INDEX', value: 34500.00, change: +156.80, pct: +0.46 },
];

// Forex summary cards data
const FOREX_SUMMARY = [
    { name: 'USD/INR', sym: 'USD/INR', value: 83.50, change: +0.12, pct: +0.14 },
    { name: 'EUR/USD', sym: 'EUR/USD', value: 1.085, change: -0.003, pct: -0.28 },
    { name: 'GBP/USD', sym: 'GBP/USD', value: 1.254, change: +0.005, pct: +0.40 },
];

type WatchlistTab = 'stocks' | 'indices' | 'forex';

function displayName(sym: string) {
    return sym.replace('BSE:', '').replace('NSE:', '').replace('-EQ', '').replace('-INDEX', '');
}

function getCurrencySymbol(sym: string) {
    if (sym.includes('/')) return ''; // forex — no currency prefix
    return '₹';
}

export default function Dashboard() {
    const dispatch = useDispatch();
    const { symbol, price, change, changePercent, high, low, volume, loading, error } = useSelector((s: RootState) => s.ticker);
    const garchOut = useSelector((s: RootState) => s.models.outputs.garch);
    const [searchValue, setSearchValue] = useState('');
    const [watchlistTab, setWatchlistTab] = useState<WatchlistTab>('stocks');

    useLivePrice();
    useModelOutput();
    useSentiment();

    const handleTickerClick = useCallback((sym: string) => {
        dispatch(clearOutputs());
        dispatch(setSymbol(sym));
    }, [dispatch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            const val = searchValue.trim().toUpperCase();
            // Detect if it's a forex pair (contains /)
            if (val.includes('/')) {
                handleTickerClick(val);
            } else {
                const bseSymbol = val.startsWith('BSE:') || val.startsWith('NSE:') ? val : `BSE:${val}-EQ`;
                handleTickerClick(bseSymbol);
            }
            setSearchValue('');
        }
    };

    // Detect symbol type for badge
    const isIndex = symbol.includes('-INDEX');
    const isForex = symbol.includes('/');
    const badgeLabel = isForex ? 'FOREX' : isIndex ? 'INDEX' : 'BSE';
    const badgeColor = isForex ? '#f59e0b' : isIndex ? '#3b82f6' : '#10b981';
    const currSym = getCurrencySymbol(symbol);

    // Get current watchlist items
    const watchlistItems = watchlistTab === 'stocks' ? NIFTY50_TICKERS
        : watchlistTab === 'indices' ? INDICES_TICKERS
        : FOREX_TICKERS;

    const watchlistTitle = watchlistTab === 'stocks' ? 'Watchlist'
        : watchlistTab === 'indices' ? 'Major Indices'
        : 'Spot Forex Pairs';

    return (
        <>
            {/* Ticker Tape */}
            <div className="ticker-tape">
                <div className="ticker-tape-inner">
                    {[...NIFTY50_TICKERS, ...INDICES_TICKERS, ...FOREX_TICKERS,
                      ...NIFTY50_TICKERS, ...INDICES_TICKERS, ...FOREX_TICKERS].map((sym, i) => (
                        <div
                            key={`${sym}-${i}`}
                            className="ticker-item"
                            onClick={() => handleTickerClick(sym)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="ticker-symbol">{displayName(sym)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ paddingTop: 36 }}>
                {/* ── Index & Forex Summary Cards ── */}
                <div className="index-summary-row">
                    {INDEX_SUMMARY.map(idx => (
                        <div
                            key={idx.sym}
                            className="index-summary-card"
                            onClick={() => handleTickerClick(idx.sym)}
                        >
                            <div className="index-summary-name">{idx.name}</div>
                            <div className="index-summary-value">{idx.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            <div className={`index-summary-change ${idx.change >= 0 ? 'positive' : 'negative'}`}>
                                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)} ({idx.pct >= 0 ? '+' : ''}{idx.pct.toFixed(2)}%)
                            </div>
                        </div>
                    ))}
                    {FOREX_SUMMARY.map(fx => (
                        <div
                            key={fx.sym}
                            className="index-summary-card forex-card"
                            onClick={() => handleTickerClick(fx.sym)}
                        >
                            <div className="index-summary-name">{fx.name}</div>
                            <div className="index-summary-value">{fx.value.toFixed(fx.value < 10 ? 4 : 2)}</div>
                            <div className={`index-summary-change ${fx.change >= 0 ? 'positive' : 'negative'}`}>
                                {fx.change >= 0 ? '▲' : '▼'} {Math.abs(fx.change).toFixed(fx.value < 10 ? 3 : 2)} ({fx.pct >= 0 ? '+' : ''}{fx.pct.toFixed(2)}%)
                            </div>
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800 }}>{displayName(symbol)}</h1>
                            {garchOut && (
                                <span className="badge badge-gold" style={{ animation: 'pulse-gold 2s infinite' }}>
                                    σ {garchOut.sigma}%
                                </span>
                            )}
                            <span className="badge" style={{ background: `${badgeColor}22`, color: badgeColor, fontSize: 10 }}>{badgeLabel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                            <span className="number-morph" style={{ fontSize: 24, fontWeight: 700 }}>
                                {currSym}{price.toFixed(isForex ? 4 : 2)}
                            </span>
                            <span className={`number-morph ${change >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: 14 }}>
                                {change >= 0 ? '+' : ''}{change.toFixed(isForex ? 4 : 2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                            </span>
                            {loading && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Loading…</span>}
                        </div>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="input-field"
                            placeholder="Search ticker or forex…"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            style={{ width: 180 }}
                        />
                        <button className="btn-gold" type="submit">Go</button>
                    </form>
                </div>

                {error === 'token_expired' && (
                    <div style={{
                        padding: '12px 16px', marginBottom: 16, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                        border: '1px solid rgba(245,158,11,0.25)',
                        color: '#f59e0b', fontSize: 13, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 10,
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <span style={{ fontSize: 18 }}>⏳</span>
                        <div>
                            <div style={{ fontWeight: 700 }}>Market data refreshing</div>
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                                Live data is temporarily unavailable. Using cached/demo data in the meantime.
                            </div>
                        </div>
                    </div>
                )}

                {error && error !== 'token_expired' && (
                    <div style={{
                        padding: '10px 16px', marginBottom: 16, borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <span>⚠ {error}</span>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer',
                                fontSize: 11, fontWeight: 600,
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats bar */}
                <div className="grid-4" style={{ marginBottom: 20 }}>
                    {[
                        { label: 'High', value: `${currSym}${high.toFixed(isForex ? 4 : 2)}`, color: 'var(--green)' },
                        { label: 'Low', value: `${currSym}${low.toFixed(isForex ? 4 : 2)}`, color: 'var(--red)' },
                        { label: 'Volume', value: volume > 1e6 ? `${(volume / 1e6).toFixed(1)}M` : volume > 1e3 ? `${(volume / 1e3).toFixed(1)}K` : volume.toLocaleString(), color: 'var(--blue)' },
                        { label: 'Volatility', value: garchOut ? `${garchOut.sigma}%` : '—', color: 'var(--gold)' },
                    ].map(stat => (
                        <div key={stat.label} className="glass-card" style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
                            <div className="number-morph" style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Main content grid */}
                <div className="dashboard-grid">
                    <div className="dashboard-main">
                        <LiveChart />

                        {/* Model output cards */}
                        <div className="grid-3">
                            <ModelOutputCard model="garch" title="GARCH(1,1)" icon="σ" color="#c9a227" />
                            <ModelOutputCard model="avellanedaStoikov" title="Avellaneda-Stoikov" icon="⇄" color="#10b981" />
                            <ModelOutputCard model="kyle" title="Kyle Model" icon="λ" color="#3b82f6" />
                            <ModelOutputCard model="blackScholes" title="Black-Scholes" icon="Δ" color="#8b5cf6" />
                            <ModelOutputCard model="glostenMilgrom" title="Glosten-Milgrom" icon="⊘" color="#06b6d4" />
                            <ModelOutputCard model="rlAgent" title="RL Agent" icon="🤖" color="#f59e0b" />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="dashboard-sidebar">
                        <SentimentCard />

                        {/* Tabbed Watchlist */}
                        <div className="panel">
                            <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                                <span className="panel-title">{watchlistTitle}</span>
                                {/* Tab Switcher */}
                                <div style={{
                                    display: 'flex', gap: 4, background: 'rgba(201,162,39,0.05)',
                                    borderRadius: 8, padding: 3,
                                }}>
                                    {([
                                        { key: 'stocks' as WatchlistTab, label: '📊 Stocks', count: NIFTY50_TICKERS.length },
                                        { key: 'indices' as WatchlistTab, label: '📈 Indices', count: INDICES_TICKERS.length },
                                        { key: 'forex' as WatchlistTab, label: '💱 Forex', count: FOREX_TICKERS.length },
                                    ]).map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setWatchlistTab(tab.key)}
                                            style={{
                                                flex: 1,
                                                padding: '6px 8px',
                                                fontSize: 11,
                                                fontWeight: watchlistTab === tab.key ? 700 : 500,
                                                borderRadius: 6,
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: watchlistTab === tab.key
                                                    ? 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.1))'
                                                    : 'transparent',
                                                color: watchlistTab === tab.key ? 'var(--gold)' : 'var(--text-dim)',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                {watchlistItems.map(sym => (
                                    <div
                                        key={sym}
                                        onClick={() => handleTickerClick(sym)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 16px', cursor: 'pointer',
                                            borderBottom: '1px solid var(--border)',
                                            background: sym === symbol ? 'rgba(201,162,39,0.07)' : 'transparent',
                                            borderLeft: sym === symbol ? '2px solid var(--gold)' : '2px solid transparent',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { if (sym !== symbol) (e.currentTarget.style.background = 'rgba(201,162,39,0.04)'); }}
                                        onMouseLeave={e => { if (sym !== symbol) (e.currentTarget.style.background = 'transparent'); }}
                                    >
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{displayName(sym)}</span>
                                        <span style={{
                                            fontSize: 10,
                                            color: watchlistTab === 'indices' ? '#3b82f6'
                                                 : watchlistTab === 'forex' ? '#f59e0b'
                                                 : 'var(--text-dim)',
                                        }}>
                                            {watchlistTab === 'indices' ? '📈' : watchlistTab === 'forex' ? '💱' : '→'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
