import React, { useState } from 'react';
import { TrendUp, TrendDown, Lightning, ShieldCheck, Sparkle, ArrowRight } from '@phosphor-icons/react';

interface AlphaChartProps {
  onDeployStrategy?: (direction: 'MIRROR' | 'INVERSE') => void;
}

export const AlphaChart: React.FC<AlphaChartProps> = ({ onDeployStrategy }) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 30 data points representing a month of high-volatility perpetual trading
  const dataPoints = [
    { day: 1, retail: 10000, mirror: 10000, inverse: 10000 },
    { day: 3, retail: 10400, mirror: 10300, inverse: 9800 },
    { day: 5, retail: 9800, mirror: 10600, inverse: 10300 },
    { day: 7, retail: 8900, mirror: 10900, inverse: 11400 },
    { day: 9, retail: 9200, mirror: 11200, inverse: 11100 },
    { day: 11, retail: 7800, mirror: 11600, inverse: 12900 }, // Liquidation cascade #1
    { day: 13, retail: 8100, mirror: 12000, inverse: 12600 },
    { day: 15, retail: 7400, mirror: 12300, inverse: 13800 },
    { day: 17, retail: 6900, mirror: 12700, inverse: 14700 },
    { day: 19, retail: 5800, mirror: 13100, inverse: 16400 }, // Liquidation cascade #2
    { day: 21, retail: 6100, mirror: 13400, inverse: 16100 },
    { day: 23, retail: 5200, mirror: 13900, inverse: 17800 },
    { day: 25, retail: 4400, mirror: 14200, inverse: 19400 }, // Liquidation cascade #3
    { day: 27, retail: 3900, mirror: 14500, inverse: 20500 },
    { day: 30, retail: 3180, mirror: 14860, inverse: 21820 }, // Final month close
  ];

  const minVal = 2500;
  const maxVal = 23000;
  const chartHeight = 240;
  const chartWidth = 700;

  function getY(val: number) {
    const norm = (val - minVal) / (maxVal - minVal);
    return chartHeight - norm * chartHeight;
  }

  function getX(i: number) {
    return (i / (dataPoints.length - 1)) * (chartWidth - 60) + 40;
  }

  // Generate SVG path strings
  const retailPath = dataPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.retail)}`,
    ''
  );

  const mirrorPath = dataPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.mirror)}`,
    ''
  );

  const inversePath = dataPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.inverse)}`,
    ''
  );

  const inverseAreaPath = `${inversePath} L ${getX(dataPoints.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;

  const activePoint = hoverIndex !== null ? dataPoints[hoverIndex] : dataPoints[dataPoints.length - 1];

  return (
    <div className="linear-panel p-6 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface-elevated)] border border-[var(--border-medium)] rounded-xl shadow-lg text-left">
      
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="linear-badge linear-badge-amber text-[10px]">
              <Sparkle size={11} weight="fill" />
              ALGORITHMIC INVERSE ALPHA
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">Live Backtested Performance</span>
          </div>
          <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mt-1">
            The Anti-Liquidator vs Retail Liquidation Flow
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Realized return comparing chronic retail liquidation losses against MirrorX systematic inverse counter-execution.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] rounded-lg self-start md:self-center">
          {(['7d', '30d', '90d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
                timeframe === tf
                  ? 'bg-[#00F2FE] text-black font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        
        {/* Anti-Liquidator Return */}
        <div className="p-3.5 rounded-lg bg-[rgba(255,138,0,0.06)] border border-[rgba(255,138,0,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#FF8A00] uppercase font-bold flex items-center gap-1">
              <TrendUp size={14} weight="bold" />
              Anti-Liquidator (Inverse)
            </span>
            <span className="text-xs font-mono font-bold text-[#FF8A00]">+118.2%</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            ${activePoint.inverse.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            Capturing retail forced liquidation spikes
          </span>
        </div>

        {/* Alpha Mirror Return */}
        <div className="p-3.5 rounded-lg bg-[rgba(0,242,254,0.05)] border border-[rgba(0,242,254,0.18)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#00F2FE] uppercase font-bold flex items-center gap-1">
              <TrendUp size={14} weight="bold" />
              Alpha Mirror (HL + Strike)
            </span>
            <span className="text-xs font-mono font-bold text-[#00F2FE]">+48.6%</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            ${activePoint.mirror.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            Proportional top Sharpe trader replication
          </span>
        </div>

        {/* Retail Liquidation */}
        <div className="p-3.5 rounded-lg bg-[rgba(255,59,105,0.05)] border border-[rgba(255,59,105,0.18)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#FF3B69] uppercase font-bold flex items-center gap-1">
              <TrendDown size={14} weight="bold" />
              Target Retail Flow
            </span>
            <span className="text-xs font-mono font-bold text-[#FF3B69]">-68.2%</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            ${activePoint.retail.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            Chronic liquidations & emotional FOMO
          </span>
        </div>

      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden my-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="inverseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="mirrorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#00E599" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[5000, 10000, 15000, 20000].map((level) => (
            <g key={level}>
              <line
                x1="40"
                y1={getY(level)}
                x2={chartWidth - 20}
                y2={getY(level)}
                stroke="rgba(255,255,255,0.07)"
                strokeDasharray="4 4"
              />
              <text
                x="5"
                y={getY(level) + 4}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="monospace"
              >
                ${(level / 1000).toFixed(0)}k
              </text>
            </g>
          ))}

          {/* Area under inverse curve */}
          <path d={inverseAreaPath} fill="url(#inverseGradient)" />

          {/* Retail Path (Red, dashed) */}
          <path
            d={retailPath}
            fill="none"
            stroke="#FF3B69"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeOpacity="0.75"
          />

          {/* Alpha Mirror Path (Cyan, solid) */}
          <path
            d={mirrorPath}
            fill="none"
            stroke="url(#mirrorGradient)"
            strokeWidth="2.5"
          />

          {/* Anti-Liquidator Path (Gold/Orange, thick) */}
          <path
            d={inversePath}
            fill="none"
            stroke="#FF8A00"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Nodes */}
          {dataPoints.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Invisible touch target */}
              <rect
                x={getX(i) - 15}
                y="0"
                width="30"
                height={chartHeight}
                fill="transparent"
              />

              {/* Inverse Point */}
              <circle
                cx={getX(i)}
                cy={getY(pt.inverse)}
                r={hoverIndex === i ? 6 : 3.5}
                fill="#FF8A00"
                stroke="#07080B"
                strokeWidth="2"
              />

              {/* Hover Indicator Vertical Line */}
              {hoverIndex === i && (
                <line
                  x1={getX(i)}
                  y1="0"
                  x2={getX(i)}
                  y2={chartHeight}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend & Action Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#FF8A00] rounded-full" />
            <span className="text-white font-medium">The Anti-Liquidator (+118.2%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#00F2FE] rounded-full" />
            <span className="text-[var(--text-secondary)]">Alpha Mirror (+48.6%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#FF3B69] rounded-full border-dashed" />
            <span className="text-[var(--text-muted)]">Retail Liquidation (-68.2%)</span>
          </div>
        </div>

        {onDeployStrategy && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeployStrategy('INVERSE')}
              className="linear-btn-amber text-xs h-8 px-3"
            >
              <Lightning size={13} weight="bold" />
              <span>Deploy Anti-Liquidator</span>
            </button>
            <button
              onClick={() => onDeployStrategy('MIRROR')}
              className="linear-btn-secondary text-xs h-8 px-3"
            >
              <span>Deploy Alpha Mirror</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
