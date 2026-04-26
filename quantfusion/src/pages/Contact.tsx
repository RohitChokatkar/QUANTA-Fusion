// Contact — feedback and contact form
import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: 'general', message: '' });
    }, 1200);
  };

  return (
    <div className="animate-in contact-page">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227' }}>✉</div>
        <div>
          <h1 className="section-title">Get in Touch</h1>
          <p className="section-sub">Have questions, feedback, or feature requests? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="contact-grid">
        {/* Form */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Send a Message</span></div>
          <div className="panel-body">
            {submitted ? (
              <div className="contact-success">
                <div className="contact-success-icon">✓</div>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you soon.</p>
                <button className="btn-outline" onClick={() => setSubmitted(false)} style={{ marginTop: 16 }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-label">Name</label>
                    <input className="input-field" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-label">Email</label>
                    <input className="input-field" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="contact-form-group">
                  <label className="contact-label">Subject</label>
                  <select className="select-field" name="subject" value={form.subject} onChange={handleChange}>
                    <option value="general">General Enquiry</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="model">Model Question</option>
                    <option value="api">API / Data Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="contact-form-group">
                  <label className="contact-label">Message</label>
                  <textarea
                    className="input-field contact-textarea"
                    name="message" value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your question, feedback, or issue…"
                    rows={6}
                    required
                  />
                </div>
                <button className="btn-gold" type="submit" disabled={sending} style={{ width: '100%' }}>
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="contact-info-col">
          <div className="glass-card contact-info-card">
            <div className="contact-info-icon">📍</div>
            <h3 className="contact-info-title">Location</h3>
            <p className="contact-info-text">India — BSE Market Hours<br/>9:15 AM – 3:30 PM IST</p>
          </div>
          <div className="glass-card contact-info-card">
            <div className="contact-info-icon">📧</div>
            <h3 className="contact-info-title">Email</h3>
            <p className="contact-info-text"><a href="mailto:quantafusion0000@gmail.com" style={{ color: 'var(--gold)', textDecoration: 'none' }}>quantafusion0000@gmail.com</a></p>
          </div>
          <div className="glass-card contact-info-card">
            <div className="contact-info-icon">⚡</div>
            <h3 className="contact-info-title">Response Time</h3>
            <p className="contact-info-text">Typically within 24 hours<br/>on business days</p>
          </div>
          <div className="glass-card contact-info-card">
            <div className="contact-info-icon">🔗</div>
            <h3 className="contact-info-title">Connect</h3>
            <div className="contact-social-row">
              <a href="#" className="contact-social-link">GitHub</a>
              <a href="#" className="contact-social-link">Twitter</a>
              <a href="#" className="contact-social-link">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="contact-faq">
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Frequently Asked Questions</h2>
        <div className="contact-faq-grid">
          {[
            { q: 'Is QuantFusion free to use?', a: 'Yes. The platform is free. You need a Fyers demat account (also free) for live BSE data access.' },
            { q: 'Which stocks are supported?', a: 'All BSE-listed equities. Use the Fyers format: BSE:SYMBOL-EQ (e.g. BSE:RELIANCE-EQ).' },
            { q: 'How accurate are the models?', a: 'Models use the same mathematical frameworks and libraries as institutional desks. Accuracy depends on market conditions.' },
            { q: 'Can I use this for algo trading?', a: 'QuantFusion is an analytical platform. The RL Agent signals are informational — always apply your own judgement.' },
          ].map(faq => (
            <div key={faq.q} className="glass-card" style={{ padding: '16px 20px' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>{faq.q}</h4>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
