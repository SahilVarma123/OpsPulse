export type ResourceCategory =
  | 'Medical & Clinical'
  | 'Mobility & Transport'
  | 'Emergency Equipment'
  | 'Consumables & Blood Bank'
  | 'Energy & Utilities';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type ShortageStatus = 'normal' | 'low' | 'critical';

export interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  location: string;
  total: number;
  used: number;
  available: number;
  required: number;
  unit: string;
  status: ShortageStatus;
  priority: PriorityLevel;
  lastUpdated: string;
}

export interface DashboardStats {
  totalResources: number;
  usedResources: number;
  availableResources: number;
  utilizationPercentage: number;
  criticalCount: number;
  lowCount: number;
  normalCount: number;
}
