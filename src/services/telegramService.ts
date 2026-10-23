// Telegram Copilot Notification Service for MirrorX Protocol
// Dispatches real-time Strike Finance CLOB copy-trade, inverse counter, and token burn alerts

const TELEGRAM_CONFIG_STORAGE = 'mirrorx_telegram_config';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  alertOnMirror: boolean;
  alertOnInverse: boolean;
  alertOnL3Order: boolean;
  alertOnBurn: boolean;
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: '',
  chatId: '',
  enabled: false,
  alertOnMirror: true,
  alertOnInverse: true,
  alertOnL3Order: true,
  alertOnBurn: true,
};

export function getStoredTelegramConfig(): TelegramConfig {
  const raw = localStorage.getItem(TELEGRAM_CONFIG_STORAGE);
  if (!raw) return DEFAULT_TELEGRAM_CONFIG;
  try {
    return { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TELEGRAM_CONFIG;
  }
}

export function saveTelegramConfig(config: TelegramConfig): void {
  localStorage.setItem(TELEGRAM_CONFIG_STORAGE, JSON.stringify(config));
}

export interface TelegramDispatchResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export async function sendTelegramMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, error: 'Telegram alerts are disabled or unconfigured' };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, messageId: data.result?.message_id };
    } else {
      return { success: false, error: data.description || 'Failed to dispatch Telegram message' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error reaching Telegram API' };
  }
}

// Pre-formatted alert templates
export async function dispatchTradeAlert(params: {
  direction: 'MIRROR' | 'INVERSE';
  targetName: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  amountUsd: number;
  leverage: number;
  price?: string | number;
  builderFeeUsd?: number;
}): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();
  if (params.direction === 'MIRROR' && !config.alertOnMirror) return { success: false };
  if (params.direction === 'INVERSE' && !config.alertOnInverse) return { success: false };

  const isMirror = params.direction === 'MIRROR';
  const icon = isMirror ? '🚀' : '🎯';
  const typeLabel = isMirror ? '*ALPHA MIRROR REPLICATION*' : '*ANTI-LIQUIDATOR COUNTER-TRADE*';

  const text = `${icon} *MirrorX Protocol Alert*
━━━━━━━━━━━━━━━━━━
${typeLabel}

• *Asset:* \`${params.symbol}\`
• *Action:* *${params.side}* (${params.leverage}x Leverage)
• *Target:* \`${params.targetName}\`
• *Allocated:* \`$${params.amountUsd.toLocaleString()}\`
${params.price ? `• *Execution Price:* \`$${Number(params.price).toLocaleString()}\`\n` : ''}• *CLOB Engine:* Strike Finance V2
• *Builder Fee:* \`$${(params.builderFeeUsd || (params.amountUsd * 0.0025)).toFixed(2)}\` (Attributed)

🔒 _Signed with client-side Ed25519 (Non-Custodial)_
📡 _Sent via MirrorX Copilot Engine_`;

  return sendTelegramMessage(text);
}

export async function dispatchLiquidationCounterAlert(params: {
  liquidatedAccount: string;
  symbol: string;
  liquidatedAmountUsd: number;
  counterSide: 'BUY' | 'SELL';
  entryPrice: number;
  estimatedAlphaUsd: number;
}): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();
  if (!config.alertOnInverse) return { success: false };

  const text = `💥 *LIQUIDATION CASCADE COUNTER-FILL*
━━━━━━━━━━━━━━━━━━
• *Protocol:* Strike Finance V2 CLOB
• *Market:* \`${params.symbol}\`
• *Liquidated Position:* \`$${params.liquidatedAmountUsd.toLocaleString()}\` (Retail Flow)
• *Trader:* \`${params.liquidatedAccount}\`

⚡ *MirrorX Counter-Action:*
• *Automated Fill:* *${params.counterSide}* @ \`$${params.entryPrice.toLocaleString()}\`
• *Estimated Alpha Extracted:* *+$${params.estimatedAlphaUsd.toFixed(2)}*
• *Engine:* Anti-Liquidator 2.0 (Zero-Latency)

📡 _MirrorX Real-time Sentinel Active_`;

  return sendTelegramMessage(text);
}

export async function dispatchBurnAlert(params: {
  burnedStrike: number;
  usdValue: number;
  txHash: string;
}): Promise<TelegramDispatchResult> {
  const config = getStoredTelegramConfig();
  if (!config.alertOnBurn) return { success: false };

  const text = `🔥 *$STRIKE TOKEN BUYBACK & BURN*
━━━━━━━━━━━━━━━━━━
• *Tokens Burned:* \`${params.burnedStrike.toFixed(2)} STRIKE\`
• *CLOB Buyback Value:* \`$${params.usdValue.toFixed(2)} USD\`
• *Source:* 30% MirrorX Builder Fee Revenue Split
• *Tx Hash:* \`${params.txHash.slice(0, 10)}...${params.txHash.slice(-8)}\`

📈 _Permanent circulating supply reduction on Strike Finance V2_`;

  return sendTelegramMessage(text);
}
