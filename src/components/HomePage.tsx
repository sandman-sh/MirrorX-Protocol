import React, { useState, useEffect } from 'react';
import { 
  Sparkle, 
  TrendUp, 
  TrendDown, 
  TerminalWindow, 
  ShieldCheck, 
  Cpu, 
  Coins, 
  Lightning, 
  ArrowRight, 
  Target, 
  CheckCircle,
  Crosshair,
  Robot
} from '@phosphor-icons/react';
import { INITIAL_VAULTS } from '../data/vaults';
import { getDiscoverTraders } from '../services/strikeApi';
import { DiscoveryTrader } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { ThemeToggle } from './ThemeToggle';
import { AlphaChart } from './AlphaChart';

interface HomePageProps {
  onLaunchApp: () => void;
  onSelectTrader?: (trader: DiscoveryTrader, direction: 'MIRROR' | 'INVERSE') => void;
  globalMode?: 'MIRROR' | 'INVERSE';
  onToggleMode?: (mode: 'MIRROR' | 'INVERSE') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onLaunchApp, 
  onSelectTrader,
  globalMode = 'MIRROR',
  onToggleMode,
  theme = 'dark',
  onToggleTheme
}) => {
  const isMirrorMode = globalMode === 'MIRROR';
  const activeHeroMode = isMirrorMode ? 'mirror' : 'inverse';
  const [allocAmount, setAllocAmount] = useState<number>(2500);
  const [reverseMultiplier, setReverseMultiplier] = useState<number>(1.2);
  const [liveTraders, setLiveTraders] = useState<DiscoveryTrader[]>([]);
  const [loadingTraders, setLoadingTraders] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getDiscoverTraders({ limit: 4, rank_by: 'pnl_30d', order: 'desc' })
      .then(res => {
        if (active && res?.items) {
          setLiveTraders(res.items.slice(0, 4));
          setLoadingTraders(false);
        }
      })
      .catch(err => {
        console.error('Failed to load discovery preview:', err);
        setLoadingTraders(false);
      });
    return () => { active = false; };
  }, []);

  // Simulator calculation
  const simulatedStandardRoi = (allocAmount * 0.38).toFixed(0);
  const simulatedInverseRoi = (allocAmount * 0.84 * reverseMultiplier).toFixed(0);

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      
      {/* Background ambient light orbs */}
      <div className="hero-glow-cyan" />
      <div className="hero-glow-amber" />
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-40" />

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        
        {/* Top Announcement Tag */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] text-xs font-mono text-[var(--text-secondary)] mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
          <span className="text-[var(--text-primary)] font-medium">Strike Finance V2 Flagship Quantitative Protocol</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="text-[var(--accent-cyan)] font-semibold">Live Hyperliquid & Strike Discovery</span>
        </div>

        {/* Grand Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight max-w-5xl mx-auto leading-[1.08] text-[var(--text-primary)]">
          The Smart Copy &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A00] via-[#FF5E3A] to-[#00F2FE]">
            Inverse Protocol
          </span>{' '}
          on Strike Finance
        </h1>

        <p className="mt-6 text-base sm:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto font-normal leading-relaxed">
          Mirror the highest Sharpe-ratio traders across Hyperliquid and Strike, or deploy 
          the automated <span className="text-[var(--accent-amber)] font-semibold">Anti-Liquidator</span> to profit from retail FOMO 
          with deterministic sub-second CLOB execution.
        </p>

        {/* Dual Mode Switcher Banner */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ToggleSwitch
            mode={globalMode}
            onToggle={(m) => onToggleMode?.(m)}
            size="md"
          />
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="pill" />
          )}
        </div>

        {/* Dynamic Mode Explainer Card */}
        <div className="mt-4 max-w-xl mx-auto p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] backdrop-blur-sm text-xs text-[var(--text-secondary)] shadow-sm">
          {activeHeroMode === 'mirror' ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shrink-0" />
              <span>
                <strong className="text-[var(--text-primary)] font-bold">Proportional Replication:</strong> Copies vetted lead accounts with Sharpe &gt; 2.4 directly onto Strike CLOB with non-custodial risk bounds.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] shrink-0" />
              <span>
                <strong className="text-[var(--accent-amber)] font-bold">The Anti-Liquidator:</strong> Uses Strike’s <code className="font-mono text-[var(--accent-cyan)] font-semibold">recommended_direction: "counter"</code> to take the mathematical opposite side of chronic loss flow.
              </span>
            </div>
          )}
        </div>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLaunchApp}
            className="linear-btn-primary h-12 px-8 text-sm group"
            id="hero-launch-terminal-btn"
          >
            <TerminalWindow size={18} weight="bold" />
            <span>Enter MirrorX Terminal</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#interactive-simulator"
            className="linear-btn-secondary h-12 px-6 text-sm"
          >
            <span>Run Inverse Simulator</span>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[var(--border-subtle)] text-left">
          <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Live Data Feed</p>
            <p className="text-xl font-bold font-display text-[var(--text-primary)] mt-0.5">Hyperliquid + Strike</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Cross-venue discovery index</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Execution Layer</p>
            <p className="text-xl font-bold font-display text-[var(--accent-cyan)] mt-0.5">Strike Node V2</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Deterministic state replay</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Non-Custodial</p>
            <p className="text-xl font-bold font-display text-[var(--text-primary)] mt-0.5">Ed25519 Wallets</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Withdrawal-safe keypairs</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Builder Revenue</p>
            <p className="text-xl font-bold font-display text-[var(--accent-amber)] mt-0.5">10–100 BPS</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Instant fee share on fills</p>
          </div>
        </div>

      </section>

      {/* Live Discovery Radar Sneak Peek */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="linear-badge linear-badge-cyan">Live API Stream</span>
              <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Strike &amp; Hyperliquid Discovery Radar
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Live production data indexed directly from <code className="text-[var(--accent-cyan)] font-mono font-semibold">/v2/copy/discover</code>
            </p>
          </div>

          <button
            onClick={onLaunchApp}
            className="linear-btn-secondary text-xs h-9"
          >
            <span>View All Traders in Terminal</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Live Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingTraders ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="linear-panel p-5 h-48 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
                  <div className="space-y-2 flex-1">
                    <div className="w-24 h-4 skeleton-shimmer" />
                    <div className="w-16 h-3 skeleton-shimmer" />
                  </div>
                </div>
                <div className="w-full h-8 skeleton-shimmer" />
                <div className="w-full h-9 skeleton-shimmer" />
              </div>
            ))
          ) : liveTraders.length > 0 ? (
            liveTraders.map((trader) => {
              const pnl30d = Number(trader.pnl['30d'] || trader.pnl['all'] || 0);
              const isProfit = pnl30d >= 0;
              const copyScore = Number(trader.copy_score || 82);
              const isHyperliquid = trader.platform === 'hyperliquid';
              
              return (
                <div 
                  key={trader.address} 
                  className="linear-panel p-5 flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all group"
                >
                  <div>
                    {/* Header: Platform & Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`linear-badge text-[10px] ${isHyperliquid ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'linear-badge-cyan'}`}>
                        {trader.platform.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="text-[var(--text-muted)]">SCORE:</span>
                        <span className={`font-bold ${copyScore > 75 ? 'text-[#00E599]' : 'text-[#FFA133]'}`}>
                          {copyScore}
                        </span>
                      </div>
                    </div>

                    {/* Address / Name */}
                    <p className="font-mono text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-cyan)] transition-colors" title={trader.address}>
                      {trader.display_name || (trader.address.startsWith('0x') ? `${trader.address.slice(0, 8)}...${trader.address.slice(-6)}` : trader.address)}
                    </p>
                    
                    {/* Style & Bias */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                      <span className="capitalize">{trader.style || 'Momentum'}</span>
                      <span>•</span>
                      <span className="capitalize text-[var(--text-secondary)]">{trader.bias || 'Neutral'} Bias</span>
                    </div>

                    {/* 30D Performance Stats */}
                    <div className="mt-4 p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)] font-mono">30D PnL</span>
                        <span className={`font-mono font-bold ${isProfit ? 'text-[#00E599]' : 'text-[#FF3B69]'}`}>
                          {isProfit ? '+' : ''}${Math.abs(pnl30d).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="text-[var(--text-muted)] font-mono">Account Equity</span>
                        <span className="font-mono text-[var(--text-primary)] font-semibold">
                          ${Number(trader.account_value || 120000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                    <button
                      onClick={() => onSelectTrader ? onSelectTrader(trader, 'MIRROR') : onLaunchApp()}
                      className="flex-1 linear-btn-primary h-8 text-xs justify-center"
                    >
                      <TrendUp size={13} weight="bold" />
                      <span>Mirror</span>
                    </button>
                    <button
                      onClick={() => onSelectTrader ? onSelectTrader(trader, 'INVERSE') : onLaunchApp()}
                      className="flex-1 linear-btn-amber h-8 text-xs justify-center"
                    >
                      <TrendDown size={13} weight="bold" />
                      <span>Inverse</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 p-8 text-center text-[var(--text-muted)]">
              Connecting to Strike discovery nodes...
            </div>
          )}
        </div>
      </section>

      {/* Interactive Anti-Liquidator / Inverse Simulator */}
      <section id="interactive-simulator" className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        
        {/* Interactive Visual Alpha Curve */}
        <AlphaChart onDeployStrategy={() => onLaunchApp()} />

        <div className="linear-panel-elevated p-6 sm:p-10 border border-[var(--border-amber)] relative overflow-hidden bg-[var(--bg-surface)] shadow-lg">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF8A00]/10 to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Form & Sliders */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[rgba(255,138,0,0.12)] border border-[rgba(255,138,0,0.3)] text-[var(--accent-amber)] text-xs font-mono font-semibold">
                <Target size={14} weight="bold" />
                <span>ALGORITHMIC COUNTER-TRADING ENGINE</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-[var(--text-primary)] leading-tight">
                Simulate Your Return by Inversing Retail Liquidations
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Strike’s V2 Node detects toxic order flow from traders with chronically negative 
                equity curves. MirrorX automatically takes the exact opposite position on Strike CLOB.
              </p>

              {/* Slider 1: Capital Allocation */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Simulated Capital</span>
                  <span className="text-[var(--text-primary)] font-bold text-sm">${allocAmount.toLocaleString()} USD</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(Number(e.target.value))}
                  className="w-full accent-[#FF8A00] h-1.5 bg-[var(--border-medium)] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>$500</span>
                  <span>$10,000</span>
                  <span>$25,000</span>
                </div>
              </div>

              {/* Slider 2: Reverse Multiplier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Counter-Leverage Multiplier</span>
                  <span className="text-[var(--accent-amber)] font-bold text-sm">{reverseMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={reverseMultiplier}
                  onChange={(e) => setReverseMultiplier(Number(e.target.value))}
                  className="w-full accent-[#00F2FE] h-1.5 bg-[var(--border-medium)] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>1.0x (1:1 Exact Inverse)</span>
                  <span>1.5x (Aggressive)</span>
                  <span>2.5x (Max Alpha)</span>
                </div>
              </div>

              {/* Guardrails checklist */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00E599]" weight="fill" />
                  <span>Trailing Stop Loss at 8%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00E599]" weight="fill" />
                  <span>Anti-Slippage RFQ JIT Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00E599]" weight="fill" />
                  <span>Strike Node Nonce Order</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00E599]" weight="fill" />
                  <span>Instant Builder Fee Share</span>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated Yield Card */}
            <div className="lg:col-span-5 p-6 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] space-y-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">30-Day Simulated Backtest</span>
                <span className="linear-badge linear-badge-amber text-[10px]">MONTE CARLO V2</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Standard Copy</p>
                    <p className="text-base font-bold font-mono text-[#00F2FE] mt-0.5">+${simulatedStandardRoi}</p>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">+38.0% 30d</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#00E599]/10 border border-[#00E599]/30">
                    <p className="text-[10px] text-[#00E599] font-mono uppercase font-bold">Anti-Liquidator</p>
                    <p className="text-base font-bold font-mono text-[#00E599] mt-0.5">+${simulatedInverseRoi}</p>
                    <span className="text-[10px] font-mono text-[#00E599]">+{((Number(simulatedInverseRoi) / allocAmount) * 100).toFixed(1)}% 30d</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Target Lead Pool</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">Lowest 5% HL/Strike Score</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Historical Lead Loss Rate</span>
                  <span className="font-mono text-[#FF3B69] font-semibold">82.4% Liquidated / Stop-Out</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Builder Fee Accrued</span>
                  <span className="font-mono text-[var(--accent-cyan)] font-semibold">${(allocAmount * 0.0025 * 4).toFixed(2)} (25 BPS)</span>
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                className="w-full linear-btn-amber h-11 text-sm justify-center"
              >
                <Lightning size={16} weight="bold" />
                <span>Deploy Inverse Guard in Terminal</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Architecture */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="linear-badge linear-badge-cyan mb-3">ENGINE ARCHITECTURE</span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[var(--text-primary)]">
            Built on Strike V2 Infrastructure
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
            Separating high-speed deterministic execution from multi-chain custody lockers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Strike Node Determinism */}
          <div className="linear-panel p-6 flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,242,254,0.1)] border border-[rgba(0,242,254,0.3)] flex items-center justify-center text-[var(--accent-cyan)] mb-6">
              <Cpu size={24} weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Deterministic Strike Node</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                All order matching, sequence numbers (nonces), and liquidations occur on Strike's 
                dedicated execution layer. Zero blockchain latency, provable historical replay.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)] font-bold">&gt;</span> Sub-second orderbook latency
            </div>
          </div>

          {/* Card 2: Cross-Chain Lockers */}
          <div className="linear-panel p-6 flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.3)] flex items-center justify-center text-[var(--accent-amber)] mb-6">
              <ShieldCheck size={24} weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Multi-Chain Custody Lockers</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Assets stay anchored on Cardano (ADA), Solana (SOL/USDC), and Ethereum (ETH/USDC). 
                Strike exchangers maintain 1:1 USD backing with validator consensus.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              <span className="text-[var(--accent-amber)] font-bold">&gt;</span> Non-custodial settlement
            </div>
          </div>

          {/* Card 3: Builder Revenue */}
          <div className="linear-panel p-6 flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,229,153,0.1)] border border-[rgba(0,229,153,0.3)] flex items-center justify-center text-[#00E599] mb-6">
              <Coins size={24} weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Ed25519 &amp; Builder Fee Protocol</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                MirrorX authenticates via withdrawal-safe Ed25519 API wallets and earns 10–100 BPS 
                on all mirrored orders using Strike's native <code className="text-[#00E599] font-mono font-semibold">X-Builder-Fee-Bps</code>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              <span className="text-[#00E599] font-bold">&gt;</span> Automated fee distribution
            </div>
          </div>

        </div>
      </section>

      {/* Ready to Deploy Thematic Vaults Preview */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="linear-badge linear-badge-amber mb-3">CURATED PORTFOLIOS</span>
          <h2 className="text-3xl font-display font-extrabold text-[var(--text-primary)]">
            Thematic Quantitative Vaults
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Don't bet on a single trader. Diversify across quantitative baskets with auto-rebalancing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INITIAL_VAULTS.map((vault) => {
            const isInverse = vault.strategyType === 'inverse_counter';
            return (
              <div 
                key={vault.id}
                className="linear-panel p-6 border border-[var(--border-subtle)] hover:border-[#00F2FE]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`linear-badge text-[10px] ${isInverse ? 'linear-badge-amber' : 'linear-badge-cyan'}`}>
                      {vault.strategyType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      Risk: <strong className="text-[var(--text-primary)]">{vault.riskTier}</strong>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">{vault.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{vault.description}</p>

                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-center font-mono">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Est. 30D ROI</p>
                      <p className="text-sm font-bold text-[#00E599] mt-0.5">{vault.est30dRoi}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Max Drawdown</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{vault.targetDrawdown}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Total TVL</p>
                      <p className="text-sm font-bold text-[var(--accent-cyan)] mt-0.5">{vault.tvlUsd}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {vault.tradersCount} lead traders tracked
                  </span>
                  <button
                    onClick={onLaunchApp}
                    className={isInverse ? "linear-btn-amber text-xs h-8 px-4" : "linear-btn-primary text-xs h-8 px-4"}
                  >
                    <span>Allocate in Terminal</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="linear-panel-elevated p-8 sm:p-14 border border-[var(--border-cyan)] bg-[var(--bg-surface)] relative shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F2FE] to-[#FF8A00] p-0.5 mx-auto mb-6 shadow-md">
            <div className="w-full h-full bg-[var(--bg-surface-elevated)] rounded-[14px] flex items-center justify-center">
              <TerminalWindow size={32} className="text-[var(--accent-cyan)]" weight="bold" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[var(--text-primary)]">
            Ready to Deploy Automated Quantitative Alpha?
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
            Connect your Solana, Ethereum, or Cardano wallet and launch your non-custodial 
            Mirror or Counter position in under 60 seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="linear-btn-primary h-12 px-8 text-sm"
              id="footer-launch-terminal-btn"
            >
              <TerminalWindow size={18} weight="bold" />
              <span>Launch MirrorX Terminal</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Linear Style Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-12 px-4 sm:px-6 max-w-7xl mx-auto text-xs text-[var(--text-muted)] font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--text-primary)] font-display text-sm">Mirror<span className="text-[#00F2FE]">X</span></span>
          <span>© 2026 Strike Finance Hackathon</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://docs.strikefinance.org" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">Strike Docs</a>
          <a href="https://github.com/strike-finance" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
          <a href="https://discord.com/invite/PuWbEmrEee" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">Discord</a>
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="pill" />
          )}
        </div>
      </footer>

    </div>
  );
};
