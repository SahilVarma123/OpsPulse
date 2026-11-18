import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Droplet,
  Truck,
  Zap,
  Activity,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResourceItem } from '../types/resource.ts';

export interface SectorItem {
  id: string;
  name: string;
  shortName: string;
  categoryMatch: string[];
  icon: React.ReactNode;
  description: string;
  iconBg: string;
}

const SECTOR_DEFINITIONS: SectorItem[] = [
  {
    id: 'health-icu',
    name: 'Critical Health & ICU',
    shortName: 'Critical Health',
    categoryMatch: ['Medical & Clinical', 'Emergency Equipment'],
    icon: <HeartPulse className="w-7 h-7 text-white" />,
    description: 'ICU ventilators, high-flow oxygen cannulas, and cardiac life-support telemetry.',
    iconBg: 'bg-rose-600',
  },
  {
    id: 'gases-wash',
    name: 'Medical Gases & WASH',
    shortName: 'Gases & WASH',
    categoryMatch: ['Emergency Equipment'],
    icon: <Droplet className="w-7 h-7 text-white" />,
    description: 'Liquid cryogenic oxygen, 10L concentrators, and decontamination hygiene buffers.',
    iconBg: 'bg-teal-600',
  },
  {
    id: 'mobility-fleet',
    name: 'Emergency Mobility & Fleet',
    shortName: 'Fleet Mobility',
    categoryMatch: ['Mobility & Transport'],
    icon: <Truck className="w-7 h-7 text-white" />,
    description: 'Advanced Life Support (ALS) ambulances and inter-facility transit vehicles.',
    iconBg: 'bg-amber-600',
  },
  {
    id: 'power-grid',
    name: 'Auxiliary Power & Energy',
    shortName: 'Power Grid',
    categoryMatch: ['Energy & Utilities'],
    icon: <Zap className="w-7 h-7 text-white" />,
    description: '500kVA emergency diesel generators, battery UPS, and mobile grid substations.',
    iconBg: 'bg-orange-600',
  },
  {
    id: 'blood-bank',
    name: 'Blood Bank & Biologicals',
    shortName: 'Blood Reserves',
    categoryMatch: ['Consumables & Blood Bank'],
    icon: <Activity className="w-7 h-7 text-white" />,
    description: 'O-Negative whole blood units, cryo-precipitate plasma, and cold-chain monitoring.',
    iconBg: 'bg-red-700',
  },
  {
    id: 'trauma-triage',
    name: 'Trauma & Disaster Supplies',
    shortName: 'Trauma Triage',
    categoryMatch: ['Medical & Clinical', 'Consumables & Blood Bank'],
    icon: <ShieldAlert className="w-7 h-7 text-white" />,
    description: 'Mass casualty triage packs, chest drainage kits, and surgical hemostatics.',
    iconBg: 'bg-emerald-700',
  },
  {
    id: 'municipal-hub',
    name: 'Municipal Logistics & Depots',
    shortName: 'Municipal Logistics',
    categoryMatch: ['Emergency Equipment', 'Mobility & Transport'],
    icon: <Building2 className="w-7 h-7 text-white" />,
    description: 'Regional central depots, strategic reserve stock, and inter-ward supply corridors.',
    iconBg: 'bg-teal-700',
  },
];

interface SectorCarouselProps {
  resources: ResourceItem[];
  selectedSectorId: string | null;
  onSelectSector: (sector: SectorItem | null) => void;
}

export default function SectorCarousel({
  resources,
  selectedSectorId,
  onSelectSector,
}: SectorCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Compute live readiness for each sector
  const getSectorReadiness = (sector: SectorItem) => {
    const matching = resources.filter((r) =>
      sector.categoryMatch.includes(r.category)
    );
    if (matching.length === 0) return { status: 'optimal', deficits: 0, surpluses: 0, rate: 85 };

    const deficits = matching.filter((r) => r.available < r.required).length;
    const surpluses = matching.filter((r) => r.available > r.required).length;
    const totalAvail = matching.reduce((sum, r) => sum + r.available, 0);
    const totalReq = matching.reduce((sum, r) => sum + r.required, 0);
    const rate = totalReq > 0 ? Math.min(100, Math.round((totalAvail / totalReq) * 100)) : 100;

    const status = deficits > 0 ? 'critical' : rate < 80 ? 'warning' : 'optimal';
    return { status, deficits, surpluses, rate };
  };

  return (
    <section
      aria-label="Critical Operational Sectors Carousel"
      className="relative overflow-hidden rounded-2xl border border-teal-900/60 bg-gradient-to-b from-[#09221F] via-[#0C2B27] to-[#071615] p-6 sm:p-8 shadow-2xl space-y-5"
    >
      {/* Background Cityscape Night Silhouette & Soft Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-teal-950 via-teal-900/40 to-transparent" />
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header with Title and Scroll Arrows */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading tracking-tight">
              Smart Solutions for Healthcare & Operational Sectors
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time sector capacity and preparedness. Click any sector to filter assets and inspect transfer corridors.
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedSectorId && (
            <button
              onClick={() => onSelectSector(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-900 hover:bg-teal-800 text-white border border-teal-700 transition-colors cursor-pointer mr-1"
            >
              Reset Filter
            </button>
          )}

          <button
            onClick={() => handleScroll('left')}
            className="w-9 h-9 rounded-xl bg-[#071C19] hover:bg-[#0E332E] text-slate-200 hover:text-white border border-teal-800/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            aria-label="Scroll sectors left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-9 h-9 rounded-xl bg-[#071C19] hover:bg-[#0E332E] text-slate-200 hover:text-white border border-teal-800/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            aria-label="Scroll sectors right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Smooth Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {SECTOR_DEFINITIONS.map((sector) => {
          const isSelected = selectedSectorId === sector.id;
          const { status, deficits, surpluses, rate } = getSectorReadiness(sector);

          return (
            <div key={sector.id} className="relative group shrink-0 snap-start">
              {/* Floaty Ambient Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300 pointer-events-none bg-teal-500/20" />

              <motion.div
                whileHover={{
                  y: -8,
                  scale: 1.025,
                  transition: { type: 'spring', stiffness: 350, damping: 22 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectSector(isSelected ? null : sector)}
                className={`w-68 sm:w-72 rounded-2xl p-5 cursor-pointer transition-all duration-300 relative border flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-teal-950/60 ${
                  isSelected
                    ? 'bg-[#103D37] border-amber-400 shadow-xl shadow-teal-950/80 ring-2 ring-amber-400/50'
                    : 'bg-[#0A2925]/90 hover:bg-[#0E3833] border-teal-800/60'
                }`}
              >
              <div className="space-y-4">
                {/* Top: Circular Icon Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl ${sector.iconBg} flex items-center justify-center shadow-lg border border-white/20`}
                  >
                    {sector.icon}
                  </div>

                  {status === 'critical' ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span>{deficits} Deficit</span>
                    </span>
                  ) : status === 'warning' ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      High Load
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Optimal</span>
                    </span>
                  )}
                </div>

                {/* Sector Title & Clean Description */}
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    {sector.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-light">
                    {sector.description}
                  </p>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-5 pt-3 border-t border-teal-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-slate-400">Buffer Rate:</span>
                  <span
                    className={`font-bold ${
                      rate < 50
                        ? 'text-rose-400'
                        : rate < 80
                          ? 'text-amber-300'
                          : 'text-emerald-400'
                    }`}
                  >
                    {rate}%
                  </span>
                </div>

                <div className="flex items-center gap-1 text-teal-300 font-semibold group">
                  <span>{isSelected ? 'Filtered' : 'Explore Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
