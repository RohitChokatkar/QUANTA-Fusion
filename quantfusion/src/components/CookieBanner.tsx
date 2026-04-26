// CookieBanner — disclaimer/cookie consent banner
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('qf-cookie-dismissed');
    if (!dismissed) {
      // Delay appearance for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('qf-cookie-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <strong>Disclaimer:</strong> QuantFusion is an analytical and educational platform.
          It does not constitute investment advice. All quantitative model outputs are for research purposes only.
          By continuing, you accept our terms.
        </div>
        <div className="cookie-banner-actions">
          <button className="btn-gold" onClick={dismiss} style={{ padding: '8px 20px', fontSize: 12 }}>Accept</button>
        </div>
      </div>
    </div>
  );
}
