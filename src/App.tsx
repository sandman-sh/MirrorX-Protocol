import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveTickerBar } from './components/LiveTickerBar';
import { HomePage } from './components/HomePage';
import { AppTerminal } from './components/AppTerminal';
import { DeployModal } from './components/DeployModal';
import { WalletModal } from './components/WalletModal';
import { CommandPalette } from './components/CommandPalette';
import { DiscoveryTrader, StrategyVault, ActiveMirror, ConnectedWallet } from './types';
import { 
  getStoredConnectedWallet, 
  saveConnectedWallet, 
  disconnectWallet, 
  updateWalletBalance, 
  addStrikeTokens 
} from './services/walletService';

export const App: React.FC = () => {
  // Navigation: 1st page is HomePage by default
  const [currentView, setCurrentView] = useState<'home' | 'app'>('home');
  const [terminalTab, setTerminalTab] = useState<string>('traders');

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('strike_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('strike_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Mirror/Inverse mode toggle
  const [globalMode, setGlobalMode] = useState<'MIRROR' | 'INVERSE'>('MIRROR');

  // Modals state
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Selected target for deployment
  const [selectedTrader, setSelectedTrader] = useState<DiscoveryTrader | null>(null);
  const [selectedVault, setSelectedVault] = useState<StrategyVault | null>(null);
  const [deployDirection, setDeployDirection] = useState<'MIRROR' | 'INVERSE'>('MIRROR');

  // Connected Web3 Wallet (with local storage persistence)
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(() => {
    return getStoredConnectedWallet();
  });

  // Active Positions list
  const [activePositions, setActivePositions] = useState<ActiveMirror[]>([
    {
      id: 'pos-seed-01',
      traderAddress: '0x5b5d...c060',
      traderName: 'Hyperliquid Whale #1',
      platform: 'hyperliquid',
      direction: 'MIRROR',
      allocatedUsd: 5000,
      currentPnlUsd: 418.50,
      currentRoiPercent: 8.37,
      symbol: 'BTC-USD',
      side: 'BUY',
      leverage: 3,
      status: 'ACTIVE',
      lastRebalance: '14 mins ago',
      builderFeeCollectedUsd: 12.50
    },
    {
      id: 'pos-seed-02',
      traderAddress: '0x81b5...c099',
      traderName: 'Anti-Liquidator Bot #3',
      platform: 'strike',
      direction: 'INVERSE',
      allocatedUsd: 2500,
      currentPnlUsd: 685.20,
      currentRoiPercent: 27.41,
      symbol: 'ETH-USD',
      side: 'SELL',
      leverage: 2,
      status: 'ACTIVE',
      lastRebalance: '2 hours ago',
      builderFeeCollectedUsd: 6.25
    }
  ]);

  // Open Deploy Modal
  function handleOpenDeploy(trader?: DiscoveryTrader, vault?: StrategyVault, dir: 'MIRROR' | 'INVERSE' = 'MIRROR') {
    setSelectedTrader(trader || null);
    setSelectedVault(vault || null);
    setDeployDirection(dir);
    setDeployModalOpen(true);
  }

  // Handle position created (deducts collateral from connected wallet)
  function handlePositionCreated(newPos: ActiveMirror) {
    setActivePositions((prev) => [newPos, ...prev]);
    const updated = updateWalletBalance(-newPos.allocatedUsd);
    if (updated) {
      setConnectedWallet(updated);
    }
  }

  // Handle position closed (returns capital + profit to wallet)
  function handleClosePosition(posId: string) {
    const pos = activePositions.find(p => p.id === posId);
    if (pos) {
      const returnUsd = pos.allocatedUsd + pos.currentPnlUsd;
      const updated = updateWalletBalance(returnUsd);
      if (updated) {
        setConnectedWallet(updated);
      }
      setActivePositions(prev => prev.filter(p => p.id !== posId));
    }
  }

  // Handle wallet connect
  function handleConnectSuccess(wallet: ConnectedWallet) {
    setConnectedWallet(wallet);
    saveConnectedWallet(wallet);
  }

  // Handle wallet disconnect
  function handleDisconnectWallet() {
    disconnectWallet();
    setConnectedWallet(null);
  }

  // Handle Sandbox Top-ups
  function handleAddFunds(amountUsd: number) {
    const updated = updateWalletBalance(amountUsd);
    if (updated) {
      setConnectedWallet(updated);
    }
  }

  function handleAddStrikeTokens(amount: number) {
    const updated = addStrikeTokens(amount);
    if (updated) {
      setConnectedWallet(updated);
    }
  }

  // Handle command palette actions
  function handleCommandAction(actionId: string) {
    if (actionId.startsWith('tab-')) {
      const tab = actionId.replace('tab-', '');
      setTerminalTab(tab);
      setCurrentView('app');
    } else if (actionId === 'action-connect-wallet') {
      setWalletModalOpen(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      
      {/* Real-time Strike Tickers Bar */}
      <LiveTickerBar />

      {/* Main Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        connectedWallet={connectedWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onAddFunds={handleAddFunds}
        onAddStrikeTokens={handleAddStrikeTokens}
        globalMode={globalMode}
        onToggleMode={setGlobalMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area: HomePage or AppTerminal */}
      <main className="flex-1">
        {currentView === 'home' ? (
          <HomePage
            onLaunchApp={() => setCurrentView('app')}
            onSelectTrader={(trader, dir) => {
              setCurrentView('app');
              handleOpenDeploy(trader, undefined, dir);
            }}
            globalMode={globalMode}
            onToggleMode={setGlobalMode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          <AppTerminal
            onOpenDeployModal={handleOpenDeploy}
            activePositions={activePositions}
            onUpdatePositions={setActivePositions}
            onClosePosition={handleClosePosition}
            initialTab={terminalTab}
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onAddStrikeTokens={handleAddStrikeTokens}
            globalMode={globalMode}
            onToggleMode={setGlobalMode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </main>

      {/* Modals */}
      <DeployModal
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        targetTrader={selectedTrader}
        targetVault={selectedVault}
        initialDirection={deployDirection}
        connectedWallet={connectedWallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onPositionCreated={handlePositionCreated}
      />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConnectSuccess={handleConnectSuccess}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />

    </div>
  );
};

export default App;
