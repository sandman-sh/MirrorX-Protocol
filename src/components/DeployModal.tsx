import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  TrendUp, 
  TrendDown, 
  ShieldCheck, 
  Lightning, 
  Key, 
  ArrowsClockwise, 
  Sliders, 
  CheckCircle,
  CurrencyDollar,
  Sparkle,
  Wallet
} from '@phosphor-icons/react';
import { DiscoveryTrader, StrategyVault, ActiveMirror, ConnectedWallet } from '../types';
import { generateApiWalletKeys, getStoredApiWalletKeys, signStrikeRequest } from '../services/walletService';
import { dispatchTradeAlert } from '../services/telegramService';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTrader?: DiscoveryTrader | null;
  targetVault?: StrategyVault | null;
  initialDirection?: 'MIRROR' | 'INVERSE';
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onPositionCreated: (pos: ActiveMirror) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  targetTrader,
  targetVault,
  initialDirection = 'MIRROR',
  connectedWallet,
  onOpenWalletModal,
  onPositionCreated
}) => {
  const availableBalance = connectedWallet?.collateralUsd ?? 12500;
  const effectiveFeeBps = connectedWallet?.effectiveFeeBps ?? 25;
  const strikeTier = connectedWallet?.strikeTier ?? 'Bronze';
  const discountBps = connectedWallet?.discountBps ?? 0;

  const [direction, setDirection] = useState<'MIRROR' | 'INVERSE'>(initialDirection);
  const [allocation, setAllocation] = useState<number>(Math.min(1000, availableBalance));
  const [leverage, setLeverage] = useState<number>(3);
  const [slippage, setSlippage] = useState<number>(0.2);
  const [stopLoss, setStopLoss] = useState<number>(8);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [signedPreview, setSignedPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetName = targetVault?.name || targetTrader?.display_name || (
    targetTrader?.address.startsWith('0x') 
      ? `${targetTrader.address.slice(0, 8)}...${targetTrader.address.slice(-6)}` 
      : targetTrader?.address || 'Lead Alpha Account'
  );

  const platform = targetVault?.platform === 'hyperliquid' ? 'Hyperliquid' : (targetTrader?.platform || 'Strike');

  function handleSetPercent(pct: number) {
    const amt = Math.floor((availableBalance * pct) / 100);
    setAllocation(Math.max(50, amt));
  }

  async function handleGenerateSignaturePreview() {
    let keys = getStoredApiWalletKeys();
    if (!keys) {
      keys = await generateApiWalletKeys('mirrorx-alpha', effectiveFeeBps);
    }

    const path = '/v2/order';
    const body = {
      symbol: 'BTC-USD',
      side: direction === 'MIRROR' ? 'BUY' : 'SELL',
      type: 'LIMIT',
      size: (allocation / 81000).toFixed(4),
      price: '81032',
      builder_code: keys.builderCode,
      builder_fee_bps: effectiveFeeBps
    };

    const signed = await signStrikeRequest(keys, 'POST', path, body);
    setSignedPreview(JSON.stringify(signed.headers, null, 2));
  }

  async function handleDeploy() {
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }

    setIsDeploying(true);
    let keys = getStoredApiWalletKeys();
    if (!keys) {
      keys = await generateApiWalletKeys('mirrorx-alpha', effectiveFeeBps);
    }

    // Sign payload
    await signStrikeRequest(keys, 'POST', '/v2/order', {
      symbol: 'BTC-USD',
      side: direction === 'MIRROR' ? 'BUY' : 'SELL',
      size: (allocation / 81000).toFixed(4),
      builder_fee_bps: effectiveFeeBps
    });

    // Execute order on Strike CLOB
    setTimeout(() => {
      const newPos: ActiveMirror = {
        id: `pos-${Date.now()}`,
        traderAddress: targetTrader?.address || targetVault?.id || '0x5b5d...c060',
        traderName: targetName,
        platform: targetTrader?.platform || 'hyperliquid',
        direction,
        allocatedUsd: allocation,
        currentPnlUsd: 0,
        currentRoiPercent: 0,
        symbol: 'BTC-USD',
        side: direction === 'MIRROR' ? 'BUY' : 'SELL',
        leverage,
        status: 'ACTIVE',
        lastRebalance: 'Just now',
        builderFeeCollectedUsd: allocation * (effectiveFeeBps / 10000)
      };

      onPositionCreated(newPos);
      setIsDeploying(false);

      dispatchTradeAlert({
        direction,
        targetName,
        symbol: 'BTC-USD',
        side: direction === 'MIRROR' ? 'BUY' : 'SELL',
        amountUsd: allocation,
        leverage,
        price: 81032,
        builderFeeUsd: allocation * (effectiveFeeBps / 10000)
      });

      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.7 },
        colors: direction === 'MIRROR' ? ['#00F2FE', '#4FACFE', '#00E599'] : ['#FF8A00', '#FF5E3A', '#FFA133']
      });

      onClose();
    }, 700);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="linear-panel-elevated max-w-lg w-full p-6 sm:p-7 border border-[var(--border-medium)] bg-[var(--bg-surface)] relative text-left shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className={`linear-badge text-[10px] ${direction === 'MIRROR' ? 'linear-badge-cyan' : 'linear-badge-amber'}`}>
              {direction} STRATEGY
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">Target: {platform}</span>
          </div>
          <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mt-1.5">{targetName}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure capital allocation, automated hedging direction, and Strike Node order rules.
          </p>
        </div>

        {/* Direction Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[rgba(255,255,255,0.06)] mb-5">
          <button
            onClick={() => setDirection('MIRROR')}
            className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
              direction === 'MIRROR' 
                ? 'bg-[#00F2FE] text-[#07080B] shadow-[0_0_12px_rgba(0,242,254,0.3)]' 
                : 'text-[var(--text-secondary)] hover:text-white bg-transparent'
            }`}
          >
            <TrendUp size={14} weight="bold" />
            <span>Mirror Alpha</span>
          </button>

          <button
            onClick={() => setDirection('INVERSE')}
            className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
              direction === 'INVERSE' 
                ? 'bg-gradient-to-r from-[#FF9900] to-[#FF5E3A] text-[#07080B] shadow-[0_0_12px_rgba(255,138,0,0.3)]' 
                : 'text-[var(--text-secondary)] hover:text-white bg-transparent'
            }`}
          >
            <TrendDown size={14} weight="bold" />
            <span>Inverse Counter</span>
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          
          {/* Capital Allocation & Quick Percentage Buttons */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Capital Allocation (USD)</span>
              <span className="text-white font-bold">
                Available: ${availableBalance.toLocaleString()} USDC
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="50"
                max={availableBalance}
                step="50"
                value={allocation}
                onChange={(e) => setAllocation(Math.min(availableBalance, Math.max(50, Number(e.target.value))))}
                className="w-full h-10 px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-md text-white font-mono text-sm focus:outline-none focus:border-[#00F2FE]"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-[var(--text-muted)]">USDC</span>
            </div>

            {/* Percent shortcuts */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleSetPercent(pct)}
                  className="py-1 rounded bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-white transition-all"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage & Stop Loss Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Leverage</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-[#00F2FE] h-1.5 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Stop Loss Guard</span>
                <span className="text-[#FF3B69] font-bold">-{stopLoss}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full accent-[#FF3B69] h-1.5 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Protocol Guarantee Pill with STRIKE Tier Discount */}
          <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-[11px] font-mono space-y-1 text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Builder Fee Rate</span>
              <span className="text-[#00F2FE] font-bold flex items-center gap-1">
                {discountBps > 0 && <Sparkle size={12} weight="fill" className="text-[#00E599]" />}
                <span>{effectiveFeeBps} BPS ({(effectiveFeeBps / 100).toFixed(2)}%)</span>
                {discountBps > 0 && <span className="text-[#00E599] text-[10px]">({strikeTier} Tier)</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Execution Layer</span>
              <span className="text-white">Strike Node CLOB (Zero MEV)</span>
            </div>
            <div className="flex justify-between">
              <span>Custody</span>
              <span className="text-[#00E599]">Non-Custodial Multi-Chain Locker</span>
            </div>
          </div>

          {/* Cryptographic Signature Inspector Preview */}
          <div>
            <button
              onClick={handleGenerateSignaturePreview}
              type="button"
              className="text-[11px] text-[#00F2FE] hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <Key size={12} />
              <span>{signedPreview ? 'Hide Ed25519 Payload' : 'Inspect Strike Ed25519 Signature Payload'}</span>
            </button>
            {signedPreview && (
              <pre className="mt-2 p-2.5 rounded bg-black/60 border border-[rgba(255,255,255,0.08)] text-[10px] font-mono text-[var(--text-muted)] overflow-x-auto max-h-28">
                {signedPreview}
              </pre>
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="linear-btn-secondary h-10 px-4 text-xs"
          >
            <span>Cancel</span>
          </button>
          
          {connectedWallet ? (
            <button
              onClick={handleDeploy}
              disabled={isDeploying || allocation <= 0}
              className={direction === 'MIRROR' ? 'linear-btn-primary h-10 px-6 text-xs' : 'linear-btn-amber h-10 px-6 text-xs'}
            >
              {isDeploying ? (
                <span className="flex items-center gap-2">
                  <ArrowsClockwise size={14} className="animate-spin" />
                  <span>Sequencing on Strike Node...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lightning size={14} weight="bold" />
                  <span>Deploy {direction === 'MIRROR' ? 'Mirror' : 'Counter'} Position</span>
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="linear-btn-primary h-10 px-6 text-xs flex items-center gap-2"
            >
              <Wallet size={15} weight="bold" />
              <span>Connect Wallet to Deploy</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
