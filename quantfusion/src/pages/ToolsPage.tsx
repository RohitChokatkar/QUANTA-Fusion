import { useState } from 'react';
import EMICalculator from '../components/Tools/EMICalculator';
import SIPCalculator from '../components/Tools/SIPCalculator';
import CurrencyConverter from '../components/Tools/CurrencyConverter';

export default function ToolsPage() {
    const [activeTab, setActiveTab] = useState<'emi' | 'sip' | 'currency'>('emi');

    return (
        <div style={{ paddingTop: 36 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 800 }}>Financial Tools</h1>
                <p style={{ color: 'var(--text-dim)' }}>Calculators and conversion utilities for quantitative analysis.</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                {[
                    { id: 'emi', label: '🏦 EMI Calculator' },
                    { id: 'sip', label: '📈 SIP Calculator' },
                    { id: 'currency', label: '💱 Currency Converter' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={activeTab === tab.id ? 'btn-gold' : 'btn-outline'}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{ padding: '8px 16px', fontSize: 14 }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="panel animate-in" style={{ padding: 24, minHeight: 400 }}>
                {activeTab === 'emi' && <EMICalculator />}
                {activeTab === 'sip' && <SIPCalculator />}
                {activeTab === 'currency' && <CurrencyConverter />}
            </div>
        </div>
    );
}
