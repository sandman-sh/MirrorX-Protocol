import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Crosshair, 
  TrendDown, 
  TrendUp, 
  Lightning, 
  ShieldCheck, 
  ArrowsClockwise, 
  Fire, 
  Bell, 
  BellSlash, 
  PaperPlaneTilt,
  CheckCircle,
  Pulse
} from '@phosphor-icons/react';
import { dispatchLiquidationCounterAlert } from '../services/telegramService';

export interface LiquidationEvent {
  id: string;
  timestamp: string;
  symbol: string;
  account: string;
  liquidatedSide: 'LONG' | 'SHORT';
  liquidatedSizeUsd: number;
  triggerPrice: number;
  counterSide: 'BUY' | 'SELL';
  counterEntryPrice: number;
  profitEstimatedUsd: number;
  wickCapturePercent: number;
  status: 'EXTRACTED' | 'EXECUTING';
}

const INITIAL_EVENTS: LiquidationEvent[] = [
  {
    id: 'liq-1',
    timestamp: '12s ago',
    symbol: 'BTC-USD',
    account: '0x94f2...38b1',
    liquidatedSide: 'LONG',
    liquidatedSizeUsd: 142000,
    triggerPrice: 80920,
    counterSide: 'SELL',
    counterEntryPrice: 80950,
    profitEstimatedUsd: 2840,
    wickCapturePercent: 2.0,
    status: 'EXTRACTED'
  },
  {
    id: 'liq-2',
    timestamp: '48s ago',
    symbol: 'ETH-USD',
    account: '0x17c0...aa84',
    liquidatedSide: 'SHORT',
    liquidatedSizeUsd: 68500,
    triggerPrice: 2415.5,
    counterSide: 'BUY',
    counterEntryPrice: 2412.0,
    profitEstimatedUsd: 1370,
    wickCapturePercent: 2.0,
    status: 'EXTRACTED'
  },
  {
    id: 'liq-3',
    timestamp: '2m ago',
    symbol: 'SOL-USD',
    account: '0x7e11...902a',
    liquidatedSide: 'LONG',
    liquidatedSizeUsd: 94000,
    triggerPrice: 168.20,
    counterSide: 'SELL',
    counterEntryPrice: 168.45,
    profitEstimatedUsd: 1880,
    wickCapturePercent: 2.0,
    status: 'EXTRACTED'
  }
];

export const LiquidationRadar: React.FC = () => {
  const [events, setEvents] = useState<LiquidationEvent[]>(INITIAL_EVENTS);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [telegramDispatchEnabled, setTelegramDispatchEnabled] = useState<boolean>(true);
  const [totalExtractedAlpha, setTotalExtractedAlpha] = useState<number>(246890);
  const [trackedVolume, setTrackedVolume] = useState<number>(1842500);
  const [recentFlash, setRecentFlash] = useState<boolean>(false);

  // Play subtle execution sound
  function playBeep() {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext not allowed before user gesture
    }
  }

  // Trigger manual simulation
  function triggerSimulation(customSymbol?: string) {
    const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'HYPE-USD'];
    const chosenSymbol = customSymbol || symbols[Math.floor(Math.random() * symbols.length)];
    const isLongLiq = Math.random() > 0.4;
    const basePrice = chosenSymbol === 'BTC-USD' ? 81100 : chosenSymbol === 'ETH-USD' ? 2420 : 169;
    const size = Math.floor(Math.random() * 80000) + 25000;
    const alpha = size * 0.022;

    const newEvent: LiquidationEvent = {
      id: `liq-${Date.now()}`,
      timestamp: 'Just now',
      symbol: chosenSymbol,
      account: `0x${Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('')}...${Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
      liquidatedSide: isLongLiq ? 'LONG' : 'SHORT',
      liquidatedSizeUsd: size,
      triggerPrice: Number((basePrice * (1 + (Math.random() * 0.004 - 0.002))).toFixed(2)),
      counterSide: isLongLiq ? 'SELL' : 'BUY',
      counterEntryPrice: Number((basePrice * (1 + (isLongLiq ? 0.002 : -0.002))).toFixed(2)),
      profitEstimatedUsd: Number(alpha.toFixed(2)),
      wickCapturePercent: 2.2,
      status: 'EXTRACTED'
    };

    setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    setTotalExtractedAlpha(prev => prev + alpha);
    setTrackedVolume(prev => prev + size);
    setRecentFlash(true);
    setTimeout(() => setRecentFlash(false), 900);

    playBeep();

    confetti({
      particleCount: 40,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#FF8A00', '#00F2FE', '#00E599']
    });

    if (telegramDispatchEnabled) {
      dispatchLiquidationCounterAlert({
        liquidatedAccount: newEvent.account,
        symbol: newEvent.symbol,
        liquidatedAmountUsd: newEvent.liquidatedSizeUsd,
        counterSide: newEvent.counterSide,
        entryPrice: newEvent.counterEntryPrice,
        estimatedAlphaUsd: newEvent.profitEstimatedUsd
      });
    }
  }

  // Auto-pulse background simulator when active
  useEffect(() => {
    if (!isLiveActive) return;
    const timer = setInterval(() => {
      // 30% chance to pulse every 8 seconds
      if (Math.random() > 0.5) {
        triggerSimulation();
      }
    }, 9000);
    return () => clearInterval(timer);
  }, [isLiveActive, telegramDispatchEnabled, soundEnabled]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Sentinel Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="linear-badge linear-badge-amber text-[10px]">
              <Crosshair size={12} weight="bold" />
              INVERSE EXECUTION SENTINEL
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-[#00E599]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]"></span>
              </span>
              Strike CLOB Level-3 Monitored
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[var(--text-primary)] mt-1">
            Anti-Liquidator Cascade Radar
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">
            In perpetual futures, retail margin liquidations create predictable price wicks. The Anti-Liquidator scans chronic retail accounts and executes opposing orders instantly to capture cascading liquidity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              soundEnabled 
                ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)]' 
                : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-tertiary)]'
            }`}
            title="Toggle Audio Cues"
          >
            {soundEnabled ? <Bell size={14} weight="fill" /> : <BellSlash size={14} />}
            <span className="hidden sm:inline">Sound</span>
          </button>

          <button
            onClick={() => setTelegramDispatchEnabled(prev => !prev)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              telegramDispatchEnabled 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-tertiary)]'
            }`}
            title="Telegram Bot Dispatch"
          >
            <PaperPlaneTilt size={14} weight="fill" />
            <span className="hidden sm:inline">Telegram Alerts</span>
          </button>

          <button
            onClick={() => triggerSimulation()}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#FF8A00] to-[#FF5E3A] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,138,0,0.3)]"
          >
            <Lightning size={14} weight="fill" />
            Simulate Cascade
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="linear-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Total Counter-Alpha
          </span>
          <div className="text-xl font-bold font-mono text-[#00E599] flex items-center gap-1">
            +${totalExtractedAlpha.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <TrendUp size={16} weight="bold" />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">
            Extracted from retail stops
          </span>
        </div>

        <div className="linear-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            24h Tracked Liquidation
          </span>
          <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
            ${trackedVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">
            Across BTC, ETH & SOL
          </span>
        </div>

        <div className="linear-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Execution Latency
          </span>
          <div className="text-xl font-bold font-mono text-[#00F2FE]">
            &lt; 42 ms
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">
            FIFO priority routing
          </span>
        </div>

        <div className="linear-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Sentinel Status
          </span>
          <div className="text-xl font-bold font-mono text-[#FF8A00] flex items-center gap-1">
            ARMED 2.5x
            <Pulse size={16} weight="bold" />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">
            Reverse multiplier active
          </span>
        </div>
      </div>

      {/* Live Stream Table */}
      <div className={`linear-card rounded-xl border transition-all duration-300 ${
        recentFlash 
          ? 'border-[#FF8A00] shadow-[0_0_25px_rgba(255,138,0,0.25)]' 
          : 'border-[var(--border)]'
      } bg-[var(--bg-card)] overflow-hidden`}>
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#FF8A00] animate-ping" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Real-Time Strike CLOB Liquidation &amp; Counter-Trade Feed
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {events.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-tertiary)] font-mono text-[11px] bg-[var(--bg-surface)]">
                <th className="py-2.5 px-4 text-left font-medium">Time / Market</th>
                <th className="py-2.5 px-4 text-left font-medium">Retail Liquidation</th>
                <th className="py-2.5 px-4 text-left font-medium">Liq Price</th>
                <th className="py-2.5 px-4 text-left font-medium">MirrorX Counter-Action</th>
                <th className="py-2.5 px-4 text-right font-medium">Extracted Alpha</th>
                <th className="py-2.5 px-4 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {events.map((ev) => {
                const isLongLiq = ev.liquidatedSide === 'LONG';
                return (
                  <tr key={ev.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    {/* Time & Market */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)] font-mono">
                        {ev.symbol}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {ev.timestamp}
                      </div>
                    </td>

                    {/* Retail Liquidation */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isLongLiq ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ev.liquidatedSide}
                        </span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          ${ev.liquidatedSizeUsd.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                        by {ev.account}
                      </div>
                    </td>

                    {/* Liq Trigger Price */}
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      ${ev.triggerPrice.toLocaleString()}
                    </td>

                    {/* Counter Execution */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ev.counterSide === 'BUY' ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30' : 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30'
                        }`}>
                          AUTO {ev.counterSide}
                        </span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          @ ${ev.counterEntryPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#00E599] font-mono mt-0.5">
                        +{ev.wickCapturePercent}% wick capture
                      </div>
                    </td>

                    {/* Extracted Alpha */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#00E599]">
                      +${ev.profitEstimatedUsd.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">
                        <CheckCircle size={10} weight="fill" />
                        FILLED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
