export interface DiscoveryWindows {
  '1d'?: string;
  '7d'?: string;
  '30d'?: string;
  'all'?: string;
}

export interface DiscoveryTrader {
  address: string;
  platform: 'hyperliquid' | 'strike';
  display_name?: string;
  ada_handle?: string;
  blockchain_address?: string;
  avatar_url?: string;
  account_value?: string;
  pnl: DiscoveryWindows;
  roi: DiscoveryWindows;
  volume: DiscoveryWindows;
  enrichment_state: string;
  equity_curve_30d?: [number, number][];
  pnl_curve_30d?: [number, number][];
  top_assets?: { asset?: string; symbol?: string }[];
  style?: 'market_maker' | 'algo' | 'scalper' | 'day' | 'swing' | 'position' | 'inactive' | 'unknown';
  bias?: 'long' | 'short' | 'neutral';
  copy_score?: string;
  copy_scores?: { '7d'?: string; '30d'?: string; 'all'?: string };
  recommended_direction?: 'copy' | 'counter' | 'none';
  last_traded_at_ms?: number;
  peak_concurrent_entries?: string;
  fills_window_days?: string;
}

export interface DiscoverTradersResponse {
  items: DiscoveryTrader[];
  next_cursor?: string;
  total: number;
  data_as_of_ms: number;
}

export interface TickerPrice {
  symbol: string;
  price: string;
  time: number;
}

export interface L3SnapshotOrder {
  order_id: string;
  size: string;
}

export interface L3PriceLevel {
  price: string;
  orders: L3SnapshotOrder[];
}

export interface L3Snapshot {
  type: string;
  symbol: string;
  last_sequence: number;
  timestamp: number;
  bids: L3PriceLevel[];
  asks: L3PriceLevel[];
}

export interface StrategyVault {
  id: string;
  name: string;
  tagline: string;
  strategyType: 'alpha_mirror' | 'inverse_counter' | 'delta_neutral' | 'market_maker';
  platform: 'hyperliquid' | 'strike' | 'cross';
  tradersCount: number;
  targetDrawdown: string;
  est30dRoi: string;
  tvlUsd: string;
  activePositions: number;
  description: string;
  riskTier: 'Low' | 'Medium' | 'High' | 'Aggressive';
  traderAddresses: string[];
}

export interface ActiveMirror {
  id: string;
  traderAddress: string;
  traderName: string;
  platform: 'hyperliquid' | 'strike';
  direction: 'MIRROR' | 'INVERSE';
  allocatedUsd: number;
  currentPnlUsd: number;
  currentRoiPercent: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  leverage: number;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  lastRebalance: string;
  builderFeeCollectedUsd: number;
}

export interface ConnectedWallet {
  address: string;
  chain: 'solana' | 'ethereum' | 'cardano';
  walletName: string;
  collateralUsd: number;
  strikeBalance: number;
  strikeTier: 'Bronze' | 'Silver' | 'Gold' | 'Whale VIP';
  discountBps: number;
  effectiveFeeBps: number;
  connectedAt: string;
}

export interface ApiWalletKeys {
  privateKeyHex: string;
  publicKeyHex: string;
  builderCode: string;
  builderFeeBps: number;
  createdAt: string;
}
