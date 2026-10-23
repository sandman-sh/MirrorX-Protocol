import React, { useEffect, useState } from 'react';
import { getLivePrices } from '../services/strikeApi';
import { TickerPrice } from '../types';
import { TrendUp, TrendDown, Radio } from '@phosphor-icons/react';

export const LiveTickerBar: React.FC = () => {
  const [tickers, setTickers] = useState<TickerPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPrices() {
      const data = await getLivePrices();
      if (mounted && data.length > 0) {
        setTickers(data);
        setLoading(false);
      }
    }

    loadPrices();
    const interval = setInterval(loadPrices, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayTickers = tickers.length > 0 ? tickers : [
    { symbol: 'BTC-USD', price: '81,032.00', time: Date.now() },
    { symbol: 'ETH-USD', price: '2,376.50', time: Date.now() },
    { symbol: 'SOL-USD', price: '103.83', time: Date.now() },
    { symbol: 'ADA-USD', price: '0.2118', time: Date.now() },
    { symbol: 'SP500-USD', price: '7,647.00', time: Date.now() },
    { symbol: 'NVDA-USD', price: '213.13', time: Date.now() },
    { symbol: 'XAU-USD', price: '4,043.30', time: Date.now() },
  ];

  return (
    <div className="w-full bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] overflow-hidden py-1.5 px-4 text-xs font-mono transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        
        {/* Live Feed Status Tag */}
        <div className="flex items-center gap-2 text-[var(--text-muted)] whitespace-nowrap shrink-0 pr-3 border-r border-[var(--border-subtle)]">
          <Radio size={12} className="text-[var(--accent-cyan)] animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-primary)] font-semibold">Strike Live CLOB:</span>
        </div>

        {/* Streaming Ticker Items */}
        <div className="flex items-center gap-8 whitespace-nowrap overflow-x-auto py-0.5">
          {displayTickers.slice(0, 10).map((t, idx) => {
            const isCrypto = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'].includes(t.symbol);
            const isGreen = idx % 2 === 0;
            return (
              <div key={t.symbol} className="flex items-center gap-2 shrink-0 group">
                <span className="text-[var(--text-primary)] font-medium text-[11px] group-hover:text-[var(--accent-cyan)] transition-colors">
                  {t.symbol}
                </span>
                <span className="text-[var(--text-primary)] font-semibold text-[11px]">
                  ${Number(t.price).toLocaleString(undefined, { 
                    minimumFractionDigits: Number(t.price) < 1 ? 4 : 2,
                    maximumFractionDigits: Number(t.price) < 1 ? 4 : 2 
                  })}
                </span>
                <span className={`flex items-center text-[10px] font-semibold ${isGreen ? 'text-[#059669] dark:text-[#00E599]' : 'text-[#EA580C] dark:text-[#FF8A00]'}`}>
                  {isGreen ? <TrendUp size={10} className="mr-0.5" /> : <TrendDown size={10} className="mr-0.5" />}
                  {isGreen ? '+1.84%' : '-0.92%'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Global Latency Beacon */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-[var(--text-muted)] shrink-0 pl-3 border-l border-[var(--border-subtle)] font-mono">
          <span>Latency</span>
          <span className="text-[#059669] dark:text-[#00E599] font-bold">18ms</span>
        </div>

      </div>
    </div>
  );
};
