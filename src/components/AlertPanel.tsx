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
} from 'lucide-react';
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
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-950 text-orange-300 border border-orange-800">
            High Severity
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
            Warning
          </span>
        );
    }
  };

  return (
    <div className="beige-panel rounded-xl border p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">System Operational Alerts</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${criticalCount > 0
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
            >
              {activeAlertsCount} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time deterministic monitoring: detects acute shortages, capacity overutilization, stale sensors, and sudden demand spikes.
          </p>
        </div>

        {/* Severity counters summary */}
        <div className="flex items-center gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2 py-1 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono text-[11px] font-semibold">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-1 rounded bg-orange-950/80 border border-orange-800/60 text-orange-300 font-mono text-[11px] font-semibold">
              {highCount} High Load
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono text-[11px] font-semibold">
              {warningCount} Warnings
            </span>
          )}
          {dismissedIds.size > 0 && (
            <button
              onClick={handleResetDismissed}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 cursor-pointer"
            >
              Restore ({dismissedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Alert Type */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </span>

        <button
          onClick={() => setActiveTypeFilter('all')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${activeTypeFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          All ({activeAlertsCount})
        </button>
        <button
          onClick={() => setActiveTypeFilter('critical_shortage')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${activeTypeFilter === 'critical_shortage'
              ? 'bg-rose-500 text-white font-bold'
              : 'bg-slate-800 text-rose-400 hover:text-rose-300'
            }`}
        >
          Shortage ({allAlerts.filter((a) => a.type === 'critical_shortage' && !dismissedIds.has(a.id)).length})
        </button>
        <button
          onClick={() => setActiveTypeFilter('overutilization')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${activeTypeFilter === 'overutilization'
              ? 'bg-orange-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-orange-400 hover:text-orange-300'
            }`}
        >
          Overutilization ({allAlerts.filter((a) => a.type === 'overutilization' && !dismissedIds.has(a.id)).length})
        </button>
        <button
          onClick={() => setActiveTypeFilter('stale_data')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${activeTypeFilter === 'stale_data'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-amber-400 hover:text-amber-300'
            }`}
        >
          Stale Telemetry ({allAlerts.filter((a) => a.type === 'stale_data' && !dismissedIds.has(a.id)).length})
        </button>
        <button
          onClick={() => setActiveTypeFilter('demand_spike')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${activeTypeFilter === 'demand_spike'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-cyan-400 hover:text-cyan-300'
            }`}
        >
          Spikes ({allAlerts.filter((a) => a.type === 'demand_spike' && !dismissedIds.has(a.id)).length})
        </button>
      </div>

      {/* Alert Feed Items */}
      <div className="space-y-3">
        {visibleAlerts.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/60 text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-200">No Active Alerts In This Category</h4>
            <p className="text-xs text-slate-500">
              {activeAlertsCount === 0
                ? 'All system conditions are nominal or dismissed. Thresholds remain continuously monitored.'
                : 'Select "All" to view alerts in other categories.'}
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${alert.severity === 'critical'
                  ? 'border-rose-800/60 bg-rose-950/20 hover:border-rose-700'
                  : alert.severity === 'high'
                    ? 'border-orange-800/60 bg-orange-950/20 hover:border-orange-700'
                    : 'border-amber-800/60 bg-amber-950/20 hover:border-amber-700'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left: Icon, Badge, Content */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {alert.typeLabel}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-200">{alert.resourceName}</span>
                    </div>

                    <h4 className="font-semibold text-white text-sm">{alert.title}</h4>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {alert.explanation}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>
                        Facility: <strong className="text-slate-200">{alert.location}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Value: <strong className="text-cyan-300 font-mono">{alert.metricValue}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                  {alert.type === 'critical_shortage' && onNavigateToCoordination && (
                    <button
                      onClick={onNavigateToCoordination}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors cursor-pointer"
                    >
                      <span>Resolve</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
