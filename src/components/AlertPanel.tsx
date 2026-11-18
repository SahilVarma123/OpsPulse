import React, { useState, useMemo } from 'react';
import {
  Bell,
  ShieldAlert,
  Flame,
  Clock,
  Zap,
  CheckCircle2,
  X,
  Filter,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResourceItem } from '../types/resource.ts';
import { generateSystemAlerts, SystemAlert, AlertType, AlertSeverity } from '../utils/alerts.ts';

interface AlertPanelProps {
  resources: ResourceItem[];
  onNavigateToCoordination?: () => void;
}

export default function AlertPanel({ resources, onNavigateToCoordination }: AlertPanelProps) {
  const allAlerts = useMemo(() => generateSystemAlerts(resources), [resources]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | AlertType>('all');

  const visibleAlerts = useMemo(() => {
    return allAlerts.filter((alert) => {
      const isNotDismissed = !dismissedIds.has(alert.id);
      const matchesType = activeTypeFilter === 'all' || alert.type === activeTypeFilter;
      return isNotDismissed && matchesType;
    });
  }, [allAlerts, dismissedIds, activeTypeFilter]);

  const activeAlertsCount = allAlerts.filter((a) => !dismissedIds.has(a.id)).length;
  const criticalCount = allAlerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'critical').length;
  const highCount = allAlerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'high').length;
  const warningCount = allAlerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'warning').length;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleResetDismissed = () => {
    setDismissedIds(new Set());
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical_shortage':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'overutilization':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'stale_data':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'demand_spike':
        return <Zap className="w-4 h-4 text-teal-400" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-800 shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            <span>Critical Deficit</span>
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-950/90 text-orange-300 border border-orange-800 shadow-sm">
            High Capacity
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-800 shadow-sm">
            Warning
          </span>
        );
    }
  };

  const filterTabs: Array<{ id: 'all' | AlertType; label: string; count: number; colorClass: string }> = [
    { id: 'all', label: 'All Alerts', count: activeAlertsCount, colorClass: 'text-teal-400' },
    {
      id: 'critical_shortage',
      label: 'Shortages',
      count: allAlerts.filter((a) => a.type === 'critical_shortage' && !dismissedIds.has(a.id)).length,
      colorClass: 'text-rose-400',
    },
    {
      id: 'overutilization',
      label: 'Overutilization',
      count: allAlerts.filter((a) => a.type === 'overutilization' && !dismissedIds.has(a.id)).length,
      colorClass: 'text-orange-400',
    },
    {
      id: 'stale_data',
      label: 'Stale Sensor',
      count: allAlerts.filter((a) => a.type === 'stale_data' && !dismissedIds.has(a.id)).length,
      colorClass: 'text-amber-400',
    },
    {
      id: 'demand_spike',
      label: 'Spikes',
      count: allAlerts.filter((a) => a.type === 'demand_spike' && !dismissedIds.has(a.id)).length,
      colorClass: 'text-teal-400',
    },
  ];

  return (
    <div className="cockpit-panel p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
              Operational Anomaly & Triage Feed
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shadow-sm ${
                criticalCount > 0
                  ? 'bg-rose-950/90 text-rose-300 border border-rose-700/80'
                  : 'bg-slate-800/90 text-slate-300 border border-slate-700'
              }`}
            >
              {activeAlertsCount} Active Signals
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time deterministic monitoring: detects acute shortages, capacity overutilization, stale sensors, and sudden demand spikes.
          </p>
        </div>

        {/* Severity counters summary */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{criticalCount} Critical</span>
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-orange-950/80 border border-orange-800/60 text-orange-300 font-mono text-[11px] font-bold shadow-sm">
              {highCount} High
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono text-[11px] font-bold shadow-sm">
              {warningCount} Warnings
            </span>
          )}
          {dismissedIds.size > 0 && (
            <button
              onClick={handleResetDismissed}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore ({dismissedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Alert Type with smooth sliding transition */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
        <span className="text-slate-500 text-[11px] font-semibold px-2 flex items-center gap-1">
          <Filter className="w-3 h-3 text-teal-400" />
          <span>Filter:</span>
        </span>

        {filterTabs.map((tab) => {
          const isActive = activeTypeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTypeFilter(tab.id)}
              className={`relative px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-slate-950 text-teal-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert Feed Items with Motion AnimatePresence */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleAlerts.length === 0 ? (
            <motion.div
              key="empty-alerts"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 rounded-xl border border-slate-800 bg-slate-950/60 text-center space-y-2 shadow-inner"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">All Monitored Nodes Operating Within Safe Thresholds</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {activeAlertsCount === 0
                  ? 'No critical deficits, overutilization spikes, or stale hardware streams detected. System baseline invariant is preserved.'
                  : 'No alerts match the active filter. Select "All Alerts" to view remaining items.'}
              </p>
            </motion.div>
          ) : (
            visibleAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all shadow-sm ${
                  alert.severity === 'critical'
                    ? 'border-rose-800/60 bg-gradient-to-r from-rose-950/30 via-slate-900/90 to-slate-900/90 hover:border-rose-600/80'
                    : alert.severity === 'high'
                      ? 'border-orange-800/60 bg-gradient-to-r from-orange-950/30 via-slate-900/90 to-slate-900/90 hover:border-orange-600/80'
                      : 'border-amber-800/60 bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900/90 hover:border-amber-600/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Icon, Badge, Content */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 shrink-0 mt-0.5 shadow-inner">
                      {getAlertIcon(alert.type)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                          {alert.typeLabel}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-bold text-white tracking-tight">{alert.resourceName}</span>
                      </div>

                      <h4 className="font-bold text-white text-sm tracking-tight">{alert.title}</h4>

                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                        {alert.explanation}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="text-slate-500 font-mono">Facility:</span>
                          <strong className="text-teal-300">{alert.location}</strong>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <span className="text-slate-500">Telemetry:</span>
                          <strong className="text-white bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60">
                            {alert.metricValue}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                    {alert.type === 'critical_shortage' && onNavigateToCoordination && (
                      <button
                        onClick={onNavigateToCoordination}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-950/30 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Resolve Deficit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
