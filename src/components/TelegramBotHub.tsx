import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  PaperPlaneTilt, 
  CheckCircle, 
  ShieldCheck, 
  Lightning, 
  Robot, 
  Gear, 
  ArrowsClockwise, 
  WarningCircle, 
  Broadcast,
  Fire,
  Crosshair
} from '@phosphor-icons/react';
import { 
  getStoredTelegramConfig, 
  saveTelegramConfig, 
  sendTelegramMessage, 
  TelegramConfig 
} from '../services/telegramService';

interface TelegramLog {
  id: string;
  time: string;
  type: string;
  messageId?: number;
  status: 'SENT' | 'FAILED';
  preview: string;
}

export const TelegramBotHub: React.FC = () => {
  const [config, setConfig] = useState<TelegramConfig>(getStoredTelegramConfig());
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<TelegramLog[]>([]);

  function handleSaveSettings(updated: Partial<TelegramConfig>) {
    const next = { ...config, ...updated };
    setConfig(next);
    saveTelegramConfig(next);
  }

  async function handleSendTestMessage() {
    setIsSendingTest(true);
    setLastResult(null);

    const testPayload = `⚡ *MirrorX Copilot Sentinel Test*
━━━━━━━━━━━━━━━━━━
• *Status:* 🟢 Bot Verified & Active
• *Protocol:* Strike Finance V2 CLOB
• *Target Group:* \`${config.chatId}\`
• *Engine:* Anti-Liquidator & Alpha Mirror 2.0
• *Ed25519 Keys:* Active (Non-Custodial)

_This confirms your Telegram notifications are connected in real-time._`;

    const res = await sendTelegramMessage(testPayload);
    setIsSendingTest(false);

    if (res.success) {
      setLastResult({ success: true, msg: `Delivered to Telegram! (Message ID: #${res.messageId})` });
      
      const newLog: TelegramLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        type: 'MANUAL_TEST',
        messageId: res.messageId,
        status: 'SENT',
        preview: 'Test Handshake & Sentinel Health Check'
      };
      setDispatchLogs(prev => [newLog, ...prev]);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00F2FE', '#00E599', '#38F8FF']
      });
    } else {
      setLastResult({ success: false, msg: res.error || 'Failed to dispatch to Telegram.' });
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="linear-badge linear-badge-cyan text-[10px]">
              <Robot size={12} weight="bold" />
              TELEGRAM COPILOT BOT
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-[#00E599]">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.botToken ? 'bg-[#00E599]' : 'bg-[var(--text-tertiary)]'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.botToken ? 'bg-[#00E599]' : 'bg-[var(--text-tertiary)]'}`}></span>
              </span>
              {config.botToken ? 'Bot Configured' : 'Standby (Configure Below)'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[var(--text-primary)] mt-1">
            Automated Mobile Trade Alerts
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">
            Never miss an elite trader entry or an Anti-Liquidator counter-fill. Connect your personal Telegram bot to receive real-time notifications directly to your channel or group.
          </p>
        </div>

        <button
          onClick={handleSendTestMessage}
          disabled={isSendingTest || !config.botToken || !config.chatId}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSendingTest ? <ArrowsClockwise size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
          {isSendingTest ? 'Dispatching...' : 'Dispatch Test Alert'}
        </button>
      </div>

      {/* Confirmation Banner */}
      {lastResult && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
          lastResult.success 
            ? 'bg-[#00E599]/10 border-[#00E599]/30 text-[#00E599]' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {lastResult.success ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
            <span>{lastResult.msg}</span>
          </div>
          <span className="text-[10px] opacity-75">Telegram API v6.8</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Connection Status Card */}
        <div className="linear-card p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Broadcast size={16} className="text-[#00F2FE]" />
              Bot Status
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              config.botToken && config.chatId 
                ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30' 
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              {config.botToken && config.chatId ? 'CONFIGURED' : 'UNCONFIGURED'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">Bot Token</span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {config.botToken ? `••••••••${config.botToken.slice(-4)}` : 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-tertiary)]">Target Chat / Channel</span>
              <span className="font-mono font-semibold text-[#00E599]">
                {config.chatId || 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--text-tertiary)]">Master Notifications</span>
              <span className="font-mono font-bold text-[#00E599]">
                {config.enabled && config.botToken ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="linear-card p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Gear size={16} className="text-[#FF8A00]" />
              Telegram Channel Credentials
            </span>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
              Auto-saved to Browser State
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Target Chat ID or @ChannelUsername
              </label>
              <input
                type="text"
                value={config.chatId}
                onChange={(e) => handleSaveSettings({ chatId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[#00F2FE]"
                placeholder="@your_channel_or_id"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Bot Token (HTTP API)
              </label>
              <input
                type="password"
                value={config.botToken}
                onChange={(e) => handleSaveSettings({ botToken: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[#00F2FE]"
                placeholder="123456789:ABCdefGhI..."
              />
            </div>
          </div>

          {/* Trigger Toggles */}
          <div className="pt-2 border-t border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-2">
              Alert Trigger Filters
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={config.alertOnMirror}
                  onChange={(e) => handleSaveSettings({ alertOnMirror: e.target.checked })}
                  className="rounded accent-[#00F2FE]"
                />
                <span className="font-mono text-[11px]">Alpha Mirror</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={config.alertOnInverse}
                  onChange={(e) => handleSaveSettings({ alertOnInverse: e.target.checked })}
                  className="rounded accent-[#FF8A00]"
                />
                <span className="font-mono text-[11px]">Anti-Liquidator</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={config.alertOnBurn}
                  onChange={(e) => handleSaveSettings({ alertOnBurn: e.target.checked })}
                  className="rounded accent-[#FF8A00]"
                />
                <span className="font-mono text-[11px]">Token Burns</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={config.alertOnL3Order}
                  onChange={(e) => handleSaveSettings({ alertOnL3Order: e.target.checked })}
                  className="rounded accent-[#00E599]"
                />
                <span className="font-mono text-[11px]">L3 Orders</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch History Log */}
      <div className="linear-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Lightning size={14} className="text-[#00F2FE]" />
            Recent Telegram Dispatch Activity
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Real-time Webhook Stream
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {dispatchLogs.map((log) => (
            <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#00E599]" />
                <div>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {log.preview}
                  </span>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                    {log.type} • {log.time}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 font-mono">
                {log.messageId && (
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Msg #{log.messageId}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
