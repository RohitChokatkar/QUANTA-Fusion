import { useState, useMemo } from 'react';

// 55 currencies with realistic exchange rates vs USD (April 2026 approximate)
const CURRENCIES: { code: string; name: string; rate: number; symbol: string }[] = [
    { code: 'USD', name: 'US Dollar', rate: 1, symbol: '$' },
    { code: 'INR', name: 'Indian Rupee', rate: 85.25, symbol: '₹' },
    { code: 'EUR', name: 'Euro', rate: 0.913, symbol: '€' },
    { code: 'GBP', name: 'British Pound', rate: 0.789, symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', rate: 151.50, symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', rate: 1.545, symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', rate: 1.372, symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', rate: 0.882, symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', rate: 7.265, symbol: '¥' },
    { code: 'HKD', name: 'Hong Kong Dollar', rate: 7.797, symbol: 'HK$' },
    { code: 'SGD', name: 'Singapore Dollar', rate: 1.338, symbol: 'S$' },
    { code: 'NZD', name: 'New Zealand Dollar', rate: 1.685, symbol: 'NZ$' },
    { code: 'KRW', name: 'South Korean Won', rate: 1370.0, symbol: '₩' },
    { code: 'MXN', name: 'Mexican Peso', rate: 17.15, symbol: 'MX$' },
    { code: 'BRL', name: 'Brazilian Real', rate: 5.12, symbol: 'R$' },
    { code: 'ZAR', name: 'South African Rand', rate: 18.75, symbol: 'R' },
    { code: 'SEK', name: 'Swedish Krona', rate: 10.42, symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', rate: 10.85, symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', rate: 6.81, symbol: 'kr' },
    { code: 'PLN', name: 'Polish Zloty', rate: 3.98, symbol: 'zł' },
    { code: 'THB', name: 'Thai Baht', rate: 34.80, symbol: '฿' },
    { code: 'IDR', name: 'Indonesian Rupiah', rate: 15850, symbol: 'Rp' },
    { code: 'MYR', name: 'Malaysian Ringgit', rate: 4.68, symbol: 'RM' },
    { code: 'PHP', name: 'Philippine Peso', rate: 56.80, symbol: '₱' },
    { code: 'TWD', name: 'Taiwan Dollar', rate: 32.15, symbol: 'NT$' },
    { code: 'TRY', name: 'Turkish Lira', rate: 38.50, symbol: '₺' },
    { code: 'RUB', name: 'Russian Ruble', rate: 96.50, symbol: '₽' },
    { code: 'AED', name: 'UAE Dirham', rate: 3.6725, symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', rate: 3.7500, symbol: '﷼' },
    { code: 'QAR', name: 'Qatari Riyal', rate: 3.6400, symbol: 'ر.ق' },
    { code: 'KWD', name: 'Kuwaiti Dinar', rate: 0.3068, symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', rate: 0.3760, symbol: 'BD' },
    { code: 'OMR', name: 'Omani Rial', rate: 0.3845, symbol: 'ر.ع' },
    { code: 'EGP', name: 'Egyptian Pound', rate: 50.50, symbol: 'E£' },
    { code: 'NGN', name: 'Nigerian Naira', rate: 1620, symbol: '₦' },
    { code: 'KES', name: 'Kenyan Shilling', rate: 129.50, symbol: 'KSh' },
    { code: 'GHS', name: 'Ghanaian Cedi', rate: 15.40, symbol: 'GH₵' },
    { code: 'PKR', name: 'Pakistani Rupee', rate: 281.50, symbol: '₨' },
    { code: 'BDT', name: 'Bangladeshi Taka', rate: 121.50, symbol: '৳' },
    { code: 'LKR', name: 'Sri Lankan Rupee', rate: 298.0, symbol: 'Rs' },
    { code: 'NPR', name: 'Nepalese Rupee', rate: 136.40, symbol: 'रू' },
    { code: 'VND', name: 'Vietnamese Dong', rate: 25350, symbol: '₫' },
    { code: 'CLP', name: 'Chilean Peso', rate: 948.0, symbol: 'CL$' },
    { code: 'ARS', name: 'Argentine Peso', rate: 1050.0, symbol: 'AR$' },
    { code: 'COP', name: 'Colombian Peso', rate: 4050, symbol: 'CO$' },
    { code: 'PEN', name: 'Peruvian Sol', rate: 3.74, symbol: 'S/' },
    { code: 'CZK', name: 'Czech Koruna', rate: 23.35, symbol: 'Kč' },
    { code: 'HUF', name: 'Hungarian Forint', rate: 370.0, symbol: 'Ft' },
    { code: 'RON', name: 'Romanian Leu', rate: 4.56, symbol: 'lei' },
    { code: 'BGN', name: 'Bulgarian Lev', rate: 1.785, symbol: 'лв' },
    { code: 'HRK', name: 'Croatian Kuna', rate: 6.88, symbol: 'kn' },
    { code: 'ISK', name: 'Icelandic Krona', rate: 138.0, symbol: 'kr' },
    { code: 'ILS', name: 'Israeli Shekel', rate: 3.62, symbol: '₪' },
    { code: 'JOD', name: 'Jordanian Dinar', rate: 0.7090, symbol: 'JD' },
    { code: 'MMK', name: 'Myanmar Kyat', rate: 2100, symbol: 'K' },
];

export default function CurrencyConverter() {
    const [amount, setAmount] = useState<number>(1000);
    const [fromCur, setFromCur] = useState<string>('USD');
    const [toCur, setToCur] = useState<string>('INR');

    const convert = useMemo(() => {
        const fromRate = CURRENCIES.find(c => c.code === fromCur)?.rate ?? 1;
        const toRate = CURRENCIES.find(c => c.code === toCur)?.rate ?? 1;
        // Cross-rate conversion: From → USD → To
        const amountInUSD = amount / fromRate;
        const converted = amountInUSD * toRate;
        const crossRate = toRate / fromRate;
        return {
            converted: isNaN(converted) || !isFinite(converted) ? 0 : converted,
            crossRate: isNaN(crossRate) || !isFinite(crossRate) ? 0 : crossRate,
        };
    }, [amount, fromCur, toCur]);

    const fromInfo = CURRENCIES.find(c => c.code === fromCur);
    const toInfo = CURRENCIES.find(c => c.code === toCur);

    const swap = () => {
        setFromCur(toCur);
        setToCur(fromCur);
    };

    const formatNum = (val: number) => {
        if (val >= 1e6) return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        if (val >= 100) return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        if (val >= 1) return val.toFixed(4);
        return val.toFixed(6);
    };

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--display)', marginBottom: 16 }}>Currency Converter</h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
                {CURRENCIES.length} currencies supported · Rates approximate as of April 2026
            </p>
            <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Amount</label>
                        <input className="input-field" type="number" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>From</label>
                            <select className="input-field" value={fromCur} onChange={e => setFromCur(e.target.value)}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={swap}
                            style={{
                                padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                                background: 'var(--bg2)', color: 'var(--gold)', cursor: 'pointer',
                                fontSize: 16, transition: 'all 0.2s', marginBottom: 0,
                            }}
                            title="Swap currencies"
                        >⇄</button>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>To</label>
                            <select className="input-field" value={toCur} onChange={e => setToCur(e.target.value)}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Quick-pick popular conversions */}
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Quick Picks</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {[
                                { from: 'USD', to: 'INR' },
                                { from: 'EUR', to: 'INR' },
                                { from: 'GBP', to: 'INR' },
                                { from: 'USD', to: 'EUR' },
                                { from: 'USD', to: 'JPY' },
                                { from: 'INR', to: 'AED' },
                            ].map(q => (
                                <button
                                    key={`${q.from}-${q.to}`}
                                    onClick={() => { setFromCur(q.from); setToCur(q.to); }}
                                    style={{
                                        padding: '4px 10px', borderRadius: 6,
                                        border: '1px solid var(--border)', background: 'var(--bg2)',
                                        color: (fromCur === q.from && toCur === q.to) ? 'var(--gold)' : 'var(--text)',
                                        fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                                        fontFamily: 'var(--mono)',
                                    }}
                                >
                                    {q.from}→{q.to}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Converted Amount</div>
                        <div className="number-morph text-gold" style={{ fontSize: 28, fontWeight: 700 }}>
                            {toInfo?.symbol}{formatNum(convert.converted)} <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{toCur}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Exchange Rate</div>
                        <div className="number-morph" style={{ fontSize: 14 }}>
                            1 {fromCur} = {convert.crossRate < 0.01 ? convert.crossRate.toFixed(6) : convert.crossRate < 1 ? convert.crossRate.toFixed(4) : convert.crossRate.toFixed(4)} {toCur}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(59,130,246,0.06)', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Inverse Rate</div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>
                                1 {toCur} = {(1 / convert.crossRate) < 0.01 ? (1 / convert.crossRate).toFixed(6) : (1 / convert.crossRate).toFixed(4)} {fromCur}
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(201,162,39,0.06)', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Input</div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>
                                {fromInfo?.symbol}{amount.toLocaleString()} {fromCur}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 16, padding: 10, background: 'rgba(201,162,39,0.04)', borderRadius: 8, fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
                        💡 {fromInfo?.symbol}{amount.toLocaleString()} {fromInfo?.name} = {toInfo?.symbol}{formatNum(convert.converted)} {toInfo?.name}
                    </div>
                </div>
            </div>
        </div>
    );
}
