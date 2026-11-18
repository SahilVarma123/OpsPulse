import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DemoScenario, DEMO_SCENARIOS } from '../data/mockResources.ts';

interface HeroCommandCenterProps {
  activeScenario: DemoScenario;
  onSelectScenario: (scenarioId: string) => void;
  onNavigateToCoordination: () => void;
  onNavigateToMonitoring: () => void;
  onTriggerAiDirective: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed: string;
  totalShortagesCount: number;
}

export default function HeroCommandCenter({
  activeScenario,
  onSelectScenario,
  onNavigateToCoordination,
  onNavigateToMonitoring,
  onTriggerAiDirective,
  onRefresh,
  isRefreshing,
  lastRefreshed,
  totalShortagesCount,
}: HeroCommandCenterProps) {
  const [tickerIndex, setTickerIndex] = useState(0);

  // Real-time operations broadcast feed
  const tickerEvents = [
    {
      time: '14:24:10',
      tag: 'ALLOCATION',
      text: 'North Pavilion: Oxygen buffer restored via coordinated transfer from East Pavilion.',
    },
    {
      time: '14:22:45',
      tag: 'DISPATCH',
      text: 'Rapid Response Fleet: 3 ALS Ambulances en route along Regional Transit Corridor 4.',
    },
    {
      time: '14:20:12',
      tag: 'VERIFICATION',
      text: 'Mathematical Safety Proof: 100% of donor facilities retain required safety reserves.',
    },
    {
      time: '14:18:30',
      tag: 'AI DIRECTIVE',
      text: 'Gemini 3.8 Flash: Strategic multi-facility redistribution plan synthesized.',
    },
    {
      time: '14:15:02',
      tag: 'SYSTEM',
      text: '14 connected medical facilities synchronizing live inventory streams.',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [tickerEvents.length]);

  return (
    <div className="relative group">
      {/* Floaty Ambient Colored Glow beneath the main ICCC card on cursor hover */}
      <div className="absolute -inset-1.5 rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 pointer-events-none bg-gradient-to-r from-teal-500/25 via-amber-500/20 to-emerald-500/25" />

      {/* Floaty Motion Main ICCC Bulletin Card with Spring Physics */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -6,
          transition: { type: 'spring', stiffness: 320, damping: 24 },
        }}
        className="relative overflow-hidden rounded-2xl border border-teal-900/60 group-hover:border-teal-700/80 bg-gradient-to-b from-[#09221F] via-[#0C2B27] to-[#071615] shadow-2xl group-hover:shadow-2xl group-hover:shadow-teal-950/60 transition-all duration-300"
      >
      {/* Background Atmosphere: Clinical Forest Teal & Warm Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.4) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Operations Live Broadcast Ticker */}
      <div className="relative border-b border-teal-900/40 bg-[#061514]/90 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded">
              ICCC BULLETIN
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 truncate text-slate-200 text-[11px]"
            >
              <span className="text-teal-400 font-semibold">[{tickerEvents[tickerIndex].time}]</span>
              <span className="font-semibold text-amber-300">[{tickerEvents[tickerIndex].tag}]</span>
              <span className="truncate text-slate-300">{tickerEvents[tickerIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 shrink-0 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Regional Network Online</span>
          </span>
          <span className="text-slate-600">•</span>
          <button
            onClick={onRefresh}
            className="text-teal-400 hover:text-teal-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Content */}
      <div className="relative z-10 px-6 sm:px-8 lg:px-12 py-10 sm:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="max-w-3xl space-y-4">
          {/* Healthcare Institutional Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-200 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase text-[11px] font-bold text-slate-200 font-heading">
              Integrated Command & Control Centre (ICCC)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 text-[11px] font-semibold">Live Regional Feed</span>
          </div>

          {/* Grand Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading leading-tight">
            INTEGRATED COMMAND AND <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-teal-300 via-amber-200 to-white bg-clip-text text-transparent">
              CONTROL CENTRE (ICCC)
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-light">
            Autonomous Healthcare & Emergency Logistics Coordination. Eliminating critical resource deficits across regional care facilities through deterministic invariant safety and Gemini AI intelligence.
          </p>

          {/* Key Status Indicators: Clean typography & status dots, no icon clutter */}
          <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-3.5 py-1.5 rounded-lg bg-[#0A2622] border border-teal-800/60 text-slate-200 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Safe Baseline Invariant: <strong className="text-emerald-400 font-bold">100% Guaranteed</strong></span>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-[#0A2622] border border-teal-800/60 text-slate-200 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Active Deficits: <strong className="text-amber-300 font-bold">{totalShortagesCount} Identified</strong></span>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-[#0A2622] border border-teal-800/60 text-slate-200 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Connected Facilities: <strong className="text-teal-300 font-bold">14 Nodes</strong></span>
            </div>
          </div>

          {/* Action CTAs: Purposeful and clean */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToCoordination}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white shadow-lg shadow-teal-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-teal-400/30"
            >
              <span>Explore Coordination Board</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTriggerAiDirective}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0E302B] hover:bg-[#133D37] text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Synthesize AI Directives</span>
            </button>

            <button
              onClick={onNavigateToMonitoring}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#081F1C] hover:bg-[#0D2B27] text-slate-300 border border-teal-900 hover:border-teal-700 transition-all cursor-pointer"
            >
              <span>Resource Inventory</span>
            </button>
          </div>
        </div>

        {/* Right Card: Incident Scenarios Switcher */}
        <div className="w-full lg:w-80 shrink-0 bg-[#0A2522] border border-teal-800/60 rounded-xl p-4 shadow-xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-teal-900/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-heading">
                Operational Scenario
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
              ACTIVE
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {DEMO_SCENARIOS.map((sc) => {
              const isSelected = activeScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-600/30 border border-teal-400 text-white shadow-md'
                      : 'hover:bg-[#0E332E] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-500'}`} />
                      <span className={isSelected ? 'text-white' : 'text-slate-300'}>{sc.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-teal-900/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Last Synced:</span>
            <span className="text-teal-300 font-semibold">{lastRefreshed}</span>
          </div>
        </div>
      </div>
    </motion.section>
  </div>
  );
}
