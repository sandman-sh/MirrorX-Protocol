import React from 'react';
import { TrendUp, TrendDown } from '@phosphor-icons/react';

interface ToggleSwitchProps {
  mode: 'MIRROR' | 'INVERSE';
  onToggle: (mode: 'MIRROR' | 'INVERSE') => void;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ mode, onToggle, size = 'md' }) => {
  const isMirror = mode === 'MIRROR';

  function handleClick() {
    onToggle(isMirror ? 'INVERSE' : 'MIRROR');
  }

  if (size === 'sm') {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 group"
        title={`Switch to ${isMirror ? 'Inverse' : 'Mirror'} Mode`}
      >
        <div
          className="toggle-switch"
          data-state={isMirror ? 'mirror' : 'inverse'}
        >
          <div className="toggle-knob" />
        </div>
        <span className={`text-xs font-bold font-mono transition-colors ${
          isMirror ? 'text-[var(--accent-cyan)]' : 'text-[var(--accent-amber)]'
        }`}>
          {isMirror ? 'MIRROR' : 'INVERSE'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-1 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] shadow-sm">
      <button
        onClick={() => onToggle('MIRROR')}
        className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
          isMirror
            ? 'bg-[#00F2FE] text-[#07080B] shadow-[0_0_12px_rgba(0,242,254,0.3)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
        }`}
      >
        <TrendUp size={14} weight="bold" />
        <span>Mirror</span>
      </button>

      <div
        onClick={handleClick}
        className="toggle-switch"
        data-state={isMirror ? 'mirror' : 'inverse'}
      >
        <div className="toggle-knob" />
      </div>

      <button
        onClick={() => onToggle('INVERSE')}
        className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
          !isMirror
            ? 'bg-gradient-to-r from-[#FF9900] to-[#FF5E3A] text-[#07080B] shadow-[0_0_12px_rgba(255,138,0,0.35)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
        }`}
      >
        <TrendDown size={14} weight="bold" />
        <span>Inverse</span>
      </button>
    </div>
  );
};
