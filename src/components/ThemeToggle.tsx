import React from 'react';
import { Sun, Moon } from '@phosphor-icons/react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  variant?: 'icon' | 'pill' | 'toggle';
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  variant = 'icon',
  size = 'md'
}) => {
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div 
        className="inline-flex items-center p-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-medium)] shadow-sm"
        role="group"
        aria-label="Theme mode switcher"
      >
        <button
          type="button"
          onClick={() => isDark || onToggle()}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border-0 ${
            isDark
              ? 'bg-[#141722] text-[#00F2FE] shadow-[0_0_10px_rgba(0,242,254,0.25)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
          }`}
          title="Switch to Dark Mode"
        >
          <Moon size={14} weight={isDark ? 'fill' : 'regular'} />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => !isDark || onToggle()}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border-0 ${
            !isDark
              ? 'bg-white text-[#EA580C] shadow-[0_1px_4px_rgba(0,0,0,0.1)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
          }`}
          title="Switch to White (Light) Mode"
        >
          <Sun size={14} weight={!isDark ? 'fill' : 'regular'} />
          <span>White</span>
        </button>
      </div>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 group"
        title={`Switch to ${isDark ? 'White (Light)' : 'Dark'} Mode`}
        aria-label={`Toggle dark/white theme (currently ${theme})`}
      >
        <div
          className="theme-switch-track"
          data-theme={theme}
        >
          <div className="theme-switch-knob">
            {isDark ? (
              <Moon size={11} weight="fill" className="text-[#00F2FE]" />
            ) : (
              <Sun size={11} weight="fill" className="text-[#EA580C]" />
            )}
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          {isDark ? 'Dark' : 'White'}
        </span>
      </button>
    );
  }

  // Default: 'icon' button
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${btnSize} rounded-lg flex items-center justify-center transition-all cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative group shadow-sm`}
      title={`Switch to ${isDark ? 'White (Light)' : 'Dark'} Mode`}
      aria-label={`Toggle theme: currently ${theme} mode`}
    >
      {isDark ? (
        <Sun 
          size={iconSize} 
          weight="bold" 
          className="text-[#FF8A00] transition-transform duration-300 group-hover:rotate-45" 
        />
      ) : (
        <Moon 
          size={iconSize} 
          weight="bold" 
          className="text-[#0284C7] transition-transform duration-300 group-hover:-rotate-12" 
        />
      )}
      <span className="sr-only">Toggle Dark/White Mode</span>
    </button>
  );
};
