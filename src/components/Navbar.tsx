import React, { useState } from 'react';
import { 
  ArrowsClockwise, 
  Wallet, 
  TerminalWindow, 
  ArrowRight, 
  House, 
  ShieldCheck, 
  MagnifyingGlass,
  CheckCircle,
  Lightning,
  Copy,
  SignOut,
  Sparkle,
  PlusCircle,
  X
} from '@phosphor-icons/react';
import { ToggleSwitch } from './ToggleSwitch';
import { ThemeToggle } from './ThemeToggle';
import { ConnectedWallet } from '../types';

interface NavbarProps {
  currentView: 'home' | 'app';
  setCurrentView: (view: 'home' | 'app') => void;
  appTab?: string;
  setAppTab?: (tab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenWalletModal: () => void;
  connectedWallet: ConnectedWallet | null;
  onDisconnectWallet: () => void;
  onAddFunds: (amountUsd: number) => void;
  onAddStrikeTokens: (amount: number) => void;
  globalMode: 'MIRROR' | 'INVERSE';
  onToggleMode: (mode: 'MIRROR' | 'INVERSE') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenCommandPalette,
  onOpenWalletModal,
  connectedWallet,
  onDisconnectWallet,
  onAddFunds,
  onAddStrikeTokens,
  globalMode,
  onToggleMode,
  theme,
  onToggleTheme
}) => {
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyAddress() {
    if (connectedWallet?.address) {
      navigator.clipboard.writeText(connectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const chainBadge = connectedWallet?.chain === 'cardano' 
    ? '🟦 Cardano' 
    : connectedWallet?.chain === 'solana' 
    ? '🟣 Solana' 
    : '🦊 EVM';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Mode switch */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('home')} 
              className="flex items-center gap-3 bg-transparent border-0 cursor-pointer p-0 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] flex items-center justify-center relative overflow-hidden group-hover:border-[#00F2FE]/50 transition-all shadow-sm">
                <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#00F2FE] to-[#0099FF] rounded-sm transform -rotate-12 translate-x-[-3px] translate-y-[-2px] opacity-90" />
                <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#FF8A00] to-[#FF3B69] rounded-sm transform rotate-45 translate-x-[3px] translate-y-[2px] opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00F2FE]/10 to-transparent pointer-events-none" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">
                    Mirror<span className="text-[var(--accent-cyan)]">X</span>
                  </span>
                  <span className="linear-badge linear-badge-cyan text-[9px] px-1.5 py-0.5">
                    STRIKE V2
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-mono tracking-wider font-medium hidden sm:block">
                  SMART ALPHA &amp; INVERSE FUND
                </p>
              </div>
            </button>

            {/* Quick breadcrumb indicator */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
              <span className="text-[var(--text-primary)] font-semibold">Strike Node</span>
              <span>::</span>
              <span className="text-[var(--accent-cyan)] font-bold">Deterministic CLOB</span>
            </div>
          </div>

          {/* Center / Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Mirror / Inverse Toggle */}
            <div className="hidden sm:block">
              <ToggleSwitch mode={globalMode} onToggle={onToggleMode} size="sm" />
            </div>

            {/* Dark / White Mode Toggle Button */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} size="sm" />

            {/* Command Menu Button */}
            <button 
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-3 h-9 px-3 bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] rounded-md text-xs text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            >
              <MagnifyingGlass size={14} className="text-[var(--text-muted)]" />
              <span>Search traders, vaults, markets...</span>
              <span className="linear-kbd">⌘K</span>
            </button>

            {currentView === 'home' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('app')}
                  className="linear-btn-primary group"
                  id="launch-app-nav-btn"
                >
                  <TerminalWindow size={16} weight="bold" />
                  <span>Launch Terminal</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                {connectedWallet ? (
                  <button
                    onClick={() => setWalletDrawerOpen(true)}
                    className="linear-btn-secondary h-9 text-xs border-[#00F2FE]/40 flex items-center gap-2 font-mono"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00E599]" />
                    <span className="text-white font-bold">${connectedWallet.collateralUsd.toLocaleString()}</span>
                    <span className="text-[var(--text-muted)] hidden sm:inline">| {connectedWallet.address.slice(0, 4)}...{connectedWallet.address.slice(-3)}</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenWalletModal}
                    className="linear-btn-secondary h-9 text-xs"
                  >
                    <Wallet size={15} />
                    <span>Connect</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('home')}
                  className="linear-btn-secondary text-xs h-9 px-3"
                  title="Return to Landing Page"
                >
                  <House size={15} />
                  <span className="hidden sm:inline">Overview</span>
                </button>

                {connectedWallet ? (
                  <button
                    onClick={() => setWalletDrawerOpen(true)}
                    className="linear-btn-secondary h-9 text-xs border-[#00F2FE]/40 hover:border-[#00F2FE] flex items-center gap-2 font-mono transition-all cursor-pointer shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
                    <span className="text-white font-bold">${connectedWallet.collateralUsd.toLocaleString()}</span>
                    <span className="text-[10px] text-[#00F2FE] bg-[rgba(0,242,254,0.1)] px-1.5 py-0.5 rounded hidden sm:inline">
                      {connectedWallet.strikeTier}
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">
                      {connectedWallet.address.slice(0, 4)}...{connectedWallet.address.slice(-3)}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenWalletModal}
                    className="linear-btn-primary h-9 text-xs"
                  >
                    <Wallet size={15} weight="bold" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Connected Wallet Drawer / Popover */}
      {walletDrawerOpen && connectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm h-full bg-[var(--bg-surface)] border-l border-[var(--border-medium)] p-6 flex flex-col justify-between shadow-2xl text-left overflow-y-auto">
            
            <div className="space-y-5">
              
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="linear-badge linear-badge-emerald text-[10px]">CONNECTED MASTER WALLET</span>
                  <h3 className="text-base font-bold font-display text-[var(--text-primary)] mt-1">
                    {connectedWallet.walletName}
                  </h3>
                </div>
                <button
                  onClick={() => setWalletDrawerOpen(false)}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Address with 1-click copy */}
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  <span>Network: {chainBadge}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-[#00F2FE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <CheckCircle size={12} weight="fill" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-white break-all select-all">
                  {connectedWallet.address}
                </p>
              </div>

              {/* Balances Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--bg-surface-elevated)] to-[rgba(0,242,254,0.05)] border border-[#00F2FE]/20 space-y-3">
                
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                    Available Collateral (USDC Locker)
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    ${connectedWallet.collateralUsd.toLocaleString()}.00 <span className="text-xs text-[var(--text-muted)]">USDC</span>
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">$STRIKE Staked</span>
                    <span className="text-sm font-bold font-mono text-[#00E599]">
                      {connectedWallet.strikeBalance.toLocaleString()} STRIKE
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">VIP Fee Tier</span>
                    <span className="text-xs font-bold font-mono text-[#00F2FE]">
                      {connectedWallet.strikeTier} ({connectedWallet.discountBps * 4}% Off)
                    </span>
                  </div>
                </div>

              </div>

              {/* Quick Faucet Actions */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block">Sandbox Top-Up Faucets</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAddFunds(2500)}
                    className="linear-btn-secondary text-xs h-8 px-2.5 flex items-center justify-center gap-1.5 font-mono"
                  >
                    <PlusCircle size={13} className="text-[#00E599]" />
                    <span>+$2,500 USDC</span>
                  </button>
                  <button
                    onClick={() => onAddStrikeTokens(500)}
                    className="linear-btn-secondary text-xs h-8 px-2.5 flex items-center justify-center gap-1.5 font-mono"
                  >
                    <Sparkle size={13} className="text-[#00F2FE]" weight="fill" />
                    <span>+500 $STRIKE</span>
                  </button>
                </div>
              </div>

              {/* Cryptographic Session Keys Security Notice */}
              <div className="p-3 rounded-lg bg-[rgba(0,229,153,0.04)] border border-[rgba(0,229,153,0.18)] flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                <ShieldCheck size={18} className="text-[#00E599] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Non-Custodial Session Active</strong>
                  Orders are signed using local Ed25519 memory keys. Funds can never be transferred out without master wallet authorization.
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  setWalletDrawerOpen(false);
                  onOpenWalletModal();
                }}
                className="w-full linear-btn-secondary text-xs h-9 justify-center"
              >
                <ArrowsClockwise size={14} />
                <span>Switch Wallet / Network</span>
              </button>

              <button
                onClick={() => {
                  onDisconnectWallet();
                  setWalletDrawerOpen(false);
                }}
                className="w-full h-9 rounded-md bg-[rgba(255,59,105,0.08)] hover:bg-[rgba(255,59,105,0.15)] text-[#FF3B69] border border-[rgba(255,59,105,0.25)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <SignOut size={14} />
                <span>Disconnect Wallet</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
