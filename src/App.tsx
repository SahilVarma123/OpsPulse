import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Activity,
  Filter,
  Radio,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Bell,
  Play,
  Building,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import HeroCommandCenter from './components/HeroCommandCenter.tsx';
import ExecutiveStatCounters from './components/ExecutiveStatCounters.tsx';
import SectorCarousel, { SectorItem } from './components/SectorCarousel.tsx';
import Real3DEventMap from './components/Real3DEventMap.tsx';
import DispatchSimulatorModal from './components/DispatchSimulator.tsx';

export interface StructuredAiRecommendation {
  severity: string;
  recommended_action: string;
  reason: string;
  confidence: number;
  affected_location: string;
}

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('mass-casualty');
  const [activeTab, setActiveTab] = useState<'monitoring' | 'spatial' | 'coordination' | 'alerts'>('monitoring');
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

  // Dropdown states & Sector filter state
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<SectorItem | null>(null);

  // Monitoring table filters & drill-down selection
  const [statusFilter, setStatusFilter] = useState<'all' | ShortageStatus | 'anomaly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null);

  // Coordination actions state & Dispatch Simulator Modal
  const [actionStatuses, setActionStatuses] = useState<Record<string, 'pending' | 'in_transit' | 'completed'>>({});
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [simulatorRec, setSimulatorRec] = useState<TransferRecommendation | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Gemini AI recommendation state
  const [aiRecommendation, setAiRecommendation] = useState<{
    data: StructuredAiRecommendation;
    isFallback: boolean;
    reason?: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Computed metrics
  const stats = useMemo(() => computeTimeWindowStats(resources, timeRange), [resources, timeRange]);
  const shortageSummary = useMemo(() => computeShortageSummary(resources), [resources]);
  const transferRecommendations = useMemo(() => generateTransferRecommendations(resources), [resources]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return ['all', ...Array.from(set)];
  }, [resources]);

  // Click outside to close dropdowns
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scenarioDropdownRef.current && !scenarioDropdownRef.current.contains(event.target as Node)) {
        setIsScenarioDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scenario change handler
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsScenarioDropdownOpen(false);
    setAiRecommendation(null);
    setAiError(null);
    setActionStatuses({});
    setExpandedEvidenceId(null);
    setExpandedResourceId(null);
    setStatusFilter('all');
    setCategoryFilter('all');
    setSelectedSector(null);
    setSearchQuery('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 450);
  };

  const handleToggleActionStatus = (recId: string) => {
    setActionStatuses((prev) => {
      const current = prev[recId] || 'pending';
      const next = current === 'pending' ? 'in_transit' : current === 'in_transit' ? 'completed' : 'pending';
      return { ...prev, [recId]: next };
    });
  };

  const handleOpenSimulator = (rec: TransferRecommendation) => {
    setSimulatorRec(rec);
    setIsSimulatorOpen(true);
  };

  const handleDispatchConfirmed = (recId: string) => {
    setActionStatuses((prev) => ({ ...prev, [recId]: 'completed' }));
  };

  const handleSectorSelect = (sector: SectorItem | null) => {
    setSelectedSector(sector);
    if (sector) {
      if (sector.categoryMatch.length === 1) {
        setCategoryFilter(sector.categoryMatch[0]);
      } else {
        setCategoryFilter('all');
      }
      setStatusFilter('all');
      setSearchQuery('');
      setActiveTab('monitoring');
      setTimeout(() => {
        const el = document.getElementById('inventory-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } else {
      setCategoryFilter('all');
    }
  };

  const handleGenerateAiRecommendation = async () => {
    if (isAiLoading) return;

    setIsAiLoading(true);
    setAiError(null);

    try {
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
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Service returned HTTP ${res.status}`);
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
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSector =
        !selectedSector || selectedSector.categoryMatch.includes(item.category);
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesSector && matchesSearch;
    });
  }, [resources, statusFilter, categoryFilter, selectedSector, searchQuery]);

  return (
    <div className="ops-canvas min-h-screen text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Institutional Tricolor Ribbon */}
      <div className="ops-top-ribbon sticky top-0 z-40" />

      {/* Top Navigation */}
      <header className="border-b border-teal-900/60 bg-[#071615]/95 backdrop-blur-md sticky top-0.5 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Institutional Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-950 flex items-center justify-center shrink-0 shadow-md border border-teal-500/40 text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg text-white tracking-tight">OpsPulse</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-950 text-amber-300 border border-teal-700/60 hidden sm:inline-block">
                  ICCC Command Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">National Healthcare & Emergency Logistics Network</p>
            </div>
          </div>

          {/* Desktop Navigation Switcher */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-[#081F1C] border border-teal-900/80 relative shadow-inner">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeTab === 'monitoring'
                  ? 'text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeTab === 'monitoring' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-teal-700 rounded-lg shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>1. Inventory & Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('spatial')}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeTab === 'spatial'
                  ? 'text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeTab === 'spatial' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-teal-700 rounded-lg shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Real 3D Event Map</span>
            </button>

            <button
              onClick={() => setActiveTab('coordination')}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeTab === 'coordination'
                  ? 'text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeTab === 'coordination' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-teal-700 rounded-lg shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Truck className="w-3.5 h-3.5" />
              <span>3. Coordination Board</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'coordination'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {transferRecommendations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeTab === 'alerts'
                  ? 'text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeTab === 'alerts' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-teal-700 rounded-lg shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Bell className="w-3.5 h-3.5" />
              <span>4. System Alerts</span>
            </button>
          </nav>

          {/* Actions & Live Telemetry Stream */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#081F1C] border border-teal-900/80 text-xs text-slate-200 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">Live Feed</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-[11px]">{lastRefreshed}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0A2622] hover:bg-[#113A35] text-white border border-teal-800/80 transition-all cursor-pointer active:scale-95 disabled:opacity-60 shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
              <span className="hidden xs:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Mobile View Tabs */}
        <div className="flex md:hidden border-t border-teal-900/60 px-2 py-1.5 bg-[#071615] gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'monitoring'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-300 bg-[#081F1C] border border-teal-900'
            }`}
          >
            1. Inventory
          </button>
          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'spatial'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-300 bg-[#081F1C] border border-teal-900'
            }`}
          >
            2. Real 3D Map
          </button>
          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
              activeTab === 'coordination'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-300 bg-[#081F1C] border border-teal-900'
            }`}
          >
            <span>3. Coordination</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {transferRecommendations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'alerts'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-300 bg-[#081F1C] border border-teal-900'
            }`}
          >
            4. Alerts
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 z-10">
        {/* 1. HERO COMMAND CENTRE */}
        <HeroCommandCenter
          activeScenario={activeScenario}
          onSelectScenario={handleSelectScenario}
          onNavigateToCoordination={() => setActiveTab('coordination')}
          onNavigateToMonitoring={() => setActiveTab('monitoring')}
          onTriggerAiDirective={() => {
            setActiveTab('coordination');
            handleGenerateAiRecommendation();
          }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastRefreshed={lastRefreshed}
          totalShortagesCount={shortageSummary.criticalCount + shortageSummary.lowCount}
        />

        {/* 2. EXECUTIVE KEY STAT BOXES (Matching Video Frame 00:07) */}
        <div id="executive-summary-section">
          <ExecutiveStatCounters
            totalFacilitiesCount={14}
            totalAssetsCount={stats.totalResources}
            activeSectorsCount={categories.length - 1}
            invariantSafetyScore={100}
            onExploreFacilities={() => {
              setActiveTab('spatial');
              setTimeout(() => {
                document.getElementById('spatial-map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
            onExploreAssets={() => {
              setActiveTab('monitoring');
              setSelectedSector(null);
              setCategoryFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
              setTimeout(() => {
                document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
            onExploreSectors={() => {
              document.getElementById('sectors-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onExploreSafety={() => {
              setActiveTab('coordination');
              setTimeout(() => {
                document.getElementById('invariant-audit-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
          />
        </div>

        {/* 3. CRITICAL SECTORS SOLUTIONS CAROUSEL (Smart Solutions for Urban Sectors - Frame 00:08) */}
        <div id="sectors-section" className="scroll-mt-20">
          <SectorCarousel
            resources={resources}
            selectedSectorId={selectedSector?.id || null}
            onSelectSector={handleSectorSelect}
          />
        </div>

        {/* ACTIVE SECTOR FILTER CALLOUT IF SELECTED */}
        {selectedSector && (
          <div className="p-3.5 rounded-xl bg-[#0B2C27] border border-teal-700/80 flex items-center justify-between text-xs text-teal-200 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>
                Active Sector Filter: <strong className="text-white font-bold">{selectedSector.name}</strong>
              </span>
            </div>
            <button
              onClick={() => handleSectorSelect(null)}
              className="px-2.5 py-1 rounded-lg bg-teal-900 hover:bg-teal-800 text-white font-medium text-xs cursor-pointer"
            >
              Clear Sector Filter ✕
            </button>
          </div>
        )}

        {/* GUIDED RESPONSE LIFECYCLE STEPPER */}
        <nav
          aria-label="Demo User Flow Stepper"
          className="ops-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px] font-heading">
              Response Workflow:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'monitoring' && statusFilter === 'all'
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-teal-950/60'
              }`}
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-200 font-bold">1</span>
              <span>Monitor Telemetry</span>
            </button>

            <span className="text-slate-500">➔</span>

            <button
              onClick={() => setActiveTab('spatial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'spatial'
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-teal-950/60'
              }`}
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-200 font-bold">2</span>
              <span>Real 3D Event Map</span>
            </button>

            <span className="text-slate-500">➔</span>

            <button
              onClick={() => setActiveTab('coordination')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'coordination' && !aiRecommendation
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-teal-950/60'
              }`}
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-200 font-bold">3</span>
              <span>Review Transfers</span>
            </button>

            <span className="text-slate-500">➔</span>

            <button
              onClick={() => {
                setActiveTab('coordination');
                handleGenerateAiRecommendation();
              }}
              className="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-amber-300 hover:text-white bg-[#0E332E] hover:bg-[#13423C] border border-amber-500/50 font-bold shadow-sm"
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-600/50">4</span>
              <span>Synthesize AI Directive</span>
            </button>
          </div>
        </nav>

        {/* VIEW 1: REAL 3D GEOSPATIAL EVENT DETECTION & DISTANCE MAP */}
        {activeTab === 'spatial' && (
          <div id="spatial-map-section" className="scroll-mt-20">
            <Real3DEventMap
              resources={resources}
              onNavigateToCoordination={() => setActiveTab('coordination')}
            />
          </div>
        )}

        {/* VIEW 2: OPERATIONAL ALERTS FEED */}
        {activeTab === 'alerts' && (
          <AlertPanel
            resources={resources}
            onNavigateToCoordination={() => setActiveTab('coordination')}
          />
        )}

        {/* VIEW 3: COORDINATION BOARD */}
        {activeTab === 'coordination' && (
          <section id="invariant-audit-section" className="space-y-6 scroll-mt-20">
            {/* Coordination Board Header */}
            <div className="ops-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-950 border border-teal-700/80 text-amber-400 shrink-0 shadow-sm">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
                      Safe Bilateral Redistribution Board
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    Rule-based redistribution pairing. Automatically identifies shortage nodes, pairs them with donor facilities possessing surplus, and enforces baseline preservation invariants.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2.5 rounded-xl bg-[#081F1C] border border-teal-900/80 text-right shadow-inner">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Active Deficits</div>
                    <div className="text-base sm:text-lg font-bold text-amber-300 font-heading">{transferRecommendations.length} Actions</div>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-[#081F1C] border border-teal-900/80 text-right shadow-inner">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Donor Safety Baseline</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-center justify-end gap-1 font-heading">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div className="rounded-xl border border-teal-700/60 bg-gradient-to-r from-[#0A2522] via-[#0E3530] to-[#0A2522] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base tracking-tight font-heading">
                        Gemini AI Coordination Directives
                      </h3>
                      {aiRecommendation && !isAiLoading && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            aiRecommendation.isFallback
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                              : 'bg-teal-950 text-teal-300 border border-teal-700/80'
                          }`}
                        >
                          {aiRecommendation.isFallback ? 'Deterministic Safety Directive' : 'Gemini 3.8 Flash (Active)'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Synthesizes real-time network deficit nodes into an auditable, high-confidence executive redistribution directive.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAiRecommendation}
                  disabled={isAiLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-950/60 transition-all cursor-pointer active:scale-95 disabled:opacity-60 whitespace-nowrap"
                >
                  <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {isAiLoading
                      ? 'Synthesizing Directive...'
                      : aiRecommendation
                        ? 'Re-evaluate Directive'
                        : 'Generate AI Coordination Directive'}
                  </span>
                </button>
              </div>

              {/* State 1: Loading State */}
              {isAiLoading && (
                <div className="mt-4 pt-3.5 border-t border-teal-900/60">
                  <div className="p-4 rounded-xl bg-[#071917] border border-teal-800/50 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    <span className="text-xs text-teal-200 font-medium">
                      Sending telemetry summary to server route & synthesizing optimal redistribution directive...
                    </span>
                  </div>
                </div>
              )}

              {/* State 2: Error State */}
              {aiError && !isAiLoading && (
                <div className="mt-4 pt-3.5 border-t border-teal-900/60">
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                    <button
                      onClick={handleGenerateAiRecommendation}
                      className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs border border-rose-700 cursor-pointer self-start sm:self-auto"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: Success State */}
              {aiRecommendation && !isAiLoading && !aiError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-teal-900/60 space-y-2.5"
                >
                  <div className="p-5 rounded-xl bg-[#09221F] border border-teal-800/80 text-slate-200 space-y-3 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-teal-900/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            aiRecommendation.data.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : aiRecommendation.data.severity === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          }`}
                        >
                          Urgency: {aiRecommendation.data.severity}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{aiRecommendation.data.affected_location}</span>
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-lg bg-[#061413] text-emerald-400 text-xs font-bold border border-teal-900">
                        {Math.round(
                          aiRecommendation.data.confidence <= 1
                            ? aiRecommendation.data.confidence * 100
                            : aiRecommendation.data.confidence
                        )}% Confidence Score
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed">
                      <span className="font-bold text-amber-300 uppercase tracking-wide text-xs">Directive: </span>
                      <span className="text-white font-medium">{aiRecommendation.data.recommended_action}</span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-start gap-1.5 pt-2 border-t border-teal-900/60">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Justification:</span>
                      <span className="leading-relaxed">{aiRecommendation.data.reason}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* List of Recommended Redistribution Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-heading">
                  <span>Audited Bilateral Transfer Actions</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({transferRecommendations.length} action{transferRecommendations.length === 1 ? '' : 's'})
                  </span>
                </h3>
              </div>

              {/* EMPTY STATE */}
              {transferRecommendations.length === 0 ? (
                <div className="ops-card p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base font-heading">All Monitored Facilities Operating Above Threshold</h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      No active deficits detected across any monitored units. All facilities hold adequate safety buffers above baseline.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectScenario('mass-casualty')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-md transition-all cursor-pointer hover:bg-teal-500 active:scale-95"
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
                      className={`ops-card overflow-hidden transition-all duration-300 ${
                        actionState === 'completed'
                          ? 'border-emerald-600/70 bg-emerald-950/15'
                          : actionState === 'in_transit'
                            ? 'border-teal-600/70 bg-teal-950/20'
                            : ''
                      }`}
                    >
                      <div className="p-5 sm:p-6">
                        {/* Top Action Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-900/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-amber-400 font-bold">#{index + 1}</span>
                            <span className="font-bold text-white text-base tracking-tight font-heading">{rec.resourceName}</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#071917] border border-teal-800 text-xs text-slate-300 font-medium">
                              {rec.category}
                            </span>
                            {(() => {
                              const shortageItem = resources.find((r) => r.id === rec.shortageResourceId);
                              const targetAnomaly = shortageItem ? detectResourceAnomaly(shortageItem) : { isAnomaly: false };
                              return targetAnomaly.isAnomaly ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  title={targetAnomaly.reason}
                                >
                                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                                  <span>Demand Spike</span>
                                </span>
                              ) : null;
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                rec.urgency === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : rec.urgency === 'high'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              }`}
                            >
                              {rec.urgency} Urgency
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                actionState === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : actionState === 'in_transit'
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {actionState === 'completed'
                                ? '✓ Delivered'
                                : actionState === 'in_transit'
                                  ? '⚡ In-Transit'
                                  : 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Route Visualisation */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Source Location (Donor with surplus) */}
                          <div className="md:col-span-5 p-4 rounded-xl bg-[#09221F] border border-emerald-600/40">
                            <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center justify-between">
                              <span>Donor Source (Verified Surplus)</span>
                              <span className="text-emerald-300 font-bold">
                                +{rec.evidence.sourceSurplus} buffer
                              </span>
                            </div>
                            <div className="font-semibold text-white text-sm mt-1">{rec.sourceLocation}</div>
                            <div className="text-xs text-slate-300 mt-1">
                              Available: <span className="text-emerald-300 font-bold">{rec.evidence.sourceAvailable}</span> • Baseline Required: {rec.evidence.sourceRequired}
                            </div>
                          </div>

                          {/* Middle Arrow / Reallocation Volume */}
                          <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                            <div className="px-3.5 py-1.5 rounded-full bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                              <span>Move {rec.recommendedUnits}</span>
                              <span className="text-[11px] font-normal">{rec.unit}</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-teal-400 mt-1.5 hidden md:block" />
                          </div>

                          {/* Target Location (Shortage site) */}
                          <div className="md:col-span-5 p-4 rounded-xl bg-[#09221F] border border-rose-600/40">
                            <div className="text-[11px] uppercase tracking-wider font-bold text-rose-400 flex items-center justify-between">
                              <span>Recipient Facility (Deficit)</span>
                              <span className="text-rose-300 font-bold">
                                -{rec.evidence.targetDeficit} deficit
                              </span>
                            </div>
                            <div className="font-semibold text-white text-sm mt-1">{rec.targetLocation}</div>
                            <div className="text-xs text-slate-300 mt-1">
                              Current stock: <span className="text-rose-400 font-bold">{rec.evidence.targetAvailable}</span> • Required: {rec.evidence.targetRequired}
                            </div>
                          </div>
                        </div>

                        {/* Reason Description */}
                        <div className="p-3.5 rounded-xl bg-[#071615] border border-teal-900/60 text-xs text-slate-200 flex items-start gap-2.5">
                          <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300">Coordination Directive: </span>
                            <span className="leading-relaxed">{rec.reason}</span>
                          </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className="mt-4 pt-3 border-t border-teal-900/60 flex flex-wrap items-center justify-between gap-3">
                          <button
                            onClick={() => setExpandedEvidenceId(isEvidenceOpen ? null : rec.id)}
                            className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-white font-semibold cursor-pointer transition-colors"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>{isEvidenceOpen ? 'Hide Safety Proof' : 'Inspect Safety Invariant Proof'}</span>
                            {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenSimulator(rec)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0B2A25] hover:bg-[#113A34] text-amber-300 border border-teal-700 hover:border-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Simulate multi-stage dispatch workflow"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Simulate Route</span>
                            </button>

                            <button
                              onClick={() => handleToggleActionStatus(rec.id)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                                actionState === 'completed'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : actionState === 'in_transit'
                                    ? 'bg-teal-600 hover:bg-teal-500 text-white'
                                    : 'bg-[#0E302B] hover:bg-[#133F39] text-slate-200 border border-teal-700/80'
                              }`}
                            >
                              {actionState === 'completed' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Transfer Completed</span>
                                </>
                              ) : actionState === 'in_transit' ? (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-white animate-bounce" />
                                  <span>In-Transit (Click to Deliver)</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5 text-slate-300" />
                                  <span>Dispatch Reallocation</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* MATHEMATICAL PROOF ACCORDION */}
                        <AnimatePresence>
                          {isEvidenceOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-teal-900/60 space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Bilateral Safe Transfer Proof & Invariant Audit:
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Target Deficit Equation */}
                                  <div className="p-3.5 rounded-xl bg-[#071917] border border-teal-900/80">
                                    <div className="text-[11px] text-slate-400 font-semibold">1. Recipient Deficit Calc</div>
                                    <div className="text-sm font-bold text-rose-300 mt-1">
                                      {rec.evidence.targetRequired} req - {rec.evidence.targetAvailable} avail ={' '}
                                      <span className="text-rose-400">-{rec.evidence.targetDeficit}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-1">
                                      Facility requires {rec.evidence.targetDeficit} units to restore baseline safety.
                                    </p>
                                  </div>

                                  {/* Source Surplus Equation */}
                                  <div className="p-3.5 rounded-xl bg-[#071917] border border-teal-900/80">
                                    <div className="text-[11px] text-slate-400 font-semibold">2. Donor Surplus Calc</div>
                                    <div className="text-sm font-bold text-emerald-300 mt-1">
                                      {rec.evidence.sourceAvailable} avail - {rec.evidence.sourceRequired} req ={' '}
                                      <span className="text-emerald-400">+{rec.evidence.sourceSurplus}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-1">
                                      Donor holds {rec.evidence.sourceSurplus} buffer units above safety baseline.
                                    </p>
                                  </div>

                                  {/* Safe Transfer Decision */}
                                  <div className="p-3.5 rounded-xl bg-[#071917] border border-teal-900/80">
                                    <div className="text-[11px] text-slate-400 font-semibold">3. Safe Invariant Allocation</div>
                                    <div className="text-sm font-bold text-teal-300 mt-1">
                                      min({rec.evidence.targetDeficit}, {rec.evidence.sourceSurplus}) ={' '}
                                      <span className="text-amber-300">{rec.recommendedUnits} {rec.unit}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-1">
                                      Donor retains {rec.evidence.postTransferSourceAvailable} units (≥ {rec.evidence.sourceRequired} baseline).
                                    </p>
                                  </div>
                                </div>

                                {/* Post-Transfer Verification */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#071917] border border-teal-900/80 text-xs text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>
                                      Target post-transfer stock:{' '}
                                      <strong className="text-emerald-300">
                                        {rec.evidence.postTransferTargetAvailable} {rec.unit}
                                      </strong>{' '}
                                      (Deficit cleared: {Math.round((rec.recommendedUnits / rec.evidence.targetDeficit) * 100)}%)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                                    <span>Safety Invariant:</span>
                                    <span className="text-emerald-400 font-bold">VERIFIED (ZERO-RISK)</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* VIEW 4: OBSERVATION & MONITORING (Overview Table & Summary) */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* 4 CORE METRIC CARDS WITH TIME-RANGE SLIDING FILTER */}
            <section aria-label="Resource Metrics" className="ops-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
                    Resource Capacity Overview
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-teal-300 font-medium">{stats.label}</span>
                </div>

                {/* Time-Range Filter Buttons */}
                <div className="flex items-center bg-[#071816] border border-teal-900/80 p-1 rounded-xl text-xs self-start sm:self-auto shadow-inner">
                  {(['today', '7d', '30d', 'custom'] as TimeRange[]).map((tr) => {
                    const isSelected = timeRange === tr;
                    const labels: Record<TimeRange, string> = {
                      today: 'Today',
                      '7d': 'Last 7 Days',
                      '30d': 'Last 30 Days',
                      custom: 'Custom 14D',
                    };
                    return (
                      <button
                        key={tr}
                        onClick={() => setTimeRange(tr)}
                        className={`relative px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="timeRangePill"
                            className="absolute inset-0 bg-teal-700 rounded-lg shadow-sm -z-10"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span>{labels[tr]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Resources */}
                <div className="rounded-xl border border-teal-900/70 bg-[#0A2622] p-5 shadow-sm hover:border-teal-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monitored</span>
                    <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800/50 flex items-center justify-center text-teal-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-white font-heading">{stats.totalResources}</span>
                    <span className="ml-2 text-xs text-slate-400 font-medium">units</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-900/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Scope</span>
                    <span className="text-slate-300">{stats.periodDescription}</span>
                  </div>
                </div>

                {/* 2. Used Resources */}
                <div className="rounded-xl border border-teal-900/70 bg-[#0A2622] p-5 shadow-sm hover:border-teal-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Deployment</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-teal-200 font-heading">{stats.usedResources}</span>
                    <span className="ml-2 text-xs text-slate-400 font-medium">in active use</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-900/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Deployment Load</span>
                    <span className="font-semibold text-teal-300">{stats.utilizationPercentage}% of total</span>
                  </div>
                </div>

                {/* 3. Available Reserves */}
                <div className="rounded-xl border border-teal-900/70 bg-[#0A2622] p-5 shadow-sm hover:border-teal-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Reserves</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-emerald-300 font-heading">{stats.availableResources}</span>
                    <span className="ml-2 text-xs text-slate-400 font-medium">ready buffer</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-900/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Safety Buffer</span>
                    <span className="font-semibold text-emerald-400">{100 - stats.utilizationPercentage}% capacity</span>
                  </div>
                </div>

                {/* 4. Utilization Percentage */}
                <div className="rounded-xl border border-teal-900/70 bg-[#0A2622] p-5 shadow-sm hover:border-teal-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Utilization Rate</span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        stats.utilizationPercentage > 85
                          ? 'bg-rose-950/80 border-rose-800/50 text-rose-400'
                          : stats.utilizationPercentage > 70
                            ? 'bg-amber-950/80 border-amber-800/50 text-amber-400'
                            : 'bg-teal-950/80 border-teal-800/50 text-teal-400'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-white font-heading">{stats.utilizationPercentage}%</span>
                    <span
                      className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        stats.utilizationPercentage > 85
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : stats.utilizationPercentage > 70
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-teal-950 text-teal-300 border border-teal-800'
                      }`}
                    >
                      {stats.utilizationPercentage > 85 ? 'Critical Load' : stats.utilizationPercentage > 70 ? 'High Demand' : 'Optimal'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-900/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Trend Shift</span>
                    <span className="text-teal-300 font-semibold">{stats.utilizationDelta}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Responsive Utilization Trend Chart */}
            <UtilizationTrendChart
              timeRange={timeRange}
              currentUtilization={stats.utilizationPercentage}
              totalResources={stats.totalResources}
            />

            {/* Shortage Summary Panel */}
            <section
              aria-label="Shortage Summary Panel"
              className="ops-card p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-900/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <h2 className="font-bold text-white text-base tracking-tight font-heading">Shortage Detection & Risk Assessment</h2>
                  </div>
                  <p className="text-xs text-slate-300">
                    Deterministic evaluations: Critical (≤35% required or depleted), Low (&lt;required or load &gt;75%).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">Net Network Deficit:</span>
                  <span
                    className={`px-3 py-1 rounded-xl font-bold text-xs border shadow-sm ${
                      shortageSummary.totalDeficitUnits > 0
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                    }`}
                  >
                    {shortageSummary.totalDeficitUnits > 0
                      ? `-${shortageSummary.totalDeficitUnits} units deficit`
                      : '0 deficit (Healthy Reserves)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {/* Critical Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'critical'
                      ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                      : 'bg-[#0A2622] border-teal-900/80 hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">Critical Shortages</span>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-heading">{shortageSummary.criticalCount}</span>
                    <span className="text-xs text-rose-300 font-medium">immediate action</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Available ≤ 35% required or reserve depleted</p>
                </button>

                {/* Low Stock Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'low'
                      ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/50'
                      : 'bg-[#0A2622] border-teal-900/80 hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Low Stock Warnings</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-heading">{shortageSummary.lowCount}</span>
                    <span className="text-xs text-amber-300 font-medium">monitor closely</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Available &lt; required or utilization &gt; 75%</p>
                </button>

                {/* Normal / Adequate Card */}
                <button
                  onClick={() => setStatusFilter(statusFilter === 'normal' ? 'all' : 'normal')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'normal'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                      : 'bg-[#0A2622] border-teal-900/80 hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Adequate / Balanced</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-heading">{shortageSummary.normalCount}</span>
                    <span className="text-xs text-emerald-300 font-medium">optimal supply</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Sufficient reserves above minimum baseline</p>
                </button>
              </div>

              {/* Impacted Locations Bar */}
              {shortageSummary.impactedLocations.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-teal-900/60 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Impacted Facilities ({shortageSummary.impactedLocations.length}):</span>
                  {shortageSummary.impactedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="px-2.5 py-1 rounded-lg bg-[#071917] text-slate-200 border border-teal-800 text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{loc}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Detailed Resource Table */}
            <section
              id="inventory-section"
              aria-label="Resource Inventory Table"
              className="ops-card overflow-hidden scroll-mt-20"
            >
              <div className="p-4 sm:p-5 border-b border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-950 border border-teal-800 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white tracking-tight font-heading">Monitored Telemetry Inventory</h2>
                    <span className="text-xs text-slate-300">
                      {filteredResources.length} of {resources.length} monitored inventory records
                    </span>
                  </div>
                </div>

                {/* Search, Category Dropdown, and Status Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search resource or facility..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-7 py-2 rounded-xl bg-[#071917] border border-teal-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-48 sm:w-56 shadow-inner transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Dropdown */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0A2622] hover:bg-[#103A34] text-slate-200 border border-teal-800 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Filter className="w-3.5 h-3.5 text-amber-400" />
                      <span className="capitalize">{categoryFilter === 'all' ? 'All Categories' : categoryFilter}</span>
                      <motion.div animate={{ rotate: isCategoryDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.16 }}
                          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0B2C27] border border-teal-700 shadow-2xl backdrop-blur-xl z-50 p-1.5 space-y-1"
                        >
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setCategoryFilter(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center justify-between ${
                                categoryFilter === cat
                                  ? 'bg-teal-700 text-white font-bold'
                                  : 'text-slate-300 hover:bg-[#123E37]'
                              }`}
                            >
                              <span>{cat === 'all' ? 'All Categories' : cat}</span>
                              {categoryFilter === cat && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center bg-[#071917] p-1 rounded-xl border border-teal-900 text-xs shadow-inner">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-teal-700 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('critical')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        statusFilter === 'critical'
                          ? 'bg-rose-600 text-white font-bold shadow-sm'
                          : 'text-rose-400 hover:text-rose-300'
                      }`}
                    >
                      Critical ({shortageSummary.criticalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('low')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        statusFilter === 'low'
                          ? 'bg-amber-600 text-white font-bold shadow-sm'
                          : 'text-amber-400 hover:text-amber-300'
                      }`}
                    >
                      Low ({shortageSummary.lowCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('normal')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        statusFilter === 'normal'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      Normal ({shortageSummary.normalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter(statusFilter === 'anomaly' ? 'all' : 'anomaly')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === 'anomaly'
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-purple-400 hover:text-purple-300'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span>Spikes</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-teal-900/60 bg-[#081F1C] text-slate-300 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Resource Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Required</th>
                      <th className="py-3 px-4 text-center">Available</th>
                      <th className="py-3 px-4 text-center">Balance</th>
                      <th className="py-3 px-4">Utilization</th>
                      <th className="py-3 px-4 text-right">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/40">
                    {filteredResources.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="space-y-2">
                            <Search className="w-8 h-8 text-slate-500 mx-auto" />
                            <div className="font-semibold text-slate-200">No resources matched your filter criteria</div>
                            <p className="text-xs text-slate-400">
                              Try clearing your search query or switching the category and status filters back to "All".
                            </p>
                            <button
                              onClick={() => {
                                setStatusFilter('all');
                                setCategoryFilter('all');
                                setSelectedSector(null);
                                setSearchQuery('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-900 hover:bg-teal-800 text-white border border-teal-700 text-xs font-semibold cursor-pointer"
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
                              className={`transition-colors cursor-pointer border-b border-teal-900/30 ${
                                isExpanded
                                  ? 'bg-[#0E332E] ring-1 ring-teal-500/40'
                                  : 'hover:bg-[#092622]'
                              }`}
                              title="Click row to inspect drill-down details"
                            >
                              <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedResourceId(isExpanded ? null : item.id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-teal-900 transition-colors"
                                    aria-label="Toggle drill-down details"
                                  >
                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                      <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                                    </motion.div>
                                  </button>
                                  <span className="font-semibold text-slate-100">{item.name}</span>
                                  {anomaly.isAnomaly && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                      title={anomaly.reason}
                                    >
                                      <Zap className="w-2.5 h-2.5 text-purple-400" />
                                      <span>Spike</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 pl-6">{item.category}</span>
                              </td>

                              <td className="py-3.5 px-4 text-slate-200 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{item.location}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center font-medium text-slate-200 whitespace-nowrap">
                                {item.required} <span className="text-xs text-slate-400">{item.unit}</span>
                              </td>

                              <td className="py-3.5 px-4 text-center font-bold whitespace-nowrap">
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
                                <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                              </td>

                              <td className="py-3.5 px-4 text-center text-xs whitespace-nowrap">
                                {balance < 0 ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                    {balance} {item.unit}
                                  </span>
                                ) : balance === 0 ? (
                                  <span className="text-slate-400">At Baseline</span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                    +{balance} surplus
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-teal-900/60">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        itemUtilization >= 90
                                          ? 'bg-rose-500'
                                          : itemUtilization >= 75
                                            ? 'bg-amber-500'
                                            : 'bg-teal-500'
                                      }`}
                                      style={{ width: `${Math.min(itemUtilization, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-200 w-10 text-right">
                                    {itemUtilization}%
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {item.used} / {item.total} deployed
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                                      item.status === 'critical'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : item.status === 'low'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    }`}
                                  >
                                    {item.status}
                                  </span>

                                  {item.available < item.required && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('coordination');
                                      }}
                                      className="p-1 rounded-lg hover:bg-teal-900 text-teal-300 hover:text-white cursor-pointer transition-colors"
                                      title="Inspect on Coordination Board"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 max-w-[200px] truncate ml-auto">
                                  {thresholdEval.reason}
                                </div>
                              </td>
                            </tr>

                            {/* DRILL-DOWN EXPANDABLE VIEW */}
                            {isExpanded && (
                              <tr className="bg-[#061413] border-b border-teal-900/60">
                                <td colSpan={7} className="p-4 sm:p-5">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="rounded-xl border border-teal-800/80 bg-[#09221F] p-5 space-y-5 shadow-xl"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-900/60">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-bold text-base text-white flex items-center gap-2 font-heading">
                                            <span>{item.name}</span>
                                            <span className="text-xs text-slate-400 font-normal">
                                              ({item.id})
                                            </span>
                                          </h3>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-950 text-teal-200 border border-teal-800">
                                            Priority: {item.priority}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-300">
                                          Granular operational drill-down telemetry, shortage threshold audit, and recommended redistribution path.
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-xs text-slate-400">Telemetry Freshness:</span>
                                        <span className="px-2.5 py-1 rounded-lg bg-[#071917] text-teal-200 text-xs border border-teal-900 flex items-center gap-1.5 shadow-sm">
                                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{item.lastUpdated}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* 4 Quadrants */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                      {/* 1. Location & Capacity */}
                                      <div className="p-4 rounded-xl bg-[#0B2A25] border border-teal-900/60 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-teal-900/60">
                                          <span className="flex items-center gap-1.5 text-teal-300">
                                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Facility Site</span>
                                          </span>
                                          <span className="text-slate-400">{item.category}</span>
                                        </div>

                                        <div className="text-sm font-bold text-white font-heading">{item.location}</div>

                                        <div className="space-y-1.5 pt-1 text-slate-300">
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
                                            <span className={`font-semibold ${item.available < item.required ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                                              {item.available} {item.unit}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Safety Baseline:</span>
                                            <span className="text-slate-200">{item.required} {item.unit}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 2. Threshold Evaluation */}
                                      <div className="p-4 rounded-xl bg-[#0B2A25] border border-teal-900/60 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-teal-900/60">
                                          <span className="flex items-center gap-1.5 text-rose-300">
                                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Threshold Reason</span>
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              item.status === 'critical'
                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                : item.status === 'low'
                                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            }`}
                                          >
                                            {item.status}
                                          </span>
                                        </div>

                                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                          {thresholdEval.reason}
                                        </p>

                                        <div className="p-2.5 rounded-lg bg-[#061413] border border-teal-900/60 space-y-1 text-slate-300">
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Deficit Calculation:</span>
                                            <span className="font-bold text-rose-300">
                                              {balance < 0 ? `-${Math.abs(balance)} ${item.unit}` : '0 (Safe Buffer)'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Buffer Ratio:</span>
                                            <span className="text-slate-300">
                                              {item.required > 0 ? Math.round((item.available / item.required) * 100) : 100}% of baseline
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 3. Telemetry Timeline */}
                                      <div className="p-4 rounded-xl bg-[#0B2A25] border border-teal-900/60 space-y-2.5">
                                        <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-teal-900/60">
                                          <span className="flex items-center gap-1.5 text-amber-300">
                                            <History className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Telemetry Timeline</span>
                                          </span>
                                          <span className="text-slate-400">3 Logs</span>
                                        </div>

                                        <div className="space-y-2 pt-0.5">
                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1 shrink-0" />
                                            <div>
                                              <span className="font-semibold text-slate-300">Shift Baseline: </span>
                                              <span className="text-slate-400">
                                                {item.total} {item.unit} logged at start.
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 shrink-0" />
                                            <div>
                                              <span className="font-semibold text-teal-200">Demand Wave: </span>
                                              <span className="text-slate-300">
                                                Shifted to {itemUtilization}% utilization ({item.used} units deployed).
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-start gap-2 text-[11px]">
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${item.status === 'critical' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                                            <div>
                                              <span className="font-semibold text-white">Live ({item.lastUpdated}): </span>
                                              <span className="text-slate-300">
                                                Evaluated as{' '}
                                                <strong className={item.status === 'critical' ? 'text-rose-400' : 'text-emerald-400'}>
                                                  {item.status.toUpperCase()}
                                                </strong>.
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 4. Recommended Action */}
                                      <div className="p-4 rounded-xl bg-[#0B2A25] border border-teal-900/60 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-teal-900/60">
                                            <span className="flex items-center gap-1.5 text-teal-300">
                                              <Boxes className="w-3.5 h-3.5 text-amber-400" />
                                              <span>Recommended Action</span>
                                            </span>
                                            <span className="text-slate-400">Bilateral</span>
                                          </div>

                                          {matchingRec ? (
                                            <div className="space-y-2">
                                              <div className="p-2.5 rounded-lg bg-[#061413] border border-teal-800 text-[11px] space-y-1">
                                                <div className="font-bold text-amber-300 flex items-center gap-1">
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
                                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-200">
                                              <div className="font-bold text-emerald-300">Designated Donor Reserve</div>
                                              <p className="text-[10px] text-slate-300 mt-1">
                                                Holds +{balance} {item.unit} surplus buffer. Available to assist deficit facilities.
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="p-2.5 rounded-lg bg-[#061413] border border-teal-900/60 text-[11px] text-slate-300">
                                              <div className="font-bold text-slate-200">Adequate Safety Buffer</div>
                                              <p className="text-[10px] text-slate-400 mt-1">
                                                Current reserves meet baseline standards.
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="pt-2">
                                          {matchingRec ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTab('coordination');
                                              }}
                                              className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/50 transition-all cursor-pointer active:scale-95"
                                            >
                                              <span>Inspect on Coordination Board</span>
                                              <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTab('coordination');
                                              }}
                                              className="w-full py-2 px-3 rounded-xl bg-[#071917] hover:bg-[#0D2D29] text-teal-200 border border-teal-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                              <span>View Coordination Board</span>
                                              <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
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

      {/* DISPATCH SIMULATOR MODAL */}
      <DispatchSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        recommendation={simulatorRec}
        onDispatchConfirmed={handleDispatchConfirmed}
      />

      {/* Footer */}
      <footer className="border-t border-teal-900/60 py-6 text-center text-xs text-slate-400 bg-[#071615] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-white font-bold">OpsPulse</span>
            <span className="text-slate-600">•</span>
            <span>Integrated Command and Control Centre (ICCC) Architecture</span>
          </div>
          <span className="text-slate-400">Zero-Donor Deficit Invariant Guards & Gemini AI Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
