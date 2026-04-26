// About — platform overview and model descriptions
import { Link } from 'react-router-dom';

const MODELS = [
  { name: 'GARCH(1,1)', icon: 'σ', color: '#c9a227', lib: 'arch', desc: 'Forecasts next-day BSE volatility using 60-day closing prices. The arch library provides maximum-likelihood estimation far more accurate than any JS approximation.' },
  { name: 'Black-Scholes-Merton', icon: 'Δ', color: '#8b5cf6', lib: 'scipy', desc: 'Prices European call/put options on BSE stocks in INR. Uses GARCH vol and Vasicek risk-free rate as inputs. Computes all five Greeks per tick.' },
  { name: 'Heston Model', icon: '∿', color: '#ec4899', lib: 'numpy', desc: 'Stochastic volatility surface for BSE options. Generates the vol smile/skew across strikes and expiries using 25-year Fyers historical data.' },
  { name: 'Avellaneda-Stoikov', icon: '⇄', color: '#10b981', lib: 'numpy', desc: 'Optimal market-making framework computing bid/ask overlays accounting for inventory risk and GARCH sigma. Updates every 1 second on BSE ticks.' },
  { name: 'Kyle Model', icon: 'λ', color: '#3b82f6', lib: 'numpy', desc: 'Estimates price-impact lambda from BSE order flow. Classifies buy vs sell-initiated trades and computes VPIN toxicity score.' },
  { name: 'Glosten-Milgrom', icon: '⊘', color: '#06b6d4', lib: 'numpy', desc: 'Decomposes real-time BSE bid-ask spread into adverse selection and order processing components using Kyle flow as input.' },
  { name: 'Markowitz MVO', icon: '◎', color: '#f97316', lib: 'scipy.optimize', desc: 'Mean-variance optimisation for 2-5 BSE stocks. Computes efficient frontier, optimal weights, and Sharpe ratio using scipy.optimize.minimize.' },
  { name: 'Almgren-Chriss', icon: '◷', color: '#14b8a6', lib: 'numpy', desc: 'Optimal execution schedule for large BSE block orders. Models impact cost and generates lots-per-hour plans using intraday BSE volume profiles.' },
  { name: 'Vasicek / CIR', icon: '〰', color: '#a855f7', lib: 'numpy', desc: 'Mean-reverting interest rate model on RBI Repo Rate. Forecasts 12-month INR rate curve that feeds into BSM option pricing.' },
  { name: 'RL Agent', icon: '🤖', color: '#f59e0b', lib: 'stable-baselines3', desc: 'PPO-trained reinforcement learning agent using GARCH vol, Kyle lambda, sentiment, and 5-day BSE momentum. Outputs BUY/HOLD/SELL every 60s.' },
];

const DATA_SOURCES = [
  { name: 'Fyers API', desc: 'BSE WebSocket live ticks, historical OHLCV (25yr), real-time quotes', badge: 'Primary' },
  { name: 'RBI DBIE API', desc: 'Repo rate history for Vasicek/CIR interest rate modelling', badge: 'Rates' },
  { name: 'NewsAPI India', desc: 'English + Hindi Indian financial news for VADER NLP sentiment', badge: 'Sentiment' },
  { name: 'Alpha Vantage', desc: 'BSE fundamentals for the comparison tab', badge: 'Fundamentals' },
  { name: 'Firebase', desc: 'Realtime Database for persisting model outputs every 10s', badge: 'Storage' },
];

export default function About() {
  return (
    <div className="animate-in about-page">
      {/* Hero */}
      <section className="about-hero">
        <span className="landing-section-tag">ABOUT THE PLATFORM</span>
        <h1 className="about-hero-title">QuantFusion <span className="text-gold">v2.0</span></h1>
        <p className="about-hero-sub">
          A three-language quantitative finance platform built for the Indian BSE market.
          Python runs all 10 models, C++ handles microsecond tick processing, and TypeScript/React delivers the interactive UI.
        </p>
      </section>

      {/* Mission */}
      <section className="about-section">
        <div className="glass-card about-mission-card">
          <div className="about-mission-icon">⚡</div>
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Our Mission</h2>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8 }}>
              QuantFusion brings institutional-grade quantitative analysis to individual investors.
              We believe every trader deserves access to the same mathematical models used by hedge funds —
              without needing a PhD in financial engineering or a Bloomberg terminal subscription.
              Every model is computed in Python with battle-tested scientific libraries, not JavaScript approximations.
            </p>
          </div>
        </div>
      </section>

      {/* 10 Models */}
      <section className="about-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">ALL 10 MODELS</span>
          <h2 className="landing-section-title">Quantitative Model Suite</h2>
          <p className="landing-section-sub">Each model is independently computed in Python and streamed to the React UI via FastAPI WebSocket.</p>
        </div>
        <div className="about-models-grid">
          {MODELS.map((m, i) => (
            <div key={m.name} className="about-model-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="about-model-header">
                <div className="about-model-icon" style={{ background: `${m.color}18`, color: m.color }}>{m.icon}</div>
                <div>
                  <h3 className="about-model-name">{m.name}</h3>
                  <span className="about-model-lib">{m.lib}</span>
                </div>
              </div>
              <p className="about-model-desc">{m.desc}</p>
              <div className="about-model-accent" style={{ background: m.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="about-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">DATA PIPELINE</span>
          <h2 className="landing-section-title">Data Sources</h2>
          <p className="landing-section-sub">Real-time and historical data from multiple authoritative sources.</p>
        </div>
        <div className="about-data-grid">
          {DATA_SOURCES.map(d => (
            <div key={d.name} className="glass-card about-data-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>{d.name}</span>
                <span className="badge badge-gold">{d.badge}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">TECHNOLOGY</span>
          <h2 className="landing-section-title">Built With</h2>
        </div>
        <div className="about-tech-row">
          {[
            'React 18', 'TypeScript', 'Python', 'C++', 'FastAPI', 'Redux Toolkit',
            'Recharts', 'Firebase', 'ZeroMQ', 'Vite', 'scipy', 'stable-baselines3',
          ].map(t => (
            <span key={t} className="about-tech-chip">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Ready to explore?</h2>
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20 }}>Jump into the dashboard and start analysing BSE stocks.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard" className="btn-gold">Launch Dashboard</Link>
          <Link to="/contact" className="btn-outline">Get in Touch</Link>
        </div>
      </section>
    </div>
  );
}
