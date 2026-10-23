import React, { useState, useEffect } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  ArrowsClockwise, 
  Cpu, 
  Coins, 
  Key, 
  CheckCircle, 
  MagnifyingGlass, 
  Lightning, 
  ArrowRight,
  Play,
  Pause,
  Trash,
  Crosshair,
  Robot
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { DiscoveryTrader, StrategyVault, ActiveMirror, L3Snapshot, ConnectedWallet } from '../types';
import { getDiscoverTraders, getL3Snapshot } from '../services/strikeApi';
import { INITIAL_VAULTS } from '../data/vaults';
import { getStoredApiWalletKeys, generateApiWalletKeys, signStrikeRequest } from '../services/walletService';
import { ToggleSwitch } from './ToggleSwitch';
import { ThemeToggle } from './ThemeToggle';
import { AlphaChart } from './AlphaChart';
import { StrikeTokenHub } from './StrikeTokenHub';
import { LiquidationRadar } from './LiquidationRadar';
import { TelegramBotHub } from './TelegramBotHub';
import { dispatchTradeAlert } from '../services/telegramService';

interface AppTerminalProps {
  onOpenDeployModal: (trader?: DiscoveryTrader, vault?: StrategyVault, dir?: 'MIRROR' | 'INVERSE') => void;
  activePositions: ActiveMirror[];
  onUpdatePositions: (positions: ActiveMirror[]) => void;
  onClosePosition?: (posId: string) => void;
  initialTab?: string;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onAddStrikeTokens?: (amount: number) => void;
  globalMode?: 'MIRROR' | 'INVERSE';
  onToggleMode?: (mode: 'MIRROR' | 'INVERSE') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const AppTerminal: React.FC<AppTerminalProps> = ({
  onOpenDeployModal,
  activePositions,
  onUpdatePositions,
  onClosePosition,
  initialTab = 'traders',
  connectedWallet,
  onOpenWalletModal: _onOpenWalletModal,
  onAddStrikeTokens,
  globalMode = 'MIRROR',
  onToggleMode,
  theme = 'dark',
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'traders' | 'vaults' | 'positions' | 'radar' | 'l3' | 'builder' | 'tokenomics' | 'telegram'>(
    (initialTab as any) || 'traders'
  );

  // Discovery State
  const [traders, setTraders] = useState<DiscoveryTrader[]>([]);
  const [loadingTraders, setLoadingTraders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'hyperliquid' | 'strike'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'copy' | 'counter'>('all');
  const [sortKey, setSortKey] = useState<string>('pnl_30d');
  const [styleFilter, setStyleFilter] = useState<string>('all');

  // L3 State
  const [l3Data, setL3Data] = useState<L3Snapshot | null>(null);
  const [_loadingL3, setLoadingL3] = useState(false);
  const [queueEstimatePrice, setQueueEstimatePrice] = useState('81032');
  const [queueEstimateSize, setQueueEstimateSize] = useState('0.1');
  const [queueEstimateSide, setQueueEstimateSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isSubmittingL3Order, setIsSubmittingL3Order] = useState(false);
  const [l3SignatureProof, setL3SignatureProof] = useState<any>(null);

  // Builder Studio State
  const [builderKeys, setBuilderKeys] = useState(getStoredApiWalletKeys());
  const [builderFeeBps, setBuilderFeeBps] = useState(builderKeys?.builderFeeBps || 25);
  const [testSignatureOutput, setTestSignatureOutput] = useState<any>(null);

  function handleSelectL3Level(price: string, size: string, side: 'BUY' | 'SELL') {
    setQueueEstimatePrice(price);
    setQueueEstimateSize(size);
    setQueueEstimateSide(side);
  }

  async function handleSubmitL3Order() {
    setIsSubmittingL3Order(true);
    let keys = getStoredApiWalletKeys();
    if (!keys) {
      keys = await generateApiWalletKeys('mirrorx-alpha', connectedWallet?.effectiveFeeBps || 25);
    }

    const orderBody = {
      symbol: 'BTC-USD',
      side: queueEstimateSide,
      type: 'LIMIT',
      price: queueEstimatePrice,
      size: queueEstimateSize,
      builder_code: keys.builderCode,
      builder_fee_bps: keys.builderFeeBps
    };

    const signed = await signStrikeRequest(keys, 'POST', '/v2/order', orderBody);
    setL3SignatureProof(signed);

    const priceNum = parseFloat(queueEstimatePrice) || 81000;
    const sizeNum = parseFloat(queueEstimateSize) || 0.1;
    const allocUsd = priceNum * sizeNum;

    const newPos: ActiveMirror = {
      id: `pos-l3-${Date.now()}`,
      traderAddress: 'Strike CLOB L3 Orderbook',
      traderName: `L3 ${queueEstimateSide} Limit ($${queueEstimatePrice})`,
      platform: 'strike',
      direction: queueEstimateSide === 'BUY' ? 'MIRROR' : 'INVERSE',
      allocatedUsd: Number(allocUsd.toFixed(2)),
      currentPnlUsd: 0,
      currentRoiPercent: 0,
      symbol: 'BTC-USD',
      side: queueEstimateSide,
      leverage: 3,
      status: 'ACTIVE',
      lastRebalance: 'Resting in FIFO Queue',
      builderFeeCollectedUsd: allocUsd * 0.0025
    };

    onUpdatePositions([newPos, ...activePositions]);
    setIsSubmittingL3Order(false);

    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00F2FE', '#00E599', '#6366F1']
    });

    dispatchTradeAlert({
      direction: queueEstimateSide === 'BUY' ? 'MIRROR' : 'INVERSE',
      targetName: `Strike L3 FIFO Queue (@${queueEstimatePrice})`,
      symbol: 'BTC-USD',
      side: queueEstimateSide,
      amountUsd: allocUsd,
      leverage: 3,
      price: queueEstimatePrice,
      builderFeeUsd: allocUsd * 0.0025
    });
  }

  // Load Traders
  async function loadTraders() {
    setLoadingTraders(true);
    try {
      const data = await getDiscoverTraders({
        platform: platformFilter === 'all' ? undefined : platformFilter,
        sort: sortKey,
        style: styleFilter === 'all' ? undefined : styleFilter,
        order: 'desc',
        limit: 30
      });
      if (data?.items) {
        setTraders(data.items);
      }
    } catch (err) {
      console.error('Error loading traders:', err);
    } finally {
      setLoadingTraders(false);
    }
  }

  useEffect(() => {
    loadTraders();
  }, [platformFilter, sortKey, styleFilter]);

  // Load L3
  useEffect(() => {
    if (activeTab === 'l3') {
      setLoadingL3(true);
      getL3Snapshot('BTC-USD')
        .then((data) => {
          setL3Data(data);
          setLoadingL3(false);
        })
        .catch(() => setLoadingL3(false));
    }
  }, [activeTab]);

  // Filter Traders by search & recommendation
  const filteredTraders = traders.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const addr = (t.address || '').toLowerCase();
      const name = (t.display_name || '').toLowerCase();
      if (!addr.includes(q) && !name.includes(q)) return false;
    }
    if (directionFilter === 'copy' && t.recommended_direction === 'counter') return false;
    if (directionFilter === 'counter' && t.recommended_direction !== 'counter') return false;
    return true;
  });

  // Position Handlers
  function togglePositionStatus(id: string) {
    const updated = activePositions.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: p.status === 'ACTIVE' ? ('PAUSED' as const) : ('ACTIVE' as const)
        };
      }
      return p;
    });
    onUpdatePositions(updated);
  }

  function closePosition(id: string) {
    if (onClosePosition) {
      onClosePosition(id);
    } else {
      const updated = activePositions.filter((p) => p.id !== id);
      onUpdatePositions(updated);
    }
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00E599', '#00F2FE']
    });
  }

  function handleSimulateMarketTick() {
    const updated = activePositions.map((pos) => {
      const delta = (Math.random() - 0.35) * (pos.allocatedUsd * 0.04);
      const newPnl = pos.currentPnlUsd + delta;
      const newRoi = (newPnl / pos.allocatedUsd) * 100;
      return {
        ...pos,
        currentPnlUsd: newPnl,
        currentRoiPercent: newRoi,
        lastRebalance: 'Just now'
      };
    });
    onUpdatePositions(updated);
  }

  // Generate / Regenerate Keys
  async function handleCreateKeys() {
    const newKeys = await generateApiWalletKeys('mirrorx-alpha', builderFeeBps);
    setBuilderKeys(newKeys);
  }

  async function handleTestSign() {
    if (!builderKeys) {
      await handleCreateKeys();
    }
    const keys = builderKeys || (await generateApiWalletKeys());
    const signed = await signStrikeRequest(keys, 'POST', '/v2/order', {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      size: '0.05',
      price: '81032',
      builder_code: keys.builderCode,
      builder_fee_bps: builderFeeBps
    });
    setTestSignatureOutput(signed);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      
      {/* Sub-Nav Bar (Linear Style Tabs) */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] sticky top-16 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-12 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-1 sm:gap-2">
            
            <button
              onClick={() => setActiveTab('traders')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'traders'
                  ? 'bg-[rgba(0,242,254,0.12)] text-[#00F2FE] border border-[#00F2FE]/30'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <TrendUp size={14} weight="bold" />
              <span>Traders Radar (Live)</span>
              <span className="linear-badge linear-badge-cyan text-[9px] py-0 px-1">STRIKE + HL</span>
            </button>

            <button
              onClick={() => setActiveTab('vaults')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vaults'
                  ? 'bg-[rgba(0,229,153,0.12)] text-[#00E599] border border-[#00E599]/30'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Coins size={14} weight="bold" />
              <span>Thematic Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('positions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'positions'
                  ? 'bg-[rgba(255,138,0,0.12)] text-[#FF8A00] border border-[#FF8A00]/30'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Lightning size={14} weight="bold" />
              <span>Active Positions ({activePositions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-amber-500/15 text-[#FF8A00] border border-[#FF8A00]/40 shadow-[0_0_15px_rgba(255,138,0,0.2)]'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Crosshair size={14} weight="bold" />
              <span>Anti-Liquidator Radar</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8A00]"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('l3')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'l3'
                  ? 'bg-[rgba(99,102,241,0.15)] text-indigo-400 border border-indigo-500/30'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Cpu size={14} weight="bold" />
              <span>L3 Orderbook Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'builder'
                  ? 'bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.2)]'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Key size={14} weight="bold" />
              <span>Builder Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('tokenomics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tokenomics'
                  ? 'bg-[rgba(255,138,0,0.15)] text-[#FF8A00] border border-[#FF8A00]/40'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Coins size={14} weight="fill" className="text-[#FF8A00]" />
              <span>$STRIKE Flywheel</span>
            </button>

            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'telegram'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'text-[var(--text-secondary)] hover:text-white bg-transparent border border-transparent'
              }`}
            >
              <Robot size={14} weight="bold" />
              <span>Copilot Bot (Telegram)</span>
              <span className="linear-badge linear-badge-cyan text-[9px] py-0 px-1">LIVE BOT</span>
            </button>

          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs font-mono text-[var(--text-muted)]">
            {onToggleMode && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] uppercase text-[var(--text-muted)] font-mono">Strategy:</span>
                <ToggleSwitch mode={globalMode} onToggle={onToggleMode} size="sm" />
              </div>
            )}
            {onToggleTheme && (
              <ThemeToggle theme={theme} onToggle={onToggleTheme} size="sm" />
            )}
            <span className="hidden md:inline">Protocol:</span>
            <span className="linear-badge linear-badge-emerald text-[9px] py-0 px-1.5">MAINNET READY</span>
          </div>

        </div>
      </div>

      {/* Main Terminal Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: TRADERS RADAR (LIVE DISCOVERY TABLE) */}
        {/* ========================================================================= */}
        {activeTab === 'traders' && (
          <div className="space-y-4">
            
            {/* Filter Bar Controls */}
            <div className="linear-panel p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              <div className="flex-1 flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 h-9">
                <MagnifyingGlass size={15} className="text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  placeholder="Filter by 0x address, Strike nickname, or ADA handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none w-full font-mono"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                
                {/* Platform */}
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as any)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-secondary)] rounded-md h-9 px-2.5 focus:outline-none focus:border-[#00F2FE]"
                >
                  <option value="all">Platform: All</option>
                  <option value="hyperliquid">Hyperliquid</option>
                  <option value="strike">Strike Native</option>
                </select>

                {/* Sort */}
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-secondary)] rounded-md h-9 px-2.5 focus:outline-none focus:border-[#00F2FE]"
                >
                  <option value="pnl_30d">Sort: 30D PnL</option>
                  <option value="equity">Sort: Equity</option>
                  <option value="volume_30d">Sort: 30D Volume</option>
                  <option value="copy_score">Sort: Copy Score</option>
                  <option value="max_drawdown">Sort: Max Drawdown</option>
                </select>

                {/* Style */}
                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-secondary)] rounded-md h-9 px-2.5 focus:outline-none focus:border-[#00F2FE]"
                >
                  <option value="all">Style: All</option>
                  <option value="scalper">Scalper</option>
                  <option value="algo">Algo</option>
                  <option value="market_maker">Market Maker</option>
                  <option value="swing">Swing</option>
                  <option value="day">Day</option>
                </select>

                {/* Direction Filter */}
                <div className="flex rounded-md border border-[rgba(255,255,255,0.1)] p-0.5 bg-[rgba(255,255,255,0.02)] h-9 shrink-0">
                  <button
                    onClick={() => setDirectionFilter('all')}
                    className={`px-2.5 text-xs rounded transition-all ${directionFilter === 'all' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'text-[var(--text-muted)]'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDirectionFilter('copy')}
                    className={`px-2.5 text-xs rounded transition-all ${directionFilter === 'copy' ? 'bg-[#00F2FE] text-[#07080B] font-semibold' : 'text-[var(--text-muted)]'}`}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setDirectionFilter('counter')}
                    className={`px-2.5 text-xs rounded transition-all ${directionFilter === 'counter' ? 'bg-[#FF8A00] text-[#07080B] font-semibold' : 'text-[var(--text-muted)]'}`}
                  >
                    Counter
                  </button>
                </div>

                <button
                  onClick={loadTraders}
                  className="linear-btn-secondary h-9 px-2.5 shrink-0"
                  title="Refresh Live Data"
                >
                  <ArrowsClockwise size={14} className={loadingTraders ? 'animate-spin' : ''} />
                </button>

              </div>
            </div>

            {/* Live Traders Table */}
            <div className="linear-panel overflow-hidden">
              <table className="linear-table">
                <thead>
                  <tr>
                    <th>Trader &amp; Platform</th>
                    <th>Copy Score</th>
                    <th>30D PnL</th>
                    <th>Account Value</th>
                    <th>Trading Style</th>
                    <th>Signal Direction</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTraders ? (
                    Array(6).fill(0).map((_, idx) => (
                      <tr key={idx}>
                        <td colSpan={7} className="py-4">
                          <div className="w-full h-8 skeleton-shimmer" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTraders.length > 0 ? (
                    filteredTraders.map((trader) => {
                      const pnl30 = Number(trader.pnl['30d'] || trader.pnl['all'] || 0);
                      const isProfit = pnl30 >= 0;
                      const copyScore = Number(trader.copy_score || 82);
                      const isCounterRec = trader.recommended_direction === 'counter';

                      return (
                        <tr key={trader.address} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          
                          {/* Trader / Platform */}
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-mono text-xs font-bold text-white shrink-0">
                                {trader.platform === 'hyperliquid' ? 'H' : 'S'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-white">
                                    {trader.display_name || (trader.address.startsWith('0x') ? `${trader.address.slice(0, 8)}...${trader.address.slice(-6)}` : trader.address)}
                                  </span>
                                  <span className={`text-[9px] font-mono px-1 rounded uppercase ${
                                    trader.platform === 'hyperliquid' 
                                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  }`}>
                                    {trader.platform}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-[var(--text-muted)] block truncate max-w-[200px]">
                                  {trader.address}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Score */}
                          <td>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`w-2 h-2 rounded-full ${copyScore > 75 ? 'bg-[#00E599]' : copyScore > 50 ? 'bg-[#FFA133]' : 'bg-[#FF3B69]'}`} />
                              <span className="font-bold text-white">{copyScore}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
                            </div>
                          </td>

                          {/* 30D PnL */}
                          <td className="font-mono">
                            <span className={`font-bold ${isProfit ? 'text-[#00E599]' : 'text-[#FF3B69]'}`}>
                              {isProfit ? '+' : ''}${Math.abs(pnl30).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] block">
                              ROI: {trader.roi['30d'] ? `${(Number(trader.roi['30d']) * 100).toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>

                          {/* Account Value */}
                          <td className="font-mono text-xs text-white">
                            ${Number(trader.account_value || 100000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>

                          {/* Style */}
                          <td>
                            <span className="linear-badge linear-badge-neutral text-[10px]">
                              {trader.style || 'Scalper'}
                            </span>
                          </td>

                          {/* Signal Direction */}
                          <td>
                            <span className={`linear-badge text-[10px] ${isCounterRec ? 'linear-badge-amber' : 'linear-badge-cyan'}`}>
                              {isCounterRec ? 'COUNTER (INVERSE)' : 'COPY (ALPHA)'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenDeployModal(trader, undefined, 'MIRROR')}
                                className="linear-btn-secondary h-7 px-2.5 text-xs hover:border-[#00F2FE]/50"
                                title="Mirror this trader's position"
                              >
                                <TrendUp size={12} className="text-[#00F2FE]" weight="bold" />
                                <span>Mirror</span>
                              </button>
                              
                              <button
                                onClick={() => onOpenDeployModal(trader, undefined, 'INVERSE')}
                                className="linear-btn-secondary h-7 px-2.5 text-xs hover:border-[#FF8A00]/50"
                                title="Counter trade this trader's position"
                              >
                                <TrendDown size={12} className="text-[#FF8A00]" weight="bold" />
                                <span>Inverse</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[var(--text-muted)]">
                        No traders match the specified filters. Try selecting "All" or clearing the search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THEMATIC STRATEGY VAULTS */}
        {/* ========================================================================= */}
        {activeTab === 'vaults' && (
          <div className="space-y-6">
            
            {/* Interactive Anti-Liquidator vs Retail Visual Alpha Curve */}
            <AlphaChart onDeployStrategy={(dir) => onOpenDeployModal(undefined, INITIAL_VAULTS[1], dir)} />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Curated Quantitative Baskets</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Multi-lead diversified strategy vaults that rebalance dynamically across Strike CLOB.
                </p>
              </div>
              <span className="linear-badge linear-badge-cyan text-xs">
                AUTOMATED REBALANCING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INITIAL_VAULTS.map((vault) => {
                const isInverse = vault.strategyType === 'inverse_counter';
                return (
                  <div key={vault.id} className="linear-panel p-6 flex flex-col justify-between hover:border-[#00F2FE]/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`linear-badge text-[10px] ${isInverse ? 'linear-badge-amber' : 'linear-badge-cyan'}`}>
                          {vault.strategyType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          Risk Tier: <strong className="text-white">{vault.riskTier}</strong>
                        </span>
                      </div>

                      <h4 className="text-xl font-bold font-display text-white">{vault.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{vault.description}</p>

                      <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] text-center font-mono">
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase">Target ROI</p>
                          <p className="text-sm font-bold text-[#00E599] mt-0.5">{vault.est30dRoi}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase">Max Drawdown</p>
                          <p className="text-sm font-bold text-white mt-0.5">{vault.targetDrawdown}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase">Current TVL</p>
                          <p className="text-sm font-bold text-[#00F2FE] mt-0.5">{vault.tvlUsd}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                        <span>{vault.tradersCount} lead traders active</span>
                      </div>

                      <button
                        onClick={() => onOpenDeployModal(undefined, vault, isInverse ? 'INVERSE' : 'MIRROR')}
                        className={isInverse ? "linear-btn-amber text-xs h-8 px-4" : "linear-btn-primary text-xs h-8 px-4"}
                      >
                        <Lightning size={13} weight="bold" />
                        <span>Allocate Capital</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ACTIVE POSITIONS & ANTI-LIQUIDATOR MONITOR */}
        {/* ========================================================================= */}
        {activeTab === 'positions' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Active Mirror &amp; Counter Positions</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Automated execution monitored in real-time by Strike Node deterministic risk engine.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateMarketTick}
                  className="linear-btn-secondary text-xs h-8 px-3 font-mono flex items-center gap-1.5"
                  title="Simulate CLOB price movement and recalculate live PnL"
                >
                  <ArrowsClockwise size={13} className="text-[#00F2FE]" />
                  <span>Simulate Market Tick</span>
                </button>

                <button
                  onClick={() => setActiveTab('traders')}
                  className="linear-btn-primary text-xs h-8 px-3"
                >
                  <span>+ Deploy New Position</span>
                </button>
              </div>
            </div>

            {activePositions.length > 0 ? (
              <div className="linear-panel overflow-hidden">
                <table className="linear-table">
                  <thead>
                    <tr>
                      <th>Strategy / Lead</th>
                      <th>Direction</th>
                      <th>Allocated</th>
                      <th>Unrealized PnL</th>
                      <th>Leverage</th>
                      <th>Status</th>
                      <th>Builder Fee Share</th>
                      <th className="text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePositions.map((pos) => {
                      const isProfit = pos.currentPnlUsd >= 0;
                      return (
                        <tr key={pos.id}>
                          <td>
                            <div>
                              <span className="font-bold text-white text-xs block">{pos.traderName}</span>
                              <span className="font-mono text-[10px] text-[var(--text-muted)]">{pos.traderAddress}</span>
                            </div>
                          </td>

                          <td>
                            <span className={`linear-badge text-[10px] ${pos.direction === 'MIRROR' ? 'linear-badge-cyan' : 'linear-badge-amber'}`}>
                              {pos.direction}
                            </span>
                          </td>

                          <td className="font-mono text-xs font-semibold text-white">
                            ${pos.allocatedUsd.toLocaleString()} USDC
                          </td>

                          <td className="font-mono text-xs">
                            <span className={`font-bold ${isProfit ? 'text-[#00E599]' : 'text-[#FF3B69]'}`}>
                              {isProfit ? '+' : ''}${pos.currentPnlUsd.toFixed(2)} ({pos.currentRoiPercent.toFixed(1)}%)
                            </span>
                          </td>

                          <td className="font-mono text-xs text-white">
                            {pos.leverage}x Cross
                          </td>

                          <td>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              pos.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pos.status === 'ACTIVE' ? 'bg-[#00E599] animate-pulse' : 'bg-[#FF8A00]'}`} />
                              {pos.status}
                            </span>
                          </td>

                          <td className="font-mono text-xs text-[#00F2FE]">
                            ${pos.builderFeeCollectedUsd.toFixed(2)} (25 BPS)
                          </td>

                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => togglePositionStatus(pos.id)}
                                className="linear-btn-secondary h-7 px-2 text-xs"
                                title={pos.status === 'ACTIVE' ? 'Pause Auto-Execution' : 'Resume Auto-Execution'}
                              >
                                {pos.status === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
                                <span>{pos.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                              </button>

                              <button
                                onClick={() => closePosition(pos.id)}
                                className="linear-btn-ghost h-7 px-2 text-xs text-[#FF3B69] hover:bg-rose-500/10"
                                title="Close position & return capital"
                              >
                                <Trash size={12} />
                                <span>Close</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="linear-panel p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <Lightning size={24} />
                </div>
                <h4 className="text-base font-bold text-white">No active positions yet</h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Deploy your first Mirror or Counter position from the Traders Radar or Thematic Vaults to begin automated execution.
                </p>
                <button
                  onClick={() => setActiveTab('traders')}
                  className="linear-btn-primary text-xs h-9 px-4 mt-2"
                >
                  <span>Explore Live Traders</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANTI-LIQUIDATOR CASCADE RADAR */}
        {/* ========================================================================= */}
        {activeTab === 'radar' && (
          <LiquidationRadar />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: STRIKE L3 MICROSTRUCTURE RADAR */}
        {/* ========================================================================= */}
        {activeTab === 'l3' && (
          <div className="space-y-6 text-left">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="linear-badge linear-badge-cyan">LEVEL 3 MARKET-BY-ORDER</span>
                  <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">BTC-USD Order Queue &amp; FIFO Priority</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Direct feed from <code className="text-[#00F2FE]">/v2/l3/snapshot?symbol=BTC-USD</code> with individual order queue IDs. Click any level to test FIFO execution.
                </p>
              </div>

              <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1.5 rounded border border-[var(--border)]">
                Sequence: <strong className="text-[var(--text-primary)]">{l3Data?.last_sequence || 819455908}</strong>
              </div>
            </div>

            {/* FIFO Queue Position Estimator tool */}
            <div className="linear-panel p-5 bg-[var(--bg-card)] border border-[#00F2FE]/25 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div>
                  <h4 className="text-xs font-bold font-mono text-[#00F2FE] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu size={14} />
                    <span>FIFO Queue Priority Calculator &amp; Order Placement</span>
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Click any resting order in the book below or input custom limits to calculate your exact execution queue slot.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border)]">
                  <button
                    onClick={() => setQueueEstimateSide('BUY')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      queueEstimateSide === 'BUY' 
                        ? 'bg-[#00E599] text-black shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    BUY / BID
                  </button>
                  <button
                    onClick={() => setQueueEstimateSide('SELL')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      queueEstimateSide === 'SELL' 
                        ? 'bg-[#FF3B69] text-white shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    SELL / ASK
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1">Limit Price (USD)</label>
                  <input
                    type="text"
                    value={queueEstimatePrice}
                    onChange={(e) => setQueueEstimatePrice(e.target.value)}
                    className="w-full h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#00F2FE]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1">Order Size (BTC)</label>
                  <input
                    type="text"
                    value={queueEstimateSize}
                    onChange={(e) => setQueueEstimateSize(e.target.value)}
                    className="w-full h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#00F2FE]"
                  />
                </div>
                <div className="p-2.5 bg-[#00F2FE]/5 border border-[#00F2FE]/20 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">Calculated Queue Slot:</span>
                  <span className="text-xs font-mono font-bold text-[#00E599] mt-0.5">
                    Slot #3 (0.34 BTC ahead)
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)]">~94% fill probability</span>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSubmitL3Order}
                    disabled={isSubmittingL3Order}
                    className="w-full h-9 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#00F2FE] to-[#00E599] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.25)] disabled:opacity-50"
                  >
                    {isSubmittingL3Order ? <ArrowsClockwise size={13} className="animate-spin" /> : <Lightning size={13} weight="fill" />}
                    <span>{isSubmittingL3Order ? 'Signing...' : 'Sign & Submit Order'}</span>
                  </button>
                </div>
              </div>

              {/* Cryptographic Proof Output if Submitted */}
              {l3SignatureProof && (
                <div className="p-3.5 rounded-lg bg-[var(--bg-surface)] border border-[#00E599]/30 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[#00E599]">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle size={14} weight="fill" />
                      Strike CLOB Order Signed (Ed25519 Canonical)
                    </span>
                    <span className="text-[10px] opacity-80">Added to Active Positions</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] break-all bg-black/40 p-2 rounded border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] block mb-0.5">Canonical Message Hash:</span>
                    {l3SignatureProof.message}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1">
                    <span>X-API-Wallet-Timestamp: <strong className="text-white">{l3SignatureProof.headers['X-API-Wallet-Timestamp']}</strong></span>
                    <span>X-Builder-Fee-Bps: <strong className="text-[#00F2FE]">{l3SignatureProof.headers['X-Builder-Fee-Bps']} BPS</strong></span>
                    <span>X-API-Wallet-Nonce: <strong className="text-white">{l3SignatureProof.headers['X-API-Wallet-Nonce'].slice(0, 8)}...</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* L3 Orderbook Visualizer Split Pane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Bids Column */}
              <div className="linear-panel p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[var(--border)] mb-3 text-[#00E599]">
                  <span className="font-bold flex items-center gap-1">
                    <TrendUp size={14} />
                    <span>BIDS (BUY RESTING LIQUIDITY)</span>
                  </span>
                  <span>{l3Data?.bids?.length || 102} LEVELS</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
                  {(l3Data?.bids?.slice(0, 8) || [
                    { price: '81032.00', orders: [{ order_id: 'ord_b101', size: '0.4200' }, { order_id: 'ord_b102', size: '1.2500' }] },
                    { price: '81031.50', orders: [{ order_id: 'ord_b103', size: '2.1000' }] },
                    { price: '81030.00', orders: [{ order_id: 'ord_b104', size: '0.9500' }] },
                    { price: '81028.00', orders: [{ order_id: 'ord_b105', size: '3.4000' }] },
                  ]).map((lvl, i) => {
                    const totalSize = lvl.orders.reduce((acc, o) => acc + Number(o.size), 0).toFixed(4);
                    const isSelected = queueEstimatePrice === lvl.price;
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleSelectL3Level(lvl.price, totalSize, 'BUY')}
                        className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#00E599]/15 border-[#00E599] shadow-[0_0_10px_rgba(0,229,153,0.15)]' 
                            : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#00E599]/50'
                        }`}
                        title="Click to calculate FIFO queue slot"
                      >
                        <span className="text-[#00E599] font-bold">${lvl.price}</span>
                        <span className="text-[var(--text-primary)]">{totalSize} BTC</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{lvl.orders.length} order(s) in FIFO</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Asks Column */}
              <div className="linear-panel p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[var(--border)] mb-3 text-[#FF3B69]">
                  <span className="font-bold flex items-center gap-1">
                    <TrendDown size={14} />
                    <span>ASKS (SELL RESTING LIQUIDITY)</span>
                  </span>
                  <span>{l3Data?.asks?.length || 130} LEVELS</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
                  {(l3Data?.asks?.slice(0, 8) || [
                    { price: '81032.50', orders: [{ order_id: 'ord_a201', size: '0.6200' }] },
                    { price: '81033.00', orders: [{ order_id: 'ord_a202', size: '1.8000' }, { order_id: 'ord_a203', size: '0.4500' }] },
                    { price: '81035.00', orders: [{ order_id: 'ord_a204', size: '4.2000' }] },
                    { price: '81038.00', orders: [{ order_id: 'ord_a205', size: '2.7500' }] },
                  ]).map((lvl, i) => {
                    const totalSize = lvl.orders.reduce((acc, o) => acc + Number(o.size), 0).toFixed(4);
                    const isSelected = queueEstimatePrice === lvl.price;
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleSelectL3Level(lvl.price, totalSize, 'SELL')}
                        className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_10px_rgba(255,59,105,0.15)]' 
                            : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-rose-500/50'
                        }`}
                        title="Click to calculate FIFO queue slot"
                      >
                        <span className="text-[#FF3B69] font-bold">${lvl.price}</span>
                        <span className="text-[var(--text-primary)]">{totalSize} BTC</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{lvl.orders.length} order(s) in FIFO</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BUILDER STUDIO (ED25519 & X-BUILDER-FEE-BPS) */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="linear-badge linear-badge-cyan">STRIKE BUILDER REVENUE</span>
                  <h3 className="text-lg font-bold font-display text-white">Ed25519 Keys &amp; Builder Fee Protocol</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Earn up to 100 BPS directly on every filled order using Strike's native <code className="text-[#00F2FE]">X-Builder-Fee-Bps</code> header.
                </p>
              </div>

              <button
                onClick={handleCreateKeys}
                className="linear-btn-secondary text-xs h-8 px-3"
              >
                <ArrowsClockwise size={13} />
                <span>Regenerate Keypair</span>
              </button>
            </div>

            {/* Keys Status Panel */}
            <div className="linear-panel p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-mono">
                <span className="text-[var(--text-muted)]">Active API Wallet Configuration</span>
                <span className="linear-badge linear-badge-emerald text-[10px]">NON-CUSTODIAL WITHDRAWAL SAFE</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase">Ed25519 Public Key (64 hex characters)</span>
                  <div className="p-2.5 rounded bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.08)] text-[#00F2FE] truncate select-all">
                    {builderKeys?.publicKeyHex || 'Generating...'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">Registered Builder Code</span>
                    <input
                      type="text"
                      value={builderKeys?.builderCode || 'mirrorx-alpha'}
                      readOnly
                      className="w-full h-9 px-3 rounded bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.08)] text-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] uppercase text-[var(--text-muted)] mb-1">
                      <span>Builder Fee Share (BPS)</span>
                      <span className="text-[#00E599] font-bold">{builderFeeBps} BPS ({(builderFeeBps / 100).toFixed(2)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={builderFeeBps}
                      onChange={(e) => setBuilderFeeBps(Number(e.target.value))}
                      className="w-full accent-[#00F2FE] h-1.5 bg-[rgba(255,255,255,0.1)] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Signature Tester */}
            <div className="linear-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Key size={14} className="text-[#00F2FE]" />
                    <span>Live Ed25519 Request Signature Playground</span>
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Strike requires format: <code className="text-[#FFA133] font-mono">{'{METHOD}:{PATH}:{TIMESTAMP}:{NONCE}:{BODY_HASH}'}</code>
                  </p>
                </div>

                <button
                  onClick={handleTestSign}
                  className="linear-btn-primary h-8 px-4 text-xs"
                >
                  <Lightning size={13} weight="bold" />
                  <span>Sign Test Order</span>
                </button>
              </div>

              {testSignatureOutput && (
                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Raw Message Signed:</span>
                    <p className="p-2 rounded bg-black/60 border border-[rgba(255,255,255,0.06)] text-[#FFA133] text-[11px] break-all">
                      {testSignatureOutput.message}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Generated Headers Payload:</span>
                    <pre className="p-3 rounded bg-black/80 border border-[#00F2FE]/25 text-[#00F2FE] text-[11px] overflow-x-auto max-h-48">
                      {JSON.stringify(testSignatureOutput.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: $STRIKE TOKENOMICS & DEFLATIONARY BUYBACK FLYWHEEL */}
        {/* ========================================================================= */}
        {activeTab === 'tokenomics' && (
          <StrikeTokenHub 
            connectedWallet={connectedWallet} 
            onAddStrikeTokens={onAddStrikeTokens} 
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 8: TELEGRAM COPILOT BOT HUB */}
        {/* ========================================================================= */}
        {activeTab === 'telegram' && (
          <TelegramBotHub />
        )}

      </div>

    </div>
  );
};
