import * as ed25519 from '@noble/ed25519';
// @ts-ignore
import { sha512, sha256 } from '@noble/hashes/sha2.js';
import { v4 as uuidv4 } from 'uuid';
import type { ApiWalletKeys, ConnectedWallet } from '../types';

// Configure ed25519 with sha512 sync implementation as specified in Strike docs
if ((ed25519 as any).hashes) {
  (ed25519 as any).hashes.sha512 = (...m: Uint8Array[]) => sha512((ed25519 as any).etc.concatBytes(...m));
}

const encoder = new TextEncoder();
const WALLET_KEY_STORAGE = 'mirrorx_strike_api_keys';
const CONNECTED_WALLET_STORAGE = 'mirrorx_connected_wallet';

export function calculateStrikeTier(strikeBalance: number): {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Whale VIP';
  discountBps: number;
  effectiveFeeBps: number;
} {
  if (strikeBalance >= 10000) {
    return { tier: 'Whale VIP', discountBps: 25, effectiveFeeBps: 0 };
  } else if (strikeBalance >= 2500) {
    return { tier: 'Gold', discountBps: 20, effectiveFeeBps: 5 };
  } else if (strikeBalance >= 500) {
    return { tier: 'Silver', discountBps: 10, effectiveFeeBps: 15 };
  } else {
    return { tier: 'Bronze', discountBps: 0, effectiveFeeBps: 25 };
  }
}

export function getStoredConnectedWallet(): ConnectedWallet | null {
  const raw = localStorage.getItem(CONNECTED_WALLET_STORAGE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConnectedWallet(wallet: ConnectedWallet | null): void {
  if (wallet) {
    localStorage.setItem(CONNECTED_WALLET_STORAGE, JSON.stringify(wallet));
  } else {
    localStorage.removeItem(CONNECTED_WALLET_STORAGE);
  }
}

export function disconnectWallet(): void {
  localStorage.removeItem(CONNECTED_WALLET_STORAGE);
}

export function updateWalletBalance(deltaUsd: number): ConnectedWallet | null {
  const current = getStoredConnectedWallet();
  if (!current) return null;
  const updated: ConnectedWallet = {
    ...current,
    collateralUsd: Math.max(0, current.collateralUsd + deltaUsd)
  };
  saveConnectedWallet(updated);
  return updated;
}

export function addStrikeTokens(amount: number): ConnectedWallet | null {
  const current = getStoredConnectedWallet();
  if (!current) return null;
  const newBalance = current.strikeBalance + amount;
  const { tier, discountBps, effectiveFeeBps } = calculateStrikeTier(newBalance);
  const updated: ConnectedWallet = {
    ...current,
    strikeBalance: newBalance,
    strikeTier: tier,
    discountBps,
    effectiveFeeBps
  };
  saveConnectedWallet(updated);
  return updated;
}

export async function createDemoWallet(
  chain: 'solana' | 'ethereum' | 'cardano', 
  walletName: string
): Promise<ConnectedWallet> {
  let address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
  if (chain === 'ethereum') address = '0x71C568753237a2a3A52394fC2B6809787eFF4382';
  if (chain === 'cardano') address = 'addr1q9k9vljrwe6q20993j0e39s0da4xuvtww2r6t0m8f3k983da';

  const strikeBalance = 1500;
  const { tier, discountBps, effectiveFeeBps } = calculateStrikeTier(strikeBalance);

  // Ensure Ed25519 keys exist
  await generateApiWalletKeys('mirrorx-alpha', effectiveFeeBps);

  const wallet: ConnectedWallet = {
    address,
    chain,
    walletName,
    collateralUsd: 12500,
    strikeBalance,
    strikeTier: tier,
    discountBps,
    effectiveFeeBps,
    connectedAt: new Date().toISOString()
  };

  saveConnectedWallet(wallet);
  return wallet;
}

export async function connectBrowserWallet(
  chain: 'solana' | 'ethereum' | 'cardano',
  walletId: string
): Promise<ConnectedWallet> {
  const strikeBalance = 1500;
  const { tier, discountBps, effectiveFeeBps } = calculateStrikeTier(strikeBalance);

  let address = '';
  let walletName = walletId;

  try {
    if (chain === 'solana' && (window as any).solana) {
      const resp = await (window as any).solana.connect();
      address = resp.publicKey ? resp.publicKey.toString() : '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      walletName = 'Phantom (Solana)';
    } else if (chain === 'ethereum' && (window as any).ethereum) {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      address = accounts[0] || '0x71C568753237a2a3A52394fC2B6809787eFF4382';
      walletName = 'MetaMask / EVM';
    } else if (chain === 'cardano' && (window as any).cardano && (window as any).cardano[walletId]) {
      const api = await (window as any).cardano[walletId].enable();
      const usedAddrs = await api.getUsedAddresses();
      address = usedAddrs[0] || 'addr1q9k9vljrwe6q20993j0e39s0da4xuvtww2r6t0m8f3k983da';
      walletName = `${walletId.toUpperCase()} (Cardano)`;
    } else {
      // Graceful fallback to sandbox
      return await createDemoWallet(chain, walletId);
    }
  } catch (err) {
    console.warn('Direct provider connect rejected or unavailable, activating sandbox mode:', err);
    return await createDemoWallet(chain, walletId);
  }

  // Ensure Ed25519 session key exists
  await generateApiWalletKeys('mirrorx-alpha', effectiveFeeBps);

  const wallet: ConnectedWallet = {
    address,
    chain,
    walletName,
    collateralUsd: 12500,
    strikeBalance,
    strikeTier: tier,
    discountBps,
    effectiveFeeBps,
    connectedAt: new Date().toISOString()
  };

  saveConnectedWallet(wallet);
  return wallet;
}

export async function generateApiWalletKeys(builderCode = 'mirrorx-alpha', feeBps = 25): Promise<ApiWalletKeys> {
  const privateKey = (ed25519 as any).utils.randomSecretKey();
  const publicKey = await (ed25519 as any).getPublicKey(privateKey);

  const keys: ApiWalletKeys = {
    privateKeyHex: Array.from(privateKey as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join(''),
    publicKeyHex: Array.from(publicKey as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join(''),
    builderCode,
    builderFeeBps: feeBps,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(WALLET_KEY_STORAGE, JSON.stringify(keys));
  return keys;
}

export function getStoredApiWalletKeys(): ApiWalletKeys | null {
  const raw = localStorage.getItem(WALLET_KEY_STORAGE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function signStrikeRequest(
  keys: ApiWalletKeys,
  method: string,
  path: string,
  bodyObj: Record<string, unknown> | null = null
): Promise<{
  headers: Record<string, string>;
  message: string;
  bodyJson: string;
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = uuidv4();
  const bodyJson = bodyObj ? JSON.stringify(bodyObj) : '';
  
  const bodyHash = bytesToHex(sha256(encoder.encode(bodyJson)));
  const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}:${bodyHash}`;

  const privateKeyBytes = hexToBytes(keys.privateKeyHex);
  const normalizedKey = privateKeyBytes.length === 64 ? privateKeyBytes.subarray(0, 32) : privateKeyBytes;
  
  const signature = await (ed25519 as any).sign(encoder.encode(message), normalizedKey);
  const signatureHex = bytesToHex(signature as Uint8Array);

  const headers: Record<string, string> = {
    'X-API-Wallet-Public-Key': keys.publicKeyHex,
    'X-API-Wallet-Signature': signatureHex,
    'X-API-Wallet-Timestamp': String(timestamp),
    'X-API-Wallet-Nonce': nonce,
    'X-Builder-Fee-Bps': String(keys.builderFeeBps),
  };

  if (bodyObj) {
    headers['Content-Type'] = 'application/json';
  }

  return { headers, message, bodyJson };
}
