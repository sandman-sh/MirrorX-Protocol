import { DiscoverTradersResponse, DiscoveryTrader, L3Snapshot, TickerPrice } from '../types';

const API_BASE = '/api';
const PRICE_API_BASE = '/price-api';

export async function getDiscoverTraders(params: {
  platform?: 'hyperliquid' | 'strike' | 'all';
  rank_by?: 'pnl_30d' | 'equity' | 'volume_30d';
  sort?: string;
  order?: 'desc' | 'asc';
  style?: string;
  bias?: 'long' | 'short' | 'neutral';
  limit?: number;
  min_copy_score?: string;
  search?: string;
}): Promise<DiscoverTradersResponse> {
  const query = new URLSearchParams();
  if (params.platform) query.set('platform', params.platform);
  if (params.rank_by) query.set('rank_by', params.rank_by);
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  if (params.style) query.set('style', params.style);
  if (params.bias) query.set('bias', params.bias);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.min_copy_score) query.set('min_copy_score', params.min_copy_score);
  if (params.search) query.set('search', params.search);

  try {
    const res = await fetch(`${API_BASE}/v2/copy/discover?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: DiscoverTradersResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Proxy fetch failed, attempting direct fetch...', err);
    try {
      const directRes = await fetch(`https://api.strikefinance.org/v2/copy/discover?${query.toString()}`);
      if (!directRes.ok) throw new Error(`HTTP error ${directRes.status}`);
      return await directRes.json();
    } catch (secondErr) {
      console.error('All discovery endpoints failed:', secondErr);
      throw secondErr;
    }
  }
}

export async function getDiscoveredTrader(address: string): Promise<DiscoveryTrader> {
  try {
    const res = await fetch(`${API_BASE}/v2/copy/discover/${address}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    const directRes = await fetch(`https://api.strikefinance.org/v2/copy/discover/${address}`);
    return await directRes.json();
  }
}

export async function getLivePrices(): Promise<TickerPrice[]> {
  try {
    const res = await fetch(`${PRICE_API_BASE}/v2/ticker/price`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    try {
      const directRes = await fetch(`https://api.strikefinance.org/price/v2/ticker/price`);
      return await directRes.json();
    } catch (secondErr) {
      console.error('Failed to fetch live prices:', secondErr);
      return [];
    }
  }
}

export async function getL3Snapshot(symbol = 'BTC-USD'): Promise<L3Snapshot | null> {
  try {
    const res = await fetch(`${API_BASE}/v2/l3/snapshot?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    try {
      const directRes = await fetch(`https://api.strikefinance.org/v2/l3/snapshot?symbol=${encodeURIComponent(symbol)}`);
      return await directRes.json();
    } catch (secondErr) {
      console.error('Failed to fetch L3 snapshot:', secondErr);
      return null;
    }
  }
}
