// MarketStatus — shows BSE market hours (IST 9:15 AM – 3:30 PM)
import { useState, useEffect } from 'react';

export default function MarketStatus() {
    const [status, setStatus] = useState({ isOpen: false, label: 'BSE Closed', time: '' });

    useEffect(() => {
        function update() {
            const now = new Date();
            // Convert to IST (UTC+5:30)
            const istOffset = 5.5 * 60;
            const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
            const ist = new Date(utcMs + istOffset * 60000);

            const h = ist.getHours();
            const m = ist.getMinutes();
            const timeVal = h * 60 + m;
            const day = ist.getDay();

            const isWeekday = day >= 1 && day <= 5;
            const marketOpen = 9 * 60 + 15;  // 9:15
            const marketClose = 15 * 60 + 30; // 15:30
            const preOpen = 9 * 60;           // 9:00

            let isOpen = false;
            let label = 'BSE Closed';

            if (isWeekday) {
                if (timeVal >= preOpen && timeVal < marketOpen) {
                    label = 'BSE Pre-Market';
                } else if (timeVal >= marketOpen && timeVal <= marketClose) {
                    isOpen = true;
                    label = 'BSE Open';
                } else if (timeVal > marketClose && timeVal <= marketClose + 10) {
                    label = 'BSE Closing';
                } else {
                    label = 'BSE Closed';
                }
            }

            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} IST`;
            setStatus({ isOpen, label, time });
        }

        update();
        const timer = setInterval(update, 30000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="market-status" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap',
        }}>
            <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: status.isOpen ? '#10b981' : '#ef4444',
                animation: status.isOpen ? 'pulse-green 2s infinite' : 'none',
                display: 'inline-block',
            }} />
            <span>{status.label}</span>
            <span style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{status.time}</span>
        </div>
    );
}
