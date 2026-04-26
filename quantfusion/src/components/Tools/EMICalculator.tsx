import { useState } from 'react';

export default function EMICalculator() {
    const [amount, setAmount] = useState<number>(500000);
    const [rate, setRate] = useState<number>(8.5);
    const [years, setYears] = useState<number>(5);

    const r = rate / 12 / 100;
    const n = years * 12;
    const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - amount;

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--display)', marginBottom: 16 }}>EMI Calculator</h2>
            <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Loan Amount (₹)</label>
                        <input className="input-field" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Interest Rate (%)</label>
                        <input className="input-field" type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Tenure (Years)</label>
                        <input className="input-field" type="number" value={years} onChange={e => setYears(Number(e.target.value))} />
                    </div>
                </div>
                
                <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Monthly EMI</div>
                        <div className="number-morph text-gold" style={{ fontSize: 32, fontWeight: 700 }}>₹{emi.toFixed(0)}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Total Interest</div>
                        <div className="number-morph" style={{ fontSize: 20, color: 'var(--red)' }}>₹{totalInterest.toFixed(0)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Total Payment</div>
                        <div className="number-morph" style={{ fontSize: 20, color: 'var(--white)' }}>₹{totalPayment.toFixed(0)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
