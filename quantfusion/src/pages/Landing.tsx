// Landing — Premium hero page for QuantFusion
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: 'σ', title: 'GARCH Volatility', desc: 'Forecast tomorrow\'s volatility using GARCH(1,1) with the arch library on 60-day BSE history.', color: '#c9a227' },
  { icon: 'Δ', title: 'Options Pricing', desc: 'Black-Scholes-Merton pricing with Greeks + Heston stochastic vol surface for BSE options.', color: '#8b5cf6' },
  { icon: '⇄', title: 'Market Making', desc: 'Avellaneda-Stoikov optimal bid/ask spread overlay powered by live BSE tick data.', color: '#10b981' },
  { icon: 'λ', title: 'Kyle Model', desc: 'Informed-flow estimator classifying BSE buy vs sell-initiated trades in real-time.', color: '#3b82f6' },
  { icon: '⊘', title: 'Glosten-Milgrom', desc: 'Spread decomposition into adverse selection + order processing components.', color: '#06b6d4' },
  { icon: '🤖', title: 'RL Agent', desc: 'Reinforcement learning agent (PPO) trained on BSE data — outputs BUY / HOLD / SELL signals.', color: '#f59e0b' },
  { icon: '📊', title: 'Portfolio Optimizer', desc: 'Markowitz mean-variance optimization with efficient frontier for 2-5 BSE stocks.', color: '#ec4899' },
  { icon: '📈', title: 'Execution Planner', desc: 'Almgren-Chriss execution schedule for large BSE block orders with impact cost analysis.', color: '#14b8a6' },
];

const STATS = [
  { value: '10', label: 'Quant Models' },
  { value: '25+', label: 'Years BSE Data' },
  { value: '<1s', label: 'Model Latency' },
  { value: '24/7', label: 'Analytics' },
];

const WORKFLOW = [
  { step: '01', title: 'Select BSE Stock', desc: 'Choose from BSE-listed stocks like RELIANCE, TCS, INFY and more. Real-time data via Fyers API.' },
  { step: '02', title: 'Run Models', desc: 'All 10 quant models execute simultaneously — volatility, pricing, microstructure, and signals.' },
  { step: '03', title: 'Analyse Output', desc: 'View model cards, sentiment analysis, and live chart overlays — all in INR with IST timestamps.' },
  { step: '04', title: 'Optimize & Act', desc: 'Build portfolios on the efficient frontier, plan execution schedules, and follow RL agent signals.' },
];

export default function Landing() {
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="landing" onMouseMove={handleMouseMove}>
      {/* Animated background */}
      <div className="landing-bg">
        <div className="landing-grid-lines" />
        <div className="landing-glow" style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(201,162,39,0.06), transparent 60%)`,
        }} />
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      {/* Hero */}
      <section className={`landing-hero ${loaded ? 'landing-visible' : ''}`}>
        <div className="landing-badge-row">
          <span className="badge badge-gold">v2.0</span>
          <span className="landing-badge-text">Python + C++ + TypeScript Architecture</span>
        </div>
        <h1 className="landing-headline">
          <span className="landing-headline-line">Quantitative Finance</span>
          <span className="landing-headline-gradient">Meets Real-Time Intelligence</span>
        </h1>
        <p className="landing-subline">
          10 institutional-grade quant models running simultaneously on BSE live data.
          GARCH volatility, Black-Scholes pricing, market microstructure analysis, and AI-powered signals — all in one platform.
        </p>
        <div className="landing-cta-row">
          <Link to="/dashboard" className="btn-gold landing-cta-primary">
            Launch Dashboard →
          </Link>
          <Link to="/about" className="btn-outline landing-cta-secondary">
            Learn More
          </Link>
        </div>


      </section>

      {/* Stats */}
      <section className="landing-stats">
        {STATS.map(s => (
          <div key={s.label} className="landing-stat-item">
            <div className="landing-stat-value">{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features grid */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">CAPABILITIES</span>
          <h2 className="landing-section-title">Institutional-Grade Models</h2>
          <p className="landing-section-sub">Every model runs in Python with battle-tested scientific libraries — not approximations.</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="landing-feature-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="landing-feature-icon" style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
              <div className="landing-feature-accent" style={{ background: f.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">WORKFLOW</span>
          <h2 className="landing-section-title">How It Works</h2>
          <p className="landing-section-sub">From stock selection to actionable insights in under 10 seconds.</p>
        </div>
        <div className="landing-workflow">
          {WORKFLOW.map((w, i) => (
            <div key={w.step} className="landing-workflow-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="landing-workflow-step">{w.step}</div>
              <div className="landing-workflow-content">
                <h3 className="landing-workflow-title">{w.title}</h3>
                <p className="landing-workflow-desc">{w.desc}</p>
              </div>
              {i < WORKFLOW.length - 1 && <div className="landing-workflow-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">ARCHITECTURE</span>
          <h2 className="landing-section-title">Three-Language Stack</h2>
          <p className="landing-section-sub">Each language does what it does best — no compromises.</p>
        </div>
        <div className="landing-arch-grid">
          <div className="landing-arch-card">
            <div className="landing-arch-lang" style={{ color: '#3b82f6' }}>C++</div>
            <div className="landing-arch-role">Speed Layer</div>
            <p className="landing-arch-desc">Microsecond tick parsing, BSE feed handler, level-2 order book, ZeroMQ publisher</p>
            <div className="landing-arch-tag-row">
              <span className="landing-arch-tag">ZeroMQ</span>
              <span className="landing-arch-tag">Boost.Asio</span>
              <span className="landing-arch-tag">spdlog</span>
            </div>
          </div>
          <div className="landing-arch-card">
            <div className="landing-arch-lang" style={{ color: '#10b981' }}>Python</div>
            <div className="landing-arch-role">Model Engine</div>
            <p className="landing-arch-desc">All 10 quant models, Fyers API integration, NLP sentiment, FastAPI server, Firebase write</p>
            <div className="landing-arch-tag-row">
              <span className="landing-arch-tag">FastAPI</span>
              <span className="landing-arch-tag">arch</span>
              <span className="landing-arch-tag">scipy</span>
              <span className="landing-arch-tag">SB3</span>
            </div>
          </div>
          <div className="landing-arch-card">
            <div className="landing-arch-lang" style={{ color: '#c9a227' }}>TypeScript</div>
            <div className="landing-arch-role">UI Layer</div>
            <p className="landing-arch-desc">React 18 SPA, Recharts live visualisation, Redux state, Firebase Hosting deploy</p>
            <div className="landing-arch-tag-row">
              <span className="landing-arch-tag">React 18</span>
              <span className="landing-arch-tag">Recharts</span>
              <span className="landing-arch-tag">Redux</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-cta-glow" />
        <h2 className="landing-cta-title">Ready to Analyse BSE Markets?</h2>
        <p className="landing-cta-sub">Open the dashboard, type a BSE ticker, and watch all 10 models light up.</p>
        <Link to="/dashboard" className="btn-gold landing-cta-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
          Open Dashboard →
        </Link>
      </section>
    </div>
  );
}
