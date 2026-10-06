import { ResourceItem } from '../types/resource.ts';

export interface TransferEvidence {
  targetDeficit: number;
  targetAvailable: number;
  targetRequired: number;
  sourceSurplus: number;
  sourceAvailable: number;
  sourceRequired: number;
  postTransferTargetAvailable: number;
  postTransferSourceAvailable: number;
  safetyBufferMet: boolean;
}

export interface TransferRecommendation {
  id: string;
  shortageResourceId: string;
  resourceName: string;
  category: string;
  sourceLocation: string;
  sourceResourceId?: string;
  targetLocation: string;
  recommendedUnits: number;
  unit: string;
  urgency: 'urgent' | 'high' | 'medium';
  reason: string;
  evidence: TransferEvidence;
  status: 'pending' | 'acknowledged' | 'in_transit';
}

/**
 * Deterministic rule-based coordination engine:
 * 1. Identify all locations experiencing a shortage (available < required).
 * 2. Prioritize by severity: Critical first, then by deficit magnitude.
 * 3. Match each shortage with a candidate donor location holding surplus (available > required)
 *    for the exact resource type.
 * 4. Calculate safe transfer units: Math.min(deficit, surplus), ensuring the donor retains
 *    their minimum required baseline.
 * 5. If no localized donor has surplus, route to the Regional Emergency Reserve.
 * 6. Produce explainable arithmetic evidence for auditability.
 */
export function generateTransferRecommendations(
  resources: ResourceItem[]
): TransferRecommendation[] {
  // Step 1: Detect shortages
  const shortages = resources
    .filter((item) => item.available < item.required)
    .sort((a, b) => {
      // Urgent/critical items first
      if (a.status === 'critical' && b.status !== 'critical') return -1;
      if (b.status === 'critical' && a.status !== 'critical') return 1;
      const deficitA = a.required - a.available;
      const deficitB = b.required - b.available;
      return deficitB - deficitA;
    });

  // Keep track of simulated reserved units so one donor is not over-allocated across multiple transfers
  const allocatedFromSource: Record<string, number> = {};

  const recommendations: TransferRecommendation[] = [];

  for (const target of shortages) {
    const deficit = target.required - target.available;

    // Find donor locations with matching resource name
    const candidateDonors = resources.filter(
      (donor) => donor.id !== target.id && donor.name.toLowerCase() === target.name.toLowerCase()
    );

    // Calculate effective surplus accounting for prior allocations in this cycle
    const viableDonors = candidateDonors
      .map((donor) => {
        const alreadyAllocated = allocatedFromSource[donor.id] || 0;
        const effectiveAvailable = donor.available - alreadyAllocated;
        const surplus = Math.max(0, effectiveAvailable - donor.required);
        return {
          donor,
          effectiveAvailable,
          surplus,
        };
      })
      .filter((d) => d.surplus > 0)
      .sort((a, b) => b.surplus - a.surplus);

    let chosenDonor = viableDonors[0];
    let sourceLocation = '';
    let sourceResourceId: string | undefined = undefined;
    let unitsToTransfer = 0;
    let sourceAvailable = 0;
    let sourceRequired = 0;
    let sourceSurplus = 0;
    let safetyBufferMet = true;

    if (chosenDonor) {
      // We have a local unit with surplus
      sourceLocation = chosenDonor.donor.location;
      sourceResourceId = chosenDonor.donor.id;
      sourceAvailable = chosenDonor.effectiveAvailable;
      sourceRequired = chosenDonor.donor.required;
      sourceSurplus = chosenDonor.surplus;

      // Rule: Transfer what is needed up to available surplus
      unitsToTransfer = Math.min(deficit, sourceSurplus);

      // Book the allocation
      allocatedFromSource[chosenDonor.donor.id] =
        (allocatedFromSource[chosenDonor.donor.id] || 0) + unitsToTransfer;
    } else {
      // Fallback: Dispatch from Regional Logistics Staging Depot
      sourceLocation = 'Regional Emergency Logistics Depot (Reserve Hub)';
      sourceRequired = 0;
      sourceAvailable = deficit * 3;
      sourceSurplus = deficit * 3;
      unitsToTransfer = deficit;
      safetyBufferMet = true;
    }

    const urgency: 'urgent' | 'high' | 'medium' =
      target.status === 'critical' ? 'urgent' : deficit > 10 ? 'high' : 'medium';

    const reason =
      chosenDonor != null
        ? `${target.location} has a deficit of ${deficit} ${target.unit}. Reassign ${unitsToTransfer} ${target.unit} from ${sourceLocation}, which holds a +${sourceSurplus} surplus.`
        : `${target.location} lacks local facility surplus. Dispatch ${unitsToTransfer} ${target.unit} directly from ${sourceLocation}.`;

    const evidence: TransferEvidence = {
      targetDeficit: deficit,
      targetAvailable: target.available,
      targetRequired: target.required,
      sourceSurplus,
      sourceAvailable,
      sourceRequired,
      postTransferTargetAvailable: target.available + unitsToTransfer,
      postTransferSourceAvailable: sourceAvailable - unitsToTransfer,
      safetyBufferMet: sourceAvailable - unitsToTransfer >= sourceRequired,
    };

    recommendations.push({
      id: `rec-${target.id}`,
      shortageResourceId: target.id,
      resourceName: target.name,
      category: target.category,
      sourceLocation,
      sourceResourceId,
      targetLocation: target.location,
      recommendedUnits: unitsToTransfer,
      unit: target.unit,
      urgency,
      reason,
      evidence,
      status: 'pending',
    });
  }

  return recommendations;
}
