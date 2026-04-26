// useMarketHours — IST hours guard (9:15 AM – 3:30 PM)
import { useState, useEffect } from 'react';

interface MarketHoursState {
    isMarketOpen: boolean;
    currentTime: string;
    timeUntilOpen: string;
    timeUntilClose: string;
    session: 'pre-market' | 'open' | 'closing' | 'closed';
}

export function useMarketHours(): MarketHoursState {
    const [state, setState] = useState<MarketHoursState>({
        isMarketOpen: false,
        currentTime: '',
        timeUntilOpen: '',
        timeUntilClose: '',
        session: 'closed',
    });

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

            const preMarket = 9 * 60;       // 9:00
            const marketOpen = 9 * 60 + 15;  // 9:15
            const marketClose = 15 * 60 + 30; // 15:30
            const postClose = 15 * 60 + 40;   // 15:40

            let session: MarketHoursState['session'] = 'closed';
            let isOpen = false;

            if (isWeekday) {
                if (timeVal >= preMarket && timeVal < marketOpen) {
                    session = 'pre-market';
                } else if (timeVal >= marketOpen && timeVal <= marketClose) {
                    session = 'open';
                    isOpen = true;
                } else if (timeVal > marketClose && timeVal <= postClose) {
                    session = 'closing';
                } else {
                    session = 'closed';
                }
            }

            // Time until open
            let untilOpen = '';
            if (!isOpen && isWeekday && timeVal < marketOpen) {
                const diff = marketOpen - timeVal;
                untilOpen = `${Math.floor(diff / 60)}h ${diff % 60}m`;
            }

            // Time until close
            let untilClose = '';
            if (isOpen) {
                const diff = marketClose - timeVal;
                untilClose = `${Math.floor(diff / 60)}h ${diff % 60}m`;
            }

            setState({
                isMarketOpen: isOpen,
                currentTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} IST`,
                timeUntilOpen: untilOpen,
                timeUntilClose: untilClose,
                session,
            });
        }

        update();
        const timer = setInterval(update, 30000); // every 30s
        return () => clearInterval(timer);
    }, []);

    return state;
}
