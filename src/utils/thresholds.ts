import { ResourceItem, ShortageStatus } from '../types/resource.ts';

export interface ThresholdResult {
  status: ShortageStatus;
  deficit: number;
  reason: string;
}

/**
 * Deterministic calculation for resource status:
 * - Critical: Available is <= 35% of required, or available <= 1 with active demand, or utilization >= 90%
 * - Low: Available is < required, or utilization >= 75%
 * - Normal: Sufficient available stock meeting required threshold and healthy utilization
 */
export function evaluateResourceThreshold(
  available: number,
  required: number,
  total: number,
  used: number
): ThresholdResult {
  const utilization = total > 0 ? (used / total) * 100 : 0;
  const deficit = Math.max(0, required - available);

  if (available <= Math.ceil(required * 0.35) || (required > 0 && available <= 1) || utilization >= 90) {
    return {
      status: 'critical',
      deficit,
      reason:
        available <= 1
          ? 'Only 1 or fewer units remaining in reserve'
          : utilization >= 90
          ? `Extreme capacity load (${Math.round(utilization)}% used)`
          : `Severe deficit: ${available} available vs ${required} required`,
    };
  }

  if (available < required || utilization >= 75) {
    return {
      status: 'low',
      deficit,
      reason:
        deficit > 0
          ? `Below required threshold by ${deficit} unit(s)`
          : `Elevated utilization (${Math.round(utilization)}% used)`,
    };
  }

  return {
    status: 'normal',
    deficit: 0,
    reason: 'Adequate reserves meeting required baseline',
  };
}

export interface ShortageSummary {
  criticalCount: number;
  lowCount: number;
  normalCount: number;
  totalDeficitUnits: number;
  impactedLocations: string[];
}

export function computeShortageSummary(resources: ResourceItem[]): ShortageSummary {
  let criticalCount = 0;
  let lowCount = 0;
  let normalCount = 0;
  let totalDeficitUnits = 0;
  const locationsSet = new Set<string>();

  for (const item of resources) {
    const { status, deficit } = evaluateResourceThreshold(
      item.available,
      item.required,
      item.total,
      item.used
    );

    if (status === 'critical') {
      criticalCount++;
      locationsSet.add(item.location);
    } else if (status === 'low') {
      lowCount++;
      locationsSet.add(item.location);
    } else {
      normalCount++;
    }

    totalDeficitUnits += deficit;
  }

  return {
    criticalCount,
    lowCount,
    normalCount,
    totalDeficitUnits,
    impactedLocations: Array.from(locationsSet),
  };
}

export interface AnomalyEvaluation {
  isAnomaly: boolean;
  type?: 'usage_spike' | 'availability_collapse';
  metric?: string;
  reason?: string;
}

/**
 * Deterministic percentage-threshold anomaly detection rule:
 * Flags an anomaly when:
 * 1. Usage Spike Anomaly: Utilization >= 90% (disproportionate operational strain).
 * 2. Availability Collapse Anomaly: Available stock <= 20% of required baseline.
 */
export function detectResourceAnomaly(item: ResourceItem): AnomalyEvaluation {
  const utilization = item.total > 0 ? (item.used / item.total) * 100 : 0;
  const availRatio = item.required > 0 ? (item.available / item.required) * 100 : 100;

  if (utilization >= 90) {
    return {
      isAnomaly: true,
      type: 'usage_spike',
      metric: `${Math.round(utilization)}% Load`,
      reason: `Usage Spike Anomaly: Operating at ${Math.round(utilization)}% capacity load (≥90% anomaly threshold)`,
    };
  }

  if (item.required > 0 && availRatio <= 20) {
    return {
      isAnomaly: true,
      type: 'availability_collapse',
      metric: `${Math.round(availRatio)}% Buffer`,
      reason: `Availability Collapse: Reserves dropped to ${Math.round(availRatio)}% of required baseline (≤20% threshold)`,
    };
  }

  return { isAnomaly: false };
}

