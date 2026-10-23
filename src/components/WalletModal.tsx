import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  Key, 
  Lightning,
  Sparkle,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { ConnectedWallet } from '../types';
import { connectBrowserWallet, createDemoWallet } from '../services/walletService';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (wallet: ConnectedWallet) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess
}) => {
  const [selectedChain, setSelectedChain] = useState<'cardano' | 'solana' | 'ethereum'>('cardano');
  const [connecting, setConnecting] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Detect installed browser extensions
    const detected: { [key: string]: boolean } = {};
    if (typeof window !== 'undefined') {
      if ((window as any).solana?.isPhantom) detected['phantom'] = true;
      if ((window as any).solana) detected['solana_generic'] = true;
      if ((window as any).ethereum) detected['metamask'] = true;
      if ((window as any).cardano) {
        if ((window as any).cardano.eternl) detected['eternl'] = true;
        if ((window as any).cardano.flint) detected['flint'] = true;
        if ((window as any).cardano.nami) detected['nami'] = true;
        if ((window as any).cardano.lace) detected['lace'] = true;
      }
    }
    setDetectedWallets(detected);
  }, [isOpen]);

  if (!isOpen) return null;

  const wallets = [
    // Cardano Wallets
    {
      id: 'eternl',
      name: 'Eternl Wallet',
      chain: 'cardano',
      badge: 'CIP-30',
      icon: '🟦',
      desc: 'Cardano dApp connector (ADA & native collateral)',
      isDetected: !!detectedWallets['eternl']
    },
    {
      id: 'flint',
      name: 'Flint Wallet',
      chain: 'cardano',
      badge: 'CIP-30',
      icon: '🔥',
      desc: 'Cardano DeFi & multi-asset locker',
      isDetected: !!detectedWallets['flint']
    },
    {
      id: 'lace',
      name: 'Lace by IOG',
      chain: 'cardano',
      badge: 'CIP-30',
      icon: '✨',
      desc: 'Official Input Output Global light wallet',
      isDetected: !!detectedWallets['lace']
    },
    // Solana Wallets
    {
      id: 'phantom',
      name: 'Phantom',
      chain: 'solana',
      badge: 'SOL',
      icon: '🟣',
      desc: 'Solana native (USDC & SOL locker)',
      isDetected: !!detectedWallets['phantom']
    },
    {
      id: 'solflare',
      name: 'Solflare',
      chain: 'solana',
      badge: 'SOL',
      icon: '☀️',
      desc: 'Non-custodial Solana DeFi gateway',
      isDetected: !!detectedWallets['solana_generic']
    },
    // Ethereum / EVM Wallets
    {
      id: 'metamask',
      name: 'MetaMask / EVM',
      chain: 'ethereum',
      badge: 'EIP-1193',
      icon: '🦊',
      desc: 'Ethereum, Arbitrum, Base (ETH & USDC)',
      isDetected: !!detectedWallets['metamask']
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      chain: 'ethereum',
      badge: 'EVM',
      icon: '🐰',
      desc: 'Game-changing institutional multi-chain wallet',
      isDetected: !!detectedWallets['metamask']
    }
  ];

  async function handleConnect(walletItem: typeof wallets[0]) {
    setConnecting(true);
    try {
      const wallet = await connectBrowserWallet(walletItem.chain as any, walletItem.id);
      
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00F2FE', '#00E599', '#FF8A00']
      });

      onConnectSuccess(wallet);
      onClose();
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleInstantSandbox() {
    setConnecting(true);
    try {
      const wallet = await createDemoWallet(selectedChain, `Instant Sandbox (${selectedChain.toUpperCase()})`);
      
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F2FE', '#00E599', '#38F8FF']
      });

      onConnectSuccess(wallet);
      onClose();
    } catch (err) {
      console.error('Sandbox connection failed:', err);
    } finally {
      setConnecting(false);
    }
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
            <span className="linear-badge linear-badge-cyan text-[10px]">MULTI-CHAIN STRIKE LOCKER</span>
            <span className="text-[10px] font-mono text-[#00E599] flex items-center gap-1">
              <ShieldCheck size={12} weight="fill" />
              NON-CUSTODIAL
            </span>
          </div>
          <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mt-1.5">Connect Master Wallet</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Connect Cardano, Solana, or Ethereum to deposit collateral and authorize your withdrawal-safe Ed25519 session key.
          </p>
        </div>

        {/* Instant Sandbox Banner for Judges & Testing */}
        <div className="mb-4 p-3.5 rounded-lg bg-gradient-to-r from-[rgba(0,242,254,0.12)] to-[rgba(0,229,153,0.08)] border border-[#00F2FE]/30 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkle size={14} className="text-[#00F2FE]" weight="fill" />
              <span className="text-xs font-bold text-white font-mono">1-Click Instant Evaluation Sandbox</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Pre-loaded with <strong>$12,500 USDC</strong> collateral + <strong>1,500 $STRIKE</strong> (Tier 2 Gold: 80% discount).
            </p>
          </div>
          <button
            onClick={handleInstantSandbox}
            disabled={connecting}
            className="linear-btn-primary shrink-0 text-xs h-8 px-3.5 whitespace-nowrap"
          >
            <Lightning size={13} weight="bold" />
            <span>Connect Sandbox</span>
          </button>
        </div>

        {/* Chain selector pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['cardano', 'solana', 'ethereum'] as const).map((chain) => (
            <button
              key={chain}
              onClick={() => setSelectedChain(chain)}
              className={`py-2 px-2.5 rounded-md text-xs font-mono capitalize transition-all border flex items-center justify-center gap-1.5 ${
                selectedChain === chain 
                  ? 'border-[#00F2FE] bg-[rgba(0,242,254,0.12)] text-[#00F2FE] font-bold shadow-xs'
                  : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{chain === 'cardano' ? '🟦 Cardano' : chain === 'solana' ? '🟣 Solana' : '🦊 EVM'}</span>
            </button>
          ))}
        </div>

        {/* Wallet Options list */}
        <div className="space-y-2">
          {wallets
            .filter(w => w.chain === selectedChain)
            .map((w) => (
              <button
                key={w.id}
                onClick={() => handleConnect(w)}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] hover:border-[#00F2FE]/40 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{w.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[#00F2FE] transition-colors">{w.name}</p>
                      <span className="linear-badge text-[9px] px-1.5 py-0.2">{w.badge}</span>
                      {w.isDetected && (
                        <span className="text-[10px] text-[#00E599] font-mono flex items-center gap-0.5">
                          <CheckCircle size={10} weight="fill" />
                          Installed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">{w.desc}</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-[var(--text-muted)] group-hover:text-[#00F2FE] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
        </div>

        {/* Security Notice */}
        <div className="mt-5 p-3 rounded-lg bg-[rgba(0,242,254,0.04)] border border-[rgba(0,242,254,0.15)] flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
          <Key size={18} className="text-[#00F2FE] shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-medium">Asymmetric Cryptographic Protection:</span> Delegated Ed25519 session keys execute high-speed orders on the Strike CLOB, but 
            <strong className="text-[#00F2FE]"> can never withdraw assets</strong>. Withdrawals strictly require explicit signatures from your master wallet on Cardano, Solana, or Ethereum.
          </div>
        </div>

      </div>
    </div>
  );
};
