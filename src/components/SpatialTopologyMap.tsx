import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Navigation,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResourceItem } from '../types/resource.ts';

interface SpatialNode {
  id: string;
  name: string;
  shortCode: string;
  type: 'hub' | 'ward' | 'pavilion' | 'depot';
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
  locationMatch: string;
}

const NODES: SpatialNode[] = [
  {
    id: 'node-central',
    name: 'Metro Central Trauma Hub',
    shortCode: 'MCT-01',
    type: 'hub',
    x: 48,
    y: 42,
    locationMatch: 'Metro Central',
  },
  {
    id: 'node-south',
    name: 'Metro South Emergency',
    shortCode: 'MSE-02',
    type: 'ward',
    x: 32,
    y: 74,
    locationMatch: 'Metro South',
  },
  {
    id: 'node-north',
    name: 'North Pavilion Care Center',
    shortCode: 'NPC-03',
    type: 'pavilion',
    x: 52,
    y: 18,
    locationMatch: 'North Pavilion',
  },
  {
    id: 'node-east',
    name: 'East Emergency Pavilion',
    shortCode: 'EEP-04',
    type: 'pavilion',
    x: 78,
    y: 35,
    locationMatch: 'East Hub',
  },
  {
    id: 'node-hub-a',
    name: 'Central Logistics Reserve',
    shortCode: 'CLR-05',
    type: 'depot',
    x: 22,
    y: 30,
    locationMatch: 'Central Hub',
  },
  {
    id: 'node-west',
    name: 'West Field Logistics Depot',
    shortCode: 'WFD-06',
    type: 'depot',
    x: 75,
    y: 72,
    locationMatch: 'West Logistics',
  },
];

interface SpatialTopologyMapProps {
  resources: ResourceItem[];
  onSelectFacility?: (location: string) => void;
  onNavigateToCoordination?: () => void;
}

export default function SpatialTopologyMap({
  resources,
  onSelectFacility,
  onNavigateToCoordination,
}: SpatialTopologyMapProps) {
  const [selectedNode, setSelectedNode] = useState<SpatialNode | null>(NODES[0]);
  const [activeLayer, setActiveLayer] = useState<'all' | 'critical' | 'routes'>('all');

  // Compute node status
  const getNodeDetails = (node: SpatialNode) => {
    const facilityResources = resources.filter((r) =>
      r.location.toLowerCase().includes(node.locationMatch.toLowerCase())
    );

    const deficits = facilityResources.filter((r) => r.available < r.required);
    const surpluses = facilityResources.filter((r) => r.available > r.required);
    const isCritical = deficits.some((d) => d.status === 'critical');
    const isWarning = deficits.some((d) => d.status === 'low');
    const isDonor = surpluses.length > 0 && deficits.length === 0;

    const status: 'critical' | 'warning' | 'donor' | 'normal' = isCritical
      ? 'critical'
      : isWarning
        ? 'warning'
        : isDonor
          ? 'donor'
          : 'normal';

    return {
      resources: facilityResources,
      deficits,
      surpluses,
      status,
    };
  };

  // Connected corridors between donors and deficit nodes
  const corridors = [
    { from: NODES[4], to: NODES[1], label: 'Corridor Alpha: Ambulances en route', active: true, color: '#14B8A6' },
    { from: NODES[3], to: NODES[2], label: 'Corridor Beta: Oxygen Cylinders', active: true, color: '#10B981' },
    { from: NODES[0], to: NODES[1], label: 'Corridor Gamma: Blood Reserves', active: true, color: '#F59E0B' },
  ];

  return (
    <section
      aria-label="Spatial Topology Network Map"
      className="relative overflow-hidden rounded-2xl border border-teal-900/60 bg-gradient-to-b from-[#09221F] to-[#071615] p-6 sm:p-7 shadow-2xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-900/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-950 border border-teal-800 text-amber-400">
              <Navigation className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white font-heading tracking-tight">
              Spatial Logistics & Active Transfer Corridors
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Geographic facility network. Visualizes active deficit sites, designated donor hubs, and en-route transit corridors.
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <div className="flex items-center bg-[#061715] border border-teal-900/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                activeLayer === 'all'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Facilities
            </button>
            <button
              onClick={() => setActiveLayer('critical')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                activeLayer === 'critical'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deficits Only
            </button>
            <button
              onClick={() => setActiveLayer('routes')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                activeLayer === 'routes'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Routes
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SVG Interactive Canvas */}
        <div className="lg:col-span-2 relative h-[380px] sm:h-[420px] rounded-xl border border-teal-900/60 bg-[#061413] overflow-hidden shadow-inner">
          {/* Subtle Grid & Concentric Rings */}
          <div className="absolute inset-0 pointer-events-none opacity-15">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.4) 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* SVG Map Lines & Corridors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Concentric Reference Rings */}
            <circle cx="50%" cy="45%" r="120" fill="none" stroke="rgba(20, 184, 166, 0.12)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="45%" r="190" fill="none" stroke="rgba(20, 184, 166, 0.08)" strokeWidth="1" strokeDasharray="6 6" />

            {/* Transfer Corridors */}
            {corridors.map((corridor, idx) => {
              const x1 = corridor.from.x;
              const y1 = corridor.from.y;
              const x2 = corridor.to.x;
              const y2 = corridor.to.y;

              const cx = (x1 + x2) / 2 + (idx % 2 === 0 ? 8 : -8);
              const cy = (y1 + y2) / 2 - 12;

              return (
                <g key={idx}>
                  <path
                    d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                    fill="none"
                    stroke={corridor.color}
                    strokeWidth="2.5"
                    strokeOpacity="0.3"
                    filter="url(#softGlow)"
                  />
                  <path
                    d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                    fill="none"
                    stroke={corridor.color}
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.85"
                  />
                  {/* Moving Light Transit Node */}
                  <circle r="4.5" fill="#FFFFFF" filter="url(#softGlow)">
                    <animateMotion
                      path={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                      dur={`${3.5 + idx * 1.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Interactive HTML Nodes placed on top of SVG */}
          <div className="absolute inset-0 z-20 pointer-events-auto">
            {NODES.map((node) => {
              const { status, deficits } = getNodeDetails(node);
              const isSelected = selectedNode?.id === node.id;

              if (activeLayer === 'critical' && status !== 'critical' && status !== 'warning') {
                return null;
              }

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Pulsing Beacon Halo */}
                  {status === 'critical' ? (
                    <span className="absolute -inset-2.5 rounded-full bg-rose-500 opacity-60 animate-ping" />
                  ) : status === 'donor' ? (
                    <span className="absolute -inset-2 rounded-full bg-emerald-500 opacity-40 animate-pulse" />
                  ) : null}

                  {/* Node Icon Box */}
                  <div
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-white scale-110 shadow-teal-500/50'
                        : 'group-hover:scale-105'
                    } ${
                      status === 'critical'
                        ? 'bg-rose-700 text-white border border-rose-400'
                        : status === 'donor'
                          ? 'bg-emerald-700 text-white border border-emerald-400'
                          : 'bg-[#0E3530] text-teal-200 border border-teal-400/40'
                    }`}
                  >
                    {node.shortCode.split('-')[0]}
                  </div>

                  {/* Hover / Active Badge Pill */}
                  <div
                    className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all shadow-md pointer-events-none ${
                      isSelected
                        ? 'bg-white text-slate-900 border border-slate-300 opacity-100'
                        : 'bg-[#071F1C] text-slate-200 border border-teal-800 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    <span>{node.name.split(' ')[0]}</span>
                    {deficits.length > 0 && (
                      <span className="ml-1 text-rose-500 font-extrabold">({deficits.length} def)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Compass & Legend in corner */}
          <div className="absolute bottom-3 left-3 z-30 p-3 rounded-xl bg-[#071F1C]/90 border border-teal-900/80 text-[11px] text-slate-300 space-y-1.5 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Deficit Facility (Recipient)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Surplus Facility (Donor)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-teal-400" />
              <span>Active Supply Corridors</span>
            </div>
          </div>
        </div>

        {/* Selected Node Telemetry Sidebar */}
        <div className="rounded-xl border border-teal-900/60 bg-[#0A2622] p-5 flex flex-col justify-between shadow-lg">
          {selectedNode ? (
            (() => {
              const { resources: nodeRes, deficits, surpluses, status } = getNodeDetails(selectedNode);

              return (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-teal-900/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white font-heading">
                          {selectedNode.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedNode.shortCode} • {selectedNode.type.toUpperCase()}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        status === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : status === 'donor'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-teal-900/50 text-teal-200 border border-teal-700/50'
                      }`}
                    >
                      {status === 'critical' ? 'Shortage Alert' : status === 'donor' ? 'Surplus Donor' : 'Operational'}
                    </span>
                  </div>

                  {/* Deficit Alert Warning */}
                  {deficits.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Active Deficit ({deficits.length} items)</span>
                      </div>
                      {deficits.map((d) => (
                        <div key={d.id} className="text-xs text-slate-200 flex justify-between">
                          <span>{d.name}:</span>
                          <span className="text-rose-400 font-bold">
                            {d.available} / {d.required} {d.unit} (Deficit: {d.required - d.available})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Surplus Items */}
                  {surpluses.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Buffer Stock ({surpluses.length} items)</span>
                      </div>
                      {surpluses.map((s) => (
                        <div key={s.id} className="text-xs text-slate-200 flex justify-between">
                          <span>{s.name}:</span>
                          <span className="text-emerald-400 font-bold">
                            +{s.available - s.required} {s.unit} above baseline
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tracked Assets List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                      Inventory Telemetry:
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {nodeRes.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-[#071F1C] border border-teal-900/60 flex items-center justify-between text-xs"
                        >
                          <span className="truncate text-slate-300">{item.name}</span>
                          <span className="text-xs text-slate-400 shrink-0 font-medium">
                            {item.available} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={onNavigateToCoordination}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Coordinate Transfers for this Hub</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-10">
              <MapPin className="w-8 h-8 mb-2 opacity-50" />
              <span>Select any facility node on the map to inspect live capacity telemetry</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
