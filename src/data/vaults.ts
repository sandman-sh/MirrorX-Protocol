import { StrategyVault } from '../types';

export const INITIAL_VAULTS: StrategyVault[] = [
  {
    id: 'vault-hl-alpha-5',
    name: 'Hyperliquid Top 5 Alpha Kings',
    tagline: 'Equal-weight index of the top 5 consistent Hyperliquid momentum traders',
    strategyType: 'alpha_mirror',
    platform: 'hyperliquid',
    tradersCount: 5,
    targetDrawdown: '< 9.5%',
    est30dRoi: '+48.6%',
    tvlUsd: '$842,500',
    activePositions: 14,
    description: 'Dynamically tracks the top 5 Hyperliquid traders ranked by 30-day Sharpe ratio and copy score > 80. Orders are mirrored proportionally onto Strike CLOB with builder fee protection.',
    riskTier: 'Medium',
    traderAddresses: [
      '0x5b5d51203a0f9079f8aeb098a6523a13f298c060',
      '0xa1234b67890f9079f8aeb098a6523a13f298c061',
      '0xb9876543210f9079f8aeb098a6523a13f298c062',
      '0xc4567891230f9079f8aeb098a6523a13f298c063',
      '0xd7891234560f9079f8aeb098a6523a13f298c064'
    ]
  },
  {
    id: 'vault-inverse-toxic',
    name: 'Inverse Toxic Flow (Anti-Liquidator)',
    tagline: 'Systematically counter-trades traders with negative alpha and high liquidation risk',
    strategyType: 'inverse_counter',
    platform: 'cross',
    tradersCount: 8,
    targetDrawdown: '< 14.0%',
    est30dRoi: '+118.2%',
    tvlUsd: '$1,290,000',
    activePositions: 22,
    description: 'Harnesses Strike’s recommended_direction: "counter" algorithmic signal. Automatically takes the opposite side of retail FOMO and panic liquidations on BTC-USD and ETH-USD with a 1.25x reverse multiplier.',
    riskTier: 'Aggressive',
    traderAddresses: [
      '0x81b5c9284fae239079f8aeb098a6523a13f298c099',
      '0x39f28a10984ba1079f8aeb098a6523a13f298c088',
      '0x66da3198fba091079f8aeb098a6523a13f298c077'
    ]
  },
  {
    id: 'vault-strike-native',
    name: 'Strike CLOB Delta-Neutral Harvester',
    tagline: 'Market-making and funding rate arbitrage on Strike execution layer',
    strategyType: 'delta_neutral',
    platform: 'strike',
    tradersCount: 4,
    targetDrawdown: '< 3.8%',
    est30dRoi: '+26.4%',
    tvlUsd: '$2,140,000',
    activePositions: 8,
    description: 'Captures regular funding rate payments across Strike perpetuals while holding offsetting spot/collateral in Cardano & Solana locker contracts.',
    riskTier: 'Low',
    traderAddresses: [
      'strike-validator-mm-01',
      'strike-validator-mm-02'
    ]
  },
  {
    id: 'vault-macro-hedge',
    name: 'Cross-Asset Macro Swarm',
    tagline: 'Diversified exposure mirroring top swing traders across Equities, Gold, and Crypto',
    strategyType: 'alpha_mirror',
    platform: 'cross',
    tradersCount: 6,
    targetDrawdown: '< 7.2%',
    est30dRoi: '+34.1%',
    tvlUsd: '$610,000',
    activePositions: 11,
    description: 'Mirrors verified traders holding positions across SP500-USD, NVDA-USD, XAU-USD, and BTC-USD listed on Strike Finance with automated take-profit trailing stops.',
    riskTier: 'Medium',
    traderAddresses: [
      '0x992384a1078491079f8aeb098a6523a13f298c055',
      '0x442981ab928491079f8aeb098a6523a13f298c044'
    ]
  }
];
