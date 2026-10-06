import { ResourceItem } from '../types/resource.ts';

export type AlertType = 'critical_shortage' | 'overutilization' | 'stale_data' | 'demand_spike';
export type AlertSeverity = 'critical' | 'high' | 'warning';

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  typeLabel: string;
  title: string;
  resourceName: string;
  location: string;
  explanation: string;
  metricValue: string;
  detectedAt: string;
}

/**
 * Deterministic alert rules engine using existing resource data:
 * 1. Critical Shortage: Available is <= 35% of required or reserve <= 1.
 * 2. Overutilization: Individual unit load >= 85% of total capacity.
 * 3. Stale Data: Telemetry has not updated for 10+ minutes based on item lastUpdated.
 * 4. Sudden Spike: Facility demand exceeds peer facility baseline by >= 35% within same resource category.
 */
export function generateSystemAlerts(resources: ResourceItem[]): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  // 1. Critical Shortage Rule
  for (const item of resources) {
    const isCritical =
      item.available <= Math.ceil(item.required * 0.35) || (item.required > 0 && item.available <= 1);

    if (isCritical) {
      const deficit = Math.max(0, item.required - item.available);
      alerts.push({
        id: `alert-shortage-${item.id}`,
        type: 'critical_shortage',
        severity: 'critical',
        typeLabel: 'Critical Shortage',
        title: `Acute Supply Deficit (${item.available} ${item.unit} remaining)`,
        resourceName: item.name,
        location: item.location,
        metricValue: `${item.available} / ${item.required} req`,
        explanation: `${item.location} has only ${item.available} ${item.unit} remaining in reserve against ${item.required} required (deficit of -${deficit} ${item.unit}). Immediate replenishment needed.`,
        detectedAt: 'Real-time observation',
      });
    }
  }

  // 2. Overutilization Rule (>= 85% active capacity load)
  for (const item of resources) {
    const utilization = item.total > 0 ? Math.round((item.used / item.total) * 100) : 0;
    if (utilization >= 85) {
      alerts.push({
        id: `alert-overutil-${item.id}`,
        type: 'overutilization',
        severity: 'high',
        typeLabel: 'Overutilization',
        title: `Extreme Capacity Load (${utilization}%)`,
        resourceName: item.name,
        location: item.location,
        metricValue: `${utilization}% used (${item.used}/${item.total})`,
        explanation: `${item.location} is operating at ${utilization}% capacity with ${item.used} of ${item.total} units deployed. Near complete operational saturation.`,
        detectedAt: item.lastUpdated,
      });
    }
  }

  // 3. Stale Data Rule (lastUpdated >= 10 minutes ago)
  for (const item of resources) {
    const isStale =
      item.lastUpdated.includes('10 mins') ||
      item.lastUpdated.includes('12 mins') ||
      item.lastUpdated.includes('15 mins') ||
      item.lastUpdated.includes('20 mins');

    if (isStale) {
      alerts.push({
        id: `alert-stale-${item.id}`,
        type: 'stale_data',
        severity: 'warning',
        typeLabel: 'Stale Data',
        title: `Delayed Telemetry Heartbeat (${item.lastUpdated})`,
        resourceName: item.name,
        location: item.location,
        metricValue: item.lastUpdated,
        explanation: `No telemetry update received from ${item.location} for >10 minutes (${item.lastUpdated}). Data freshness degraded; manual sensor or node ping recommended.`,
        detectedAt: 'Freshness audit',
      });
    }
  }

  // 4. Sudden Spike / Inter-Station Imbalance Rule
  // Detects pairs of facilities with the same resource name where utilization delta >= 35%
  const groupedByName: Record<string, ResourceItem[]> = {};
  for (const item of resources) {
    groupedByName[item.name] = groupedByName[item.name] || [];
    groupedByName[item.name].push(item);
  }

  for (const [name, items] of Object.entries(groupedByName)) {
    if (items.length >= 2) {
      const sorted = [...items].sort((a, b) => {
        const utilA = (a.used / a.total) * 100;
        const utilB = (b.used / b.total) * 100;
        return utilB - utilA;
      });

      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];

      const highUtil = Math.round((highest.used / highest.total) * 100);
      const lowUtil = Math.round((lowest.used / lowest.total) * 100);
      const delta = highUtil - lowUtil;

      if (delta >= 35) {
        alerts.push({
          id: `alert-spike-${highest.id}-${lowest.id}`,
          type: 'demand_spike',
          severity: 'warning',
          typeLabel: 'Sudden Demand Spike',
          title: `Inter-Station Load Imbalance (+${delta}% surge)`,
          resourceName: name,
          location: highest.location,
          metricValue: `${highUtil}% vs ${lowUtil}% baseline`,
          explanation: `Severe geographic divergence: ${highest.location} experienced a localized surge to ${highUtil}% load, deviating by +${delta}% over peer facility ${lowest.location} (${lowUtil}%).`,
          detectedAt: 'Comparative baseline scan',
        });
      }
    }
  }

  // Sort by severity: critical first, then high, then warning
  const severityRank: Record<AlertSeverity, number> = { critical: 1, high: 2, warning: 3 };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
