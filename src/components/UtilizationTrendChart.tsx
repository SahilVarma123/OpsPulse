import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Clock } from 'lucide-react';
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
  // Deterministic trend history tailored to selected timeRange
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
        { time: 'Now', utilization: currentUtilization, used: Math.round(total * (currentUtilization / 100)), annotation: 'Live' },
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
    <div className="beige-panel rounded-xl border p-5 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Resource Utilization Trend</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">
              {timeRange === 'today' ? 'Hourly (12H)' : timeRange === '7d' ? 'Daily (7D)' : timeRange === '30d' ? 'Weekly (30D)' : '14-Day'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking pool utilization percentage over time against the 75% high-demand baseline.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 text-[11px]">Selected: </span>
            <span className="font-mono font-bold text-white ml-1">{activePoint.time}</span>
            <span className="font-mono font-extrabold text-cyan-400 ml-1.5">{activePoint.utilization}%</span>
            <span className="text-slate-500 text-[11px] ml-1">({activePoint.used}u)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Linear Gradient for area fill */}
            <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#526e80" stopOpacity="0.24" />
              <stop offset="60%" stopColor="#526e80" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#526e80" stopOpacity="0" />
            </linearGradient>

            {/* Glowing filter for main stroke */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#526e80" floodOpacity="0.18" />
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
                  stroke="#cbd0d2"
                  strokeWidth="1"
                  strokeDasharray={tick === 75 ? '4 4' : '2 4'}
                  strokeOpacity={tick === 75 ? '0.7' : '0.4'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono"
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
            className="text-[9px] fill-amber-400/80 font-mono font-medium"
          >
            Warning Threshold (75%)
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#utilizationGradient)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#526e80"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cyanGlow)"
          />

          {/* Vertical guideline for active/hovered point */}
          <line
            x1={activeCoord.x}
            y1={paddingTop}
            x2={activeCoord.x}
            y2={zeroY}
            stroke="#718697"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />

          {/* Data points & hit areas */}
          {points.map((p, idx) => {
            const cx = coordinates[idx].x;
            const cy = coordinates[idx].y;
            const isHovered = hoveredIdx === idx || (hoveredIdx === null && idx === points.length - 1);

            return (
              <g key={idx} className="cursor-pointer">
                {/* Invisible large hit area */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="22"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '5' : '3.5'}
                  fill={isHovered ? '#526e80' : '#718697'}
                  stroke="#fffefa"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Annotation pill if point has special label */}
                {p.annotation && (
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="text-[9px] fill-cyan-300 font-bold font-mono"
                  >
                    {p.annotation}
                  </text>
                )}

                {/* X-axis tick label */}
                <text
                  x={cx}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${isHovered ? 'fill-cyan-300 font-bold' : 'fill-slate-400'
                    }`}
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full inline-block"></span>
            <span>Capacity Utilization</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-amber-400 inline-block"></span>
            <span>75% High-Demand Limit</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Interactive hover: Hover points to inspect timestamp breakdown</span>
        </div>
      </div>
    </div>
  );
}
