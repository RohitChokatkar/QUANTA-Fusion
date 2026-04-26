// 404 Not Found page
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-glow" />
      <div className="notfound-code">404</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-sub">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="notfound-actions">
        <Link to="/" className="btn-gold">← Back to Home</Link>
        <Link to="/dashboard" className="btn-outline">Open Dashboard</Link>
      </div>
      <div className="notfound-hint">
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Try one of these:</span>
        <div className="notfound-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/options">Options</Link>
          <Link to="/glossary">Glossary</Link>
        </div>
      </div>
    </div>
  );
}
