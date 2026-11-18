import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Clock, Activity, Zap } from 'lucide-react';
import { TimeRange } from '../utils/timeRange.ts';

export interface TrendDataPoint {
  time: string;
  utilization: number;
  used: number;
  total?: number;
  annotation?: string;
}

interface UtilizationTrendChartProps {
  timeRange: TimeRange;
  currentUtilization: number;
  totalResources: number;
}

export function getTrendPoints(timeRange: TimeRange, currentUtilization: number, total: number): TrendDataPoint[] {
  switch (timeRange) {
    case '7d':
      return [
        { time: '6d ago', utilization: 62, used: Math.round(total * 0.62) },
        { time: '5d ago', utilization: 65, used: Math.round(total * 0.65) },
        { time: '4d ago', utilization: 60, used: Math.round(total * 0.60) },
        { time: '3d ago', utilization: 67, used: Math.round(total * 0.67) },
        { time: '2d ago', utilization: 71, used: Math.round(total * 0.71) },
        { time: 'Yesterday', utilization: 74, used: Math.round(total * 0.74) },
        { time: 'Today', utilization: currentUtilization, used: Math.round(total * (currentUtilization / 100)), annotation: 'Current Peak' },
      ];
    case '30d':
      return [
        { time: 'Wk 1', utilization: 55, used: Math.round(total * 0.55) },
        { time: 'Wk 2', utilization: 61, used: Math.round(total * 0.61) },
        { time: 'Wk 3', utilization: 68, used: Math.round(total * 0.68) },
        { time: 'Wk 4', utilization: 73, used: Math.round(total * 0.73) },
        { time: 'Current', utilization: currentUtilization, used: Math.round(total * (currentUtilization / 100)), annotation: 'Active Surge' },
      ];
    case 'custom':
      return [
        { time: 'Day 1', utilization: 58, used: Math.round(total * 0.58) },
        { time: 'Day 4', utilization: 64, used: Math.round(total * 0.64) },
        { time: 'Day 7', utilization: 69, used: Math.round(total * 0.69) },
        { time: 'Day 10', utilization: 73, used: Math.round(total * 0.73) },
        { time: 'Day 14', utilization: currentUtilization, used: Math.round(total * (currentUtilization / 100)), annotation: 'Latest Window' },
      ];
    case 'today':
    default:
      return [
        { time: '06:00', utilization: 48, used: Math.round(total * 0.48) },
        { time: '08:00', utilization: 55, used: Math.round(total * 0.55) },
        { time: '10:00', utilization: 63, used: Math.round(total * 0.63) },
        { time: '12:00', utilization: 71, used: Math.round(total * 0.71) },
        { time: '14:00', utilization: 74, used: Math.round(total * 0.74) },
        { time: '16:00', utilization: 77, used: Math.round(total * 0.77), annotation: 'Surge Incident' },
        { time: '18:00', utilization: 75, used: Math.round(total * 0.75) },
        { time: 'Now', utilization: currentUtilization, used: Math.round(total * (currentUtilization / 100)), annotation: 'Live Stream' },
      ];
  }
}

export default function UtilizationTrendChart({
  timeRange,
  currentUtilization,
  totalResources,
}: UtilizationTrendChartProps) {
  const points = getTrendPoints(timeRange, currentUtilization, totalResources);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Geometry constants
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Coordinate mapping
  const getX = (index: number) => paddingLeft + (index / (points.length - 1)) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.min(Math.max(val, 0), 100) / 100) * chartH;

  // Threshold line Y (75% warning)
  const warningThresholdY = getY(75);

  // Build SVG Path
  const coordinates = points.map((p, i) => ({ x: getX(i), y: getY(p.utilization) }));

  // Create smooth curved line
  const linePath = coordinates.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, '');

  // Closed area path for gradient fill
  const lastX = coordinates[coordinates.length - 1].x;
  const firstX = coordinates[0].x;
  const zeroY = getY(0);
  const areaPath = `${linePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];
  const activeCoord = hoveredIdx !== null ? coordinates[hoveredIdx] : coordinates[coordinates.length - 1];

  return (
    <div className="cockpit-panel p-5 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-950/80 border border-teal-800/60 text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
              Operational Telemetry Trend
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-950/80 text-teal-300 border border-teal-800/80 shadow-sm">
              {timeRange === 'today' ? 'Live Telemetry (12H)' : timeRange === '7d' ? 'Daily Rolling (7D)' : timeRange === '30d' ? 'Weekly Rolling (30D)' : '14-Day Cycle'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking pool utilization percentage over time against the 75% high-demand baseline.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Active Window:</span>
            <span className="font-mono font-bold text-white">{activePoint.time}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono font-extrabold text-teal-400">{activePoint.utilization}%</span>
            <span className="text-slate-500 text-[11px]">({activePoint.used} units)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden rounded-lg bg-slate-950/50 p-2 border border-slate-800/50">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Linear Gradient for area fill */}
            <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter for main stroke */}
            <filter id="tealGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#14B8A6" floodOpacity="0.5" />
            </filter>

            {/* Glowing filter for critical warning threshold */}
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines (25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={tick === 75 ? '#F59E0B' : '#1E293B'}
                  strokeWidth="1"
                  strokeDasharray={tick === 75 ? '5 5' : '2 4'}
                  strokeOpacity={tick === 75 ? '0.75' : '0.6'}
                  filter={tick === 75 ? 'url(#amberGlow)' : undefined}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[10px] font-mono ${tick === 75 ? 'fill-amber-400 font-bold' : 'fill-slate-500'}`}
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* 75% Warning threshold guide label */}
          <text
            x={svgWidth - paddingRight}
            y={warningThresholdY - 6}
            textAnchor="end"
            className="text-[10px] fill-amber-400 font-mono font-semibold"
          >
            Warning Threshold (75%)
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#utilizationGradient)" />

          {/* Line Stroke with smooth wave glow */}
          <path
            d={linePath}
            fill="none"
            stroke="#14B8A6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#tealGlow)"
          />

          {/* Vertical guideline for active/hovered point */}
          <line
            x1={activeCoord.x}
            y1={paddingTop}
            x2={activeCoord.x}
            y2={zeroY}
            stroke="#2DD4BF"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
          />

          {/* Points & Annotations */}
          {coordinates.map((coord, i) => {
            const p = points[i];
            const isHovered = hoveredIdx === i;
            const isLast = i === points.length - 1;
            const isCritical = p.utilization >= 75;

            return (
              <g
                key={i}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {/* Invisible hover hitbox */}
                <circle cx={coord.x} cy={coord.y} r="18" fill="transparent" />

                {/* Radar pulse ring for live or surge point */}
                {(isLast || isHovered || p.annotation) && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isHovered ? '9' : '7'}
                    fill="none"
                    stroke={isCritical ? '#F43F5E' : '#14B8A6'}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Outer point circle */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? '6' : isLast ? '5' : '4'}
                  fill={isCritical ? '#F43F5E' : '#14B8A6'}
                  stroke="#071514"
                  strokeWidth="2"
                  filter="url(#tealGlow)"
                />

                {/* Milestone annotation badge */}
                {p.annotation && (
                  <g transform={`translate(${coord.x}, ${Math.max(coord.y - 18, paddingTop)})`}>
                    <rect
                      x="-40"
                      y="-14"
                      width="80"
                      height="16"
                      rx="4"
                      fill="#0F172A"
                      stroke={isCritical ? '#F43F5E' : '#06B6D4'}
                      strokeWidth="1"
                      fillOpacity="0.95"
                    />
                    <text
                      x="0"
                      y="-3"
                      textAnchor="middle"
                      className="text-[9px] fill-slate-200 font-mono font-bold"
                    >
                      {p.annotation}
                    </text>
                  </g>
                )}

                {/* X-Axis time labels */}
                <text
                  x={coord.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${
                    isHovered || isLast ? 'fill-teal-300 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-slate-900/95 border border-teal-500/50 shadow-xl shadow-teal-950/50 backdrop-blur-md text-xs -translate-x-1/2 -translate-y-full transition-all"
            style={{
              left: `${(activeCoord.x / svgWidth) * 100}%`,
              top: `${Math.max((activeCoord.y / svgHeight) * 100 - 8, 12)}%`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className={`w-2 h-2 rounded-full ${activePoint.utilization >= 75 ? 'bg-amber-400' : 'bg-teal-400'}`} />
              <span>{activePoint.time}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 font-mono">
              <span className="text-teal-400 font-extrabold text-sm">{activePoint.utilization}%</span>
              <span className="text-slate-400 text-[11px]">{activePoint.used} units deployed</span>
            </div>
            {activePoint.annotation && (
              <div className="mt-1 text-[10px] text-amber-300 font-medium">
                ⚡ {activePoint.annotation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Telemetry Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal-400 rounded-full" />
            <span>Telemetry Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span className="text-amber-400/90 font-medium">75% Surge Baseline</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Real-time rolling observation cadence</span>
        </div>
      </div>
    </div>
  );
}
