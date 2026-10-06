import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Search,
  ArrowRight,
  Check,
  Send,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Truck,
  Sparkles,
  Sliders,
  MapPin,
  HelpCircle,
  X,
  Zap,
  Clock,
  History,
} from 'lucide-react';
import {
  DEMO_SCENARIOS,
  DemoScenario,
  computeDashboardStats,
} from './data/mockResources.ts';
import { ResourceItem, ShortageStatus } from './types/resource.ts';
import {
  evaluateResourceThreshold,
  computeShortageSummary,
  detectResourceAnomaly,
} from './utils/thresholds.ts';
import {
  generateTransferRecommendations,
  TransferRecommendation,
} from './utils/coordination.ts';
import { TimeRange, computeTimeWindowStats } from './utils/timeRange.ts';
import UtilizationTrendChart from './components/UtilizationTrendChart.tsx';
import AlertPanel from './components/AlertPanel.tsx';

export interface StructuredAiRecommendation {
  severity: string;
  recommended_action: string;
  reason: string;
  confidence: number;
  affected_location: string;
}

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('mass-casualty');
  const [activeTab, setActiveTab] = useState<'monitoring' | 'coordination'>('monitoring');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  // Scenario resources
  const activeScenario = useMemo(
    () => DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_SCENARIOS[0],
    [selectedScenarioId]
  );
  const resources = activeScenario.resources;

  // Freshness and loading states
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monitoring table filters & drill-down selection
  const [statusFilter, setStatusFilter] = useState<'all' | ShortageStatus | 'anomaly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null);

  // Coordination actions state
  const [actionStatuses, setActionStatuses] = useState<Record<string, 'pending' | 'in_transit' | 'completed'>>({});
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  // Gemini AI recommendation state (server-side API structured JSON output)
  const [aiRecommendation, setAiRecommendation] = useState<{
    data: StructuredAiRecommendation;
    isFallback: boolean;
    reason?: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Computed metrics (with time-range support for summaries)
  const stats = useMemo(() => computeTimeWindowStats(resources, timeRange), [resources, timeRange]);
  const shortageSummary = useMemo(() => computeShortageSummary(resources), [resources]);
  const transferRecommendations = useMemo(() => generateTransferRecommendations(resources), [resources]);

  // Scenario change handler
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setAiRecommendation(null);
    setAiError(null);
    setActionStatuses({});
    setExpandedEvidenceId(null);
    setExpandedResourceId(null);
    setStatusFilter('all');
    setSearchQuery('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 400);
  };

  const handleToggleActionStatus = (recId: string) => {
    setActionStatuses((prev) => {
      const current = prev[recId] || 'pending';
      const next = current === 'pending' ? 'in_transit' : current === 'in_transit' ? 'completed' : 'pending';
      return { ...prev, [recId]: next };
    });
  };

  const handleGenerateAiRecommendation = async () => {
    if (isAiLoading) return; // Prevent duplicate requests

    setIsAiLoading(true);
    setAiError(null);

    try {
      // Send compact shortages and surpluses for structured decision-making
      const compactShortages = resources
        .filter((r) => r.available < r.required)
        .map((r) => ({
          name: r.name,
          location: r.location,
          deficit: r.required - r.available,
          unit: r.unit,
          status: r.status,
        }));

      const compactSurpluses = resources
        .filter((r) => r.available > r.required)
        .map((r) => ({
          name: r.name,
          location: r.location,
          surplus: r.available - r.required,
          unit: r.unit,
        }));

      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortages: compactShortages,
          surpluses: compactSurpluses,
        }),
      });

      if (!res.ok) {
        throw new Error(`Service returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiRecommendation({
        data: data.recommendation,
        isFallback: Boolean(data.isFallback),
        reason: data.reason,
      });
    } catch (err: any) {
      setAiError(err?.message || 'Failed to connect to recommendation service.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered resources for monitoring table
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const isAnomaly = detectResourceAnomaly(item).isAnomaly;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'anomaly'
            ? isAnomaly
            : item.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [resources, statusFilter, searchQuery]);

  return (
    <div className="dashboard-shell min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="brand-mark w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-slate-100" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="brand-name font-bold text-base sm:text-lg text-white tracking-tight">OpsPulse</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Observation & Coordination Hub</p>
            </div>
          </div>

          {/* Desktop Navigation Switcher */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`top-nav-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'monitoring'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              1. Monitoring & Inventory
            </button>
            <button
              onClick={() => setActiveTab('coordination')}
              className={`top-nav-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'coordination'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              <span>2. Coordination Board</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'coordination'
                  ? 'bg-slate-950 text-cyan-300'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
              >
                {transferRecommendations.length}
              </span>
            </button>
          </nav>

          {/* Actions & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Data Stream: Active</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{lastRefreshed}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer active:scale-95 disabled:opacity-60"
              title="Manual Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Mobile View Tabs */}
        <div className="flex md:hidden border-t border-slate-800 px-3 py-2 bg-slate-900 gap-2">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`top-nav-tab flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-colors ${activeTab === 'monitoring' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-800'
              }`}
          >
            1. Monitoring
          </button>
          <button
            onClick={() => setActiveTab('coordination')}
            className={`top-nav-tab flex-1 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'coordination' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-800'
              }`}
          >
            <span>2. Coordination Board</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {transferRecommendations.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* DEMO SCENARIO CONTROL BAR */}
        <section
          aria-label="Demo Scenario Selector"
          className="beige-panel rounded-xl border bg-slate-900/70 p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Demo Scenario Selector:</span>
                <span className="text-xs text-slate-400 ml-2 hidden sm:inline">{activeScenario.description}</span>
              </div>
            </div>

            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              {DEMO_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${selectedScenarioId === sc.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm ring-1 ring-cyan-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                    }`}
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2 sm:hidden">{activeScenario.description}</div>
        </section>

        {/* GUIDED DEMO JOURNEY STEPPER */}
        <nav
          aria-label="Demo User Flow Stepper"
          className="beige-panel rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Primary User Journey:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${activeTab === 'monitoring' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
            >
              <span className="font-mono text-[10px]">1</span>
              <span>Observe Dashboard</span>
            </button>

            <span className="text-slate-600">➔</span>

            <button
              onClick={() => {
                setActiveTab('monitoring');
                setStatusFilter('critical');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${statusFilter === 'critical' && activeTab === 'monitoring'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span className="font-mono text-[10px]">2</span>
              <span>Detect Shortages</span>
            </button>

            <span className="text-slate-600">➔</span>

            <button
              onClick={() => setActiveTab('coordination')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${activeTab === 'coordination' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
            >
              <span className="font-mono text-[10px]">3</span>
              <span>Review Transfers</span>
            </button>

            <span className="text-slate-600">➔</span>

            <button
              onClick={() => {
                setActiveTab('coordination');
                handleGenerateAiRecommendation();
              }}
              className="px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-900/60 font-semibold"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>4. AI Insight</span>
            </button>
          </div>
        </nav>

        {/* 4 CORE METRIC KPI CARDS WITH TIME-RANGE FILTER */}
        <section aria-label="Resource Metrics" className="beige-panel rounded-xl border p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Resource Capacity Summary
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-cyan-400 font-medium">{stats.label}</span>
            </div>

            {/* Time-Range Filter Buttons */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg text-xs self-start sm:self-auto shadow-sm">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${timeRange === 'today'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${timeRange === '7d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${timeRange === '30d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange('custom')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${timeRange === 'custom'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Custom (14D)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Resources */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Resources</span>
                <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-white">{stats.totalResources}</span>
                <span className="ml-2 text-xs text-slate-400">units tracked</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Scope</span>
                <span className="font-mono text-[11px] text-slate-300">{stats.periodDescription}</span>
              </div>
            </div>

            {/* 2. Used Resources */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Used Resources</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-indigo-300">{stats.usedResources}</span>
                <span className="ml-2 text-xs text-slate-400">units active</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Active load</span>
                <span className="font-mono font-semibold text-indigo-400">{stats.utilizationPercentage}% of pool</span>
              </div>
            </div>

            {/* 3. Available Resources */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Reserves</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-300">{stats.availableResources}</span>
                <span className="ml-2 text-xs text-slate-400">units buffer</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Safety buffer</span>
                <span className="font-mono font-semibold text-emerald-400">{100 - stats.utilizationPercentage}% capacity</span>
              </div>
            </div>

            {/* 4. Utilization Percentage */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Utilization Rate</span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stats.utilizationPercentage > 85
                    ? 'bg-rose-950/80 border-rose-800/40 text-rose-400'
                    : stats.utilizationPercentage > 70
                      ? 'bg-amber-950/80 border-amber-800/40 text-amber-400'
                      : 'bg-cyan-950/80 border-cyan-800/40 text-cyan-400'
                    }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold tracking-tight text-white">{stats.utilizationPercentage}%</span>
                <span
                  className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${stats.utilizationPercentage > 85
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    : stats.utilizationPercentage > 70
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                    }`}
                >
                  {stats.utilizationPercentage > 85 ? 'Critical Load' : stats.utilizationPercentage > 70 ? 'High Demand' : 'Optimal'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Period trend</span>
                <span className="font-mono text-[11px] text-cyan-400 font-medium">{stats.utilizationDelta}</span>
              </div>
            </div>
          </div>
        </section>

        {/* VIEW 1: COORDINATION BOARD */}
        {activeTab === 'coordination' && (
          <section className="space-y-6">
            {/* Coordination Board Header */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
                      <Truck className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Coordination & Redistribution Board
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                    Rule-based redistribution pairing. Automatically identifies shortage nodes, pairs them with donor facilities possessing surplus, and enforces baseline preservation invariants.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Shortages</div>
                    <div className="text-base sm:text-lg font-bold text-cyan-400">{transferRecommendations.length} Actions</div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Donor Buffer Invariant</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400">Protected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation Banner & Trigger (Requirements Polish) */}
            <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base">Gemini Coordination Intelligence</h3>
                      {aiRecommendation && !isAiLoading && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${aiRecommendation.isFallback
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                            }`}
                        >
                          {aiRecommendation.isFallback ? 'Fallback Recommendation' : 'Gemini 3.8 Flash (Active)'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Analyzes current deficit nodes and produces a single concise coordination recommendation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAiRecommendation}
                  disabled={isAiLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 shadow-md shadow-cyan-950/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60 whitespace-nowrap"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {isAiLoading
                      ? 'Generating Suggestion...'
                      : aiRecommendation
                        ? 'Re-generate Coordination Suggestion'
                        : 'Generate Coordination Suggestion'}
                  </span>
                </button>
              </div>

              {/* State 1: Loading State */}
              {isAiLoading && (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 animate-pulse">
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-cyan-900/30 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    <span className="text-xs text-cyan-300 font-medium">
                      Sending compact shortage summary to server route & awaiting Gemini recommendation...
                    </span>
                  </div>
                </div>
              )}

              {/* State 2: Error State */}
              {aiError && !isAiLoading && (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                  <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                    <button
                      onClick={handleGenerateAiRecommendation}
                      className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-medium text-xs border border-rose-700 cursor-pointer self-start sm:self-auto"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: Success State (Structured JSON Output) */}
              {aiRecommendation && !isAiLoading && !aiError && (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-200 space-y-2">
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-900/60 text-slate-200 space-y-2.5">
                    {/* Header Badges: Severity, Location, Confidence */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${aiRecommendation.data.severity === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : aiRecommendation.data.severity === 'high'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                        >
                          Severity: {aiRecommendation.data.severity}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{aiRecommendation.data.affected_location}</span>
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[11px] border border-slate-800">
                        {Math.round(
                          aiRecommendation.data.confidence <= 1
                            ? aiRecommendation.data.confidence * 100
                            : aiRecommendation.data.confidence
                        )}% Confidence
                      </span>
                    </div>

                    {/* Recommended Action */}
                    <div className="text-xs sm:text-sm leading-relaxed">
                      <span className="font-bold text-cyan-300">Action: </span>
                      <span className="text-white font-medium">{aiRecommendation.data.recommended_action}</span>
                    </div>

                    {/* Factual Reason */}
                    <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-900">
                      <span className="text-slate-500 font-bold">Reason:</span>
                      <span>{aiRecommendation.data.reason}</span>
                    </div>
                  </div>

                  {aiRecommendation.reason && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-amber-400 font-semibold">•</span>
                      <span>{aiRecommendation.reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of Recommended Redistribution Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <span>Suggested Transfer Actions</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({transferRecommendations.length} action{transferRecommendations.length === 1 ? '' : 's'})
                  </span>
                </h3>
              </div>

              {/* EMPTY STATE: When there are no shortages */}
              {transferRecommendations.length === 0 ? (
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">All Facilities Operating Above Threshold</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      No active deficits detected across any monitored units. All facilities hold adequate safety buffers above baseline.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectScenario('mass-casualty')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Load Surge Scenario to Test Coordination</span>
                  </button>
                </div>
              ) : (
                transferRecommendations.map((rec, index) => {
                  const actionState = actionStatuses[rec.id] || 'pending';
                  const isEvidenceOpen = expandedEvidenceId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${actionState === 'completed'
                        ? 'border-emerald-800/60 bg-emerald-950/20'
                        : actionState === 'in_transit'
                          ? 'border-cyan-800/60 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                        }`}
                    >
                      <div className="p-5">
                        {/* Top Action Row: Header & Urgency */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                            <span className="font-semibold text-white text-sm sm:text-base">{rec.resourceName}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-xs text-slate-300">
                              {rec.category}
                            </span>
                            {(() => {
                              const shortageItem = resources.find((r) => r.id === rec.shortageResourceId);
                              const targetAnomaly = shortageItem ? detectResourceAnomaly(shortageItem) : { isAnomaly: false };
                              return targetAnomaly.isAnomaly ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 shadow-sm"
                                  title={targetAnomaly.reason}
                                >
                                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                                  <span>Anomaly Flagged</span>
                                </span>
                              ) : null;
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${rec.urgency === 'urgent'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                                : rec.urgency === 'high'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                                }`}
                            >
                              {rec.urgency} Urgency
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${actionState === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : actionState === 'in_transit'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                            >
                              {actionState === 'completed'
                                ? 'Delivered & Coordinated'
                                : actionState === 'in_transit'
                                  ? 'Dispatched / In-Transit'
                                  : 'Pending Action'}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Route Visualisation */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Source Location (Donor with surplus) */}
                          <div className="md:col-span-5 p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center justify-between">
                              <span>Donor Source (Surplus)</span>
                              <span className="font-mono text-xs text-emerald-300">
                                +{rec.evidence.sourceSurplus} surplus
                              </span>
                            </div>
                            <div className="font-medium text-slate-100 text-sm mt-1">{rec.sourceLocation}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Available: <span className="text-white font-mono">{rec.evidence.sourceAvailable}</span> • Required: <span className="font-mono text-slate-300">{rec.evidence.sourceRequired}</span>
                            </div>
                          </div>

                          {/* Middle Arrow / Reallocation Volume */}
                          <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                            <div className="px-3 py-1.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold font-mono shadow-sm flex items-center gap-1.5">
                              <span>Move {rec.recommendedUnits}</span>
                              <span className="text-[11px] font-normal">{rec.unit}</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-cyan-400 mt-1 hidden md:block" />
                          </div>

                          {/* Target Location (Shortage site) */}
                          <div className="md:col-span-5 p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-rose-400 flex items-center justify-between">
                              <span>Recipient Target (Deficit)</span>
                              <span className="font-mono text-xs text-rose-300">
                                -{rec.evidence.targetDeficit} deficit
                              </span>
                            </div>
                            <div className="font-medium text-slate-100 text-sm mt-1">{rec.targetLocation}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Current stock: <span className="text-rose-400 font-mono font-bold">{rec.evidence.targetAvailable}</span> • Required: <span className="font-mono text-slate-300">{rec.evidence.targetRequired}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reason Description */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                          <FileCheck2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200">Recommended Action: </span>
                            <span>{rec.reason}</span>
                          </div>
                        </div>

                        {/* Bottom Controls: Evidence Toggle & Status Mark */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                          <button
                            onClick={() => setExpandedEvidenceId(isEvidenceOpen ? null : rec.id)}
                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer transition-colors"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>{isEvidenceOpen ? 'Hide Evidence & Math' : 'Inspect Evidence & Math'}</span>
                            {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActionStatus(rec.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${actionState === 'completed'
                                ? 'bg-emerald-900/60 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700'
                                : actionState === 'in_transit'
                                  ? 'bg-cyan-900/60 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-700'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                            >
                              {actionState === 'completed' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Coordinated (Reset)</span>
                                </>
                              ) : actionState === 'in_transit' ? (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>In-Transit (Mark Complete)</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Dispatch / Mark In-Transit</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Evidence / Reasoning Panel */}
                        {isEvidenceOpen && (
                          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                              <Calculator className="w-4 h-4 text-cyan-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Deterministic Reasoning & Arithmetic Audit
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              {/* Target Deficit Equation */}
                              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                                <div className="text-[11px] text-slate-400 font-medium">1. Target Deficit Calc</div>
                                <div className="font-mono text-sm font-semibold text-rose-300 mt-1">
                                  {rec.evidence.targetRequired} req - {rec.evidence.targetAvailable} avail ={' '}
                                  <span className="text-rose-400 font-bold">{rec.evidence.targetDeficit}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Recipient requires at least {rec.evidence.targetDeficit} more {rec.unit} to meet baseline safety.
                                </p>
                              </div>

                              {/* Source Surplus Equation */}
                              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                                <div className="text-[11px] text-slate-400 font-medium">2. Source Surplus Calc</div>
                                <div className="font-mono text-sm font-semibold text-emerald-300 mt-1">
                                  {rec.evidence.sourceAvailable} avail - {rec.evidence.sourceRequired} req ={' '}
                                  <span className="text-emerald-400 font-bold">+{rec.evidence.sourceSurplus}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Donor holds {rec.evidence.sourceSurplus} discretionary units without dropping into deficit.
                                </p>
                              </div>

                              {/* Safe Transfer Decision */}
                              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                                <div className="text-[11px] text-slate-400 font-medium">3. Allocated Reassignment</div>
                                <div className="font-mono text-sm font-semibold text-cyan-300 mt-1">
                                  min({rec.evidence.targetDeficit}, {rec.evidence.sourceSurplus}) ={' '}
                                  <span className="text-cyan-400 font-bold">{rec.recommendedUnits} {rec.unit}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Donor retains {rec.evidence.postTransferSourceAvailable} units (≥ {rec.evidence.sourceRequired} required).
                                </p>
                              </div>
                            </div>

                            {/* Post-Transfer Verification */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-300">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>
                                  Target simulated stock:{' '}
                                  <strong className="text-emerald-300 font-mono">
                                    {rec.evidence.postTransferTargetAvailable} {rec.unit}
                                  </strong>{' '}
                                  (Deficit resolved: {Math.round((rec.recommendedUnits / rec.evidence.targetDeficit) * 100)}%)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 font-mono">
                                <span>Safety Invariant Preserved:</span>
                                <span className="text-emerald-400 font-bold">TRUE</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* VIEW 2: OBSERVATION & MONITORING (Overview Table & Summary) */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Single Responsive Utilization Trend Chart */}
            <UtilizationTrendChart
              timeRange={timeRange}
              currentUtilization={stats.utilizationPercentage}
              totalResources={stats.totalResources}
            />

            {/* Deterministic System Operational Alerts Feed */}
            <AlertPanel
              resources={resources}
              onNavigateToCoordination={() => setActiveTab('coordination')}
            />

            {/* Shortage Summary Panel */}
            <section
              aria-label="Shortage Summary Panel"
              className="beige-panel rounded-xl border p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h2 className="font-semibold text-white text-base">Shortage Detection & Risk Summary</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Deterministic threshold evaluations: Critical (≤35% required or reserve depleted), Low (&lt;required or load &gt;75%).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Net Network Deficit:</span>
                  <span
                    className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${shortageSummary.totalDeficitUnits > 0
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      }`}
                  >
                    {shortageSummary.totalDeficitUnits > 0
                      ? `-${shortageSummary.totalDeficitUnits} units deficit`
                      : '0 deficit (Healthy)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                {/* Critical Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${statusFilter === 'critical'
                    ? 'bg-rose-950/60 border-rose-600 ring-1 ring-rose-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-300">Critical Shortages</span>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{shortageSummary.criticalCount}</span>
                    <span className="text-xs text-rose-400/90 font-medium">immediate action</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Available ≤ 35% required or reserve depleted</p>
                </button>

                {/* Low Stock Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${statusFilter === 'low'
                    ? 'bg-amber-950/60 border-amber-600 ring-1 ring-amber-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300">Low Stock Warnings</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{shortageSummary.lowCount}</span>
                    <span className="text-xs text-amber-400/90 font-medium">monitor closely</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Available &lt; required or utilization &gt; 75%</p>
                </button>

                {/* Normal / Adequate Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'normal' ? 'all' : 'normal')}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${statusFilter === 'normal'
                    ? 'bg-emerald-950/60 border-emerald-600 ring-1 ring-emerald-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300">Adequate / Balanced</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{shortageSummary.normalCount}</span>
                    <span className="text-xs text-emerald-400/90 font-medium">optimal supply</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Sufficient reserves above minimum baseline</p>
                </button>
              </div>

              {/* Impacted Locations Bar */}
              {shortageSummary.impactedLocations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Impacted Facilities ({shortageSummary.impactedLocations.length}):</span>
                  {shortageSummary.impactedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Detailed Resource Table */}
            <section aria-label="Resource Inventory Table" className="beige-panel rounded-xl border overflow-hidden">
              <div className="resource-inventory-header p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <h2 className="font-semibold text-sm sm:text-base text-white">Monitored Resource Inventory</h2>
                  <span className="text-xs text-slate-400">
                    ({filteredResources.length} of {resources.length} active records)
                  </span>
                </div>

                {/* Search and Status Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search resource or facility..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('critical')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${statusFilter === 'critical' ? 'bg-rose-500 text-white font-semibold' : 'text-rose-400 hover:text-rose-300'
                        }`}
                    >
                      Critical ({shortageSummary.criticalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('low')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${statusFilter === 'low' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-amber-400 hover:text-amber-300'
                        }`}
                    >
                      Low ({shortageSummary.lowCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('normal')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${statusFilter === 'normal' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                    >
                      Normal ({shortageSummary.normalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter(statusFilter === 'anomaly' ? 'all' : 'anomaly')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${statusFilter === 'anomaly'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-purple-400 hover:text-purple-300'
                        }`}
                    >
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span>Anomalies ({resources.filter((r) => detectResourceAnomaly(r).isAnomaly).length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table or Empty State */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Resource Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Required</th>
                      <th className="py-3 px-4 text-center">Available</th>
                      <th className="py-3 px-4 text-center">Balance</th>
                      <th className="py-3 px-4">Utilization</th>
                      <th className="py-3 px-4 text-right">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResources.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="space-y-2">
                            <Search className="w-8 h-8 text-slate-600 mx-auto" />
                            <div className="font-semibold text-slate-300">No resources matched your filter criteria</div>
                            <p className="text-xs text-slate-500">
                              Try clearing your search query or switching the status filter back to "All".
                            </p>
                            <button
                              onClick={() => {
                                setStatusFilter('all');
                                setSearchQuery('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-medium cursor-pointer"
                            >
                              Reset Table Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredResources.map((item) => {
                        const itemUtilization = Math.round((item.used / item.total) * 100);
                        const thresholdEval = evaluateResourceThreshold(
                          item.available,
                          item.required,
                          item.total,
                          item.used
                        );
                        const balance = item.available - item.required;
                        const anomaly = detectResourceAnomaly(item);
                        const isExpanded = expandedResourceId === item.id;
                        const matchingRec = transferRecommendations.find(
                          (r) => r.targetLocation === item.location && r.resourceName === item.name
                        );

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => setExpandedResourceId(isExpanded ? null : item.id)}
                              className={`transition-colors cursor-pointer border-b border-slate-800/60 ${isExpanded
                                ? 'bg-slate-800/80 ring-1 ring-cyan-500/40'
                                : 'hover:bg-slate-800/40'
                                }`}
                              title="Click row to inspect drill-down details"
                            >
                              {/* Resource Name, Expander & Anomaly Flag */}
                              <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedResourceId(isExpanded ? null : item.id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                    aria-label="Toggle drill-down details"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <span className="font-semibold text-slate-100">{item.name}</span>
                                  {anomaly.isAnomaly && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 shadow-sm"
                                      title={anomaly.reason}
                                    >
                                      <Zap className="w-2.5 h-2.5 text-purple-400" />
                                      <span>Anomaly</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 pl-6">{item.category}</span>
                              </td>

                              {/* Location */}
                              <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="text-slate-200">{item.location}</span>
                                </div>
                              </td>

                              {/* Required */}
                              <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300 whitespace-nowrap">
                                {item.required} <span className="text-[11px] text-slate-500">{item.unit}</span>
                              </td>

                              {/* Available */}
                              <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                                <span
                                  className={
                                    item.status === 'critical'
                                      ? 'text-rose-400 font-extrabold'
                                      : item.status === 'low'
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                  }
                                >
                                  {item.available}
                                </span>{' '}
                                <span className="text-[11px] text-slate-500 font-normal">{item.unit}</span>
                              </td>

                              {/* Balance (Deficit / Surplus) */}
                              <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                                {balance < 0 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 font-semibold">
                                    {balance} {item.unit}
                                  </span>
                                ) : balance === 0 ? (
                                  <span className="text-slate-400">At Baseline</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold">
                                    +{balance} surplus
                                  </span>
                                )}
                              </td>

                              {/* Utilization */}
                              <td className="py-3.5 px-4 min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${itemUtilization >= 90
                                        ? 'bg-rose-500'
                                        : itemUtilization >= 75
                                          ? 'bg-amber-500'
                                          : 'bg-cyan-500'
                                        }`}
                                      style={{ width: `${Math.min(itemUtilization, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono font-medium text-slate-300 w-10 text-right">
                                    {itemUtilization}%
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                  {item.used} / {item.total} used
                                </div>
                              </td>

                              {/* Visual Status Badges & Quick Action Link */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'critical'
                                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/70'
                                      : item.status === 'low'
                                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/70'
                                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                                      }`}
                                  >
                                    {item.status}
                                  </span>

                                  {/* Quick action to jump straight to coordination */}
                                  {item.available < item.required && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('coordination');
                                      }}
                                      className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                      title="View Redistribution Action on Coordination Board"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                  {thresholdEval.reason}
                                </div>
                              </td>
                            </tr>

                            {/* DRILL-DOWN EXPANDABLE CARD VIEW */}
                            {isExpanded && (
                              <tr className="bg-slate-950/95 border-b border-cyan-900/40 animate-in fade-in duration-200">
                                <td colSpan={7} className="p-4 sm:p-5">
                                  <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 space-y-5 shadow-inner">
                                    {/* Drill-down Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-bold text-base text-white flex items-center gap-2">
                                            <span>{item.name}</span>
                                            <span className="font-mono text-xs text-slate-400 font-normal">
                                              ({item.id})
                                            </span>
                                          </h3>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                            Priority: {item.priority}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                          Granular operational drill-down telemetry, shortage threshold audit, and recommended redistribution path.
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-xs text-slate-400">Telemetry Freshness:</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700 flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-cyan-400" />
                                          <span>{item.lastUpdated}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* 4 Information Drill-down Quadrants */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                      {/* 1. Location & Capacity Architecture */}
                                      <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-slate-800">
                                          <span className="flex items-center gap-1.5 text-cyan-300">
                                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Facility Location</span>
                                          </span>
                                          <span className="font-mono text-[11px] text-slate-400">{item.category}</span>
                                        </div>

                                        <div className="text-sm font-bold text-white">{item.location}</div>

                                        <div className="space-y-1 pt-1 font-mono text-[11px] text-slate-300">
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Total Registered:</span>
                                            <span className="text-white font-semibold">{item.total} {item.unit}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Currently Deployed:</span>
                                            <span className="text-white font-semibold">{item.used} {item.unit} ({itemUtilization}%)</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Available Reserves:</span>
                                            <span className={`font-semibold ${item.available < item.required ? 'text-rose-400' : 'text-emerald-400'}`}>
                                              {item.available} {item.unit}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Safety Baseline:</span>
                                            <span className="text-slate-200">{item.required} {item.unit}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 2. Shortage Reason & Threshold Evaluation */}
                                      <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-slate-800">
                                          <span className="flex items-center gap-1.5 text-rose-300">
                                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Threshold Reason</span>
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'critical'
                                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                              : item.status === 'low'
                                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                              }`}
                                          >
                                            {item.status}
                                          </span>
                                        </div>

                                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                          {thresholdEval.reason}
                                        </p>

                                        <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 space-y-1 text-[11px]">
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Deficit Calculation:</span>
                                            <span className="font-mono font-bold text-rose-300">
                                              {balance < 0 ? `-${Math.abs(balance)} ${item.unit}` : '0 (Safe)'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Buffer Ratio:</span>
                                            <span className="font-mono text-slate-300">
                                              {item.required > 0 ? Math.round((item.available / item.required) * 100) : 100}% of req
                                            </span>
                                          </div>
                                        </div>

                                        {anomaly.isAnomaly && (
                                          <div className="text-[11px] text-purple-300 bg-purple-950/60 p-2 rounded border border-purple-800/70 flex items-start gap-1.5">
                                            <Zap className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                                            <span>{anomaly.reason}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* 3. Operational Telemetry History */}
                                      <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-slate-800">
                                          <span className="flex items-center gap-1.5 text-amber-300">
                                            <History className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Telemetry History</span>
                                          </span>
                                          <span className="font-mono text-[10px] text-slate-400">3 Checkpoints</span>
                                        </div>

                                        <div className="space-y-2 pt-0.5">
                                          {/* T-3h Checkpoint */}
                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1 shrink-0" />
                                            <div>
                                              <span className="font-semibold text-slate-300">T - 3 Hours: </span>
                                              <span className="text-slate-400">
                                                Baseline recorded at shift start ({item.total} {item.unit} registered, {Math.max(1, Math.round(item.used * 0.7))} in routine use).
                                              </span>
                                            </div>
                                          </div>

                                          {/* T-45m Checkpoint */}
                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                                            <div>
                                              <span className="font-semibold text-cyan-300">T - 45 Mins: </span>
                                              <span className="text-slate-400">
                                                Demand wave logged; utilization shifted to {itemUtilization}% ({item.used} units deployed).
                                              </span>
                                            </div>
                                          </div>

                                          {/* Latest Checkpoint */}
                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${item.status === 'critical' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                            <div>
                                              <span className="font-semibold text-white">Live ({item.lastUpdated}): </span>
                                              <span className="text-slate-300">
                                                Telemetry refreshed; status evaluated as{' '}
                                                <strong className={item.status === 'critical' ? 'text-rose-400' : 'text-emerald-400'}>
                                                  {item.status.toUpperCase()}
                                                </strong>.
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 4. Recommended Action & Coordination Path */}
                                      <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-slate-800">
                                            <span className="flex items-center gap-1.5 text-cyan-300">
                                              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                                              <span>Recommended Action</span>
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-400">Coordination</span>
                                          </div>

                                          {matchingRec ? (
                                            <div className="space-y-2">
                                              <div className="p-2.5 rounded bg-cyan-950/60 border border-cyan-800/80 text-[11px] space-y-1">
                                                <div className="font-bold text-cyan-300 flex items-center gap-1">
                                                  <span>Move {matchingRec.recommendedUnits} {item.unit}</span>
                                                  <span className="text-slate-400 font-normal">from</span>
                                                </div>
                                                <div className="font-medium text-white">{matchingRec.sourceLocation}</div>
                                                <div className="text-[10px] text-slate-300 mt-1">
                                                  {matchingRec.reason}
                                                </div>
                                              </div>
                                            </div>
                                          ) : balance > 0 ? (
                                            <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-800/60 text-[11px] text-emerald-200">
                                              <div className="font-bold text-emerald-300">Designated Donor Reserve</div>
                                              <p className="text-[10px] text-slate-300 mt-1">
                                                Holds +{balance} {item.unit} of surplus above safety baseline. Available to assist deficit facilities.
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                                              <div className="font-bold text-slate-200">Adequate Safety Buffer</div>
                                              <p className="text-[10px] text-slate-400 mt-1">
                                                Current reserves meet baseline standards. Maintain 15-minute observation cycles.
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-2">
                                          {matchingRec ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTab('coordination');
                                              }}
                                              className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                            >
                                              <span>Inspect On Coordination Board</span>
                                              <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTab('coordination');
                                              }}
                                              className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                              <span>View Coordination Board</span>
                                              <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-5 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OpsPulse • Resource Observation & Coordination</span>
          <span className="text-slate-600">Built for Operational Demonstrations</span>
        </div>
      </footer>
    </div>
  );
}
