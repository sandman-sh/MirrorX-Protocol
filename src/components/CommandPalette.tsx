import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlass, 
  TerminalWindow, 
  TrendUp, 
  TrendDown, 
  Cpu, 
  Coins, 
  Wallet, 
  X, 
  ArrowRight 
} from '@phosphor-icons/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'tab-traders', title: 'Traders Radar (Live Discovery)', category: 'Navigation', icon: <TrendUp size={16} className="text-[#00F2FE]" />, shortcut: '1' },
    { id: 'tab-vaults', title: 'Thematic Strategy Vaults', category: 'Navigation', icon: <Coins size={16} className="text-[#00E599]" />, shortcut: '2' },
    { id: 'tab-positions', title: 'Active Positions & Anti-Liquidator', category: 'Navigation', icon: <TrendDown size={16} className="text-[#FF8A00]" />, shortcut: '3' },
    { id: 'tab-l3', title: 'Strike L3 Market-by-Order Radar', category: 'Microstructure', icon: <Cpu size={16} className="text-[#00F2FE]" />, shortcut: '4' },
    { id: 'tab-builder', title: 'Builder Code & Ed25519 Studio', category: 'Developer', icon: <TerminalWindow size={16} className="text-white" />, shortcut: '5' },
    { id: 'action-connect-wallet', title: 'Connect Solana / EVM / Cardano Wallet', category: 'Wallet', icon: <Wallet size={16} className="text-indigo-400" /> },
    { id: 'filter-hyperliquid', title: 'Filter: Hyperliquid Traders Only', category: 'Filters', icon: <MagnifyingGlass size={16} /> },
    { id: 'filter-strike', title: 'Filter: Strike Native Traders Only', category: 'Filters', icon: <MagnifyingGlass size={16} /> },
    { id: 'filter-counter', title: 'Filter: Recommended Counter-Trades', category: 'Filters', icon: <TrendDown size={16} className="text-[#FFA133]" /> },
  ];

  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="linear-panel-elevated max-w-xl w-full border border-[var(--border-medium)] bg-[var(--bg-surface)] overflow-hidden text-left shadow-2xl">
        
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
          <MagnifyingGlass size={18} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Type a command, trader address, or strategy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-[var(--text-muted)] font-sans"
          />
          <span className="linear-kbd">ESC</span>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectAction(item.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[rgba(255,255,255,0.04)]">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-white font-medium group-hover:text-[#00F2FE] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                      {item.category}
                    </span>
                  </div>
                </div>

                {item.shortcut && (
                  <span className="linear-kbd">{item.shortcut}</span>
                )}
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No matching commands or traders found for "{query}".
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 bg-[rgba(0,0,0,0.5)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>Navigate with arrows</span>
          <span>Press Enter to select</span>
        </div>

      </div>
    </div>
  );
};
